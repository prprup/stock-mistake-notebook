const cloud = require('wx-server-sdk')
cloud.init()
const axios = require('axios')

// Tushare API 配置
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN
const TUSHARE_API = 'http://api.tushare.pro'

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { tsCode, startDate, endDate } = event
  
  // 参数校验
  if (!tsCode) {
    return { success: false, error: '股票代码不能为空' }
  }
  if (!startDate || !endDate) {
    return { success: false, error: '开始日期和结束日期不能为空' }
  }
  if (!/^\d{8}$/.test(startDate) || !/^\d{8}$/.test(endDate)) {
    return { success: false, error: '日期格式应为YYYYMMDD' }
  }
  
  try {
    const db = cloud.database()
    
    // 获取用户的错题记录
    const { data: mistakes } = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        stockCode: tsCode
      })
      .get()
    
    // 获取K线数据（从缓存或API）
    let klineData = []
    const { data: cacheData } = await db.collection('kline_cache').where({
      cacheKey: `${tsCode}_${startDate}_${endDate}`
    }).get()
    
    if (cacheData.length > 0) {
      // 缓存有效（2小时内）直接返回
      const cache = cacheData[0]
      const cacheTime = new Date(cache.updateTime).getTime()
      const now = Date.now()
      if (now - cacheTime < 2 * 60 * 60 * 1000) {
        klineData = cache.klineData
      }
    }
    
    // 缓存不存在或已过期，从API获取
    if (klineData.length === 0) {
      klineData = await fetchKlineData(tsCode, startDate, endDate)
      
      // 存入缓存
      if (cacheData.length > 0) {
        await db.collection('kline_cache').doc(cacheData[0]._id).update({
          data: {
            klineData,
            updateTime: new Date()
          }
        })
      } else {
        await db.collection('kline_cache').add({
          data: {
            cacheKey: `${tsCode}_${startDate}_${endDate}`,
            tsCode,
            startDate,
            endDate,
            klineData,
            createTime: new Date(),
            updateTime: new Date()
          }
        })
      }
    }
    
    // 标记错题位置
    const markedKline = klineData.map(k => {
      const mistake = mistakes.find(m => {
        const mistakeDate = m.date ? m.date.split('T')[0].replace(/-/g, '') : ''
        return mistakeDate === k.date
      })
      return {
        ...k,
        hasMistake: !!mistake,
        mistakeInfo: mistake ? {
          types: mistake.mistakeTypes,
          reflection: mistake.reflection,
          lossAmount: mistake.lossAmount
        } : null
      }
    })
    
    return {
      success: true,
      data: {
        klineData: markedKline,
        mistakeCount: mistakes.length
      }
    }
  } catch (err) {
    console.error('Get kline with mistakes error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * 从 Tushare API 获取K线数据
 */
async function fetchKlineData(tsCode, startDate, endDate) {
  if (!TUSHARE_TOKEN) {
    throw new Error('TUSHARE_TOKEN not configured')
  }
  
  const response = await axios.post(TUSHARE_API, {
    api_name: 'daily',
    token: TUSHARE_TOKEN,
    params: {
      ts_code: tsCode,
      start_date: startDate,
      end_date: endDate
    },
    fields: 'trade_date,open,high,low,close,vol,amount'
  })
  
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '获取数据失败')
  }
  
  const fields = response.data.data.fields
  const items = response.data.data.items
  
  const klineData = items.map(item => {
    const obj = {}
    fields.forEach((field, index) => {
      obj[field] = item[index]
    })
    return {
      date: obj.trade_date,
      open: obj.open,
      high: obj.high,
      low: obj.low,
      close: obj.close,
      volume: obj.vol,
      amount: obj.amount
    }
  }).reverse() // 按日期正序
  
  return klineData
}
