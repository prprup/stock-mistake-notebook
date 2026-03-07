const cloud = require('wx-server-sdk')
cloud.init()
const axios = require('axios')

// Tushare API 配置 - 从环境变量读取
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN

if (!TUSHARE_TOKEN) {
  console.error('TUSHARE_TOKEN not set in environment variables')
}
const TUSHARE_API = 'http://api.tushare.pro'

exports.main = async (event, context) => {
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
    
    // 先查数据库是否有缓存
    const cacheKey = `${tsCode}_${startDate}_${endDate}`
    const { data: cacheData } = await db.collection('kline_cache').where({
      cacheKey
    }).get()
    
    // 缓存有效（2小时内）直接返回
    if (cacheData.length > 0) {
      const cache = cacheData[0]
      const cacheTime = new Date(cache.updateTime).getTime()
      const now = Date.now()
      if (now - cacheTime < 2 * 60 * 60 * 1000) {
        return {
          success: true,
          data: cache.klineData,
          fromCache: true
        }
      }
    }
    
    // 调用 Tushare API
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
      return {
        success: false,
        error: response.data.msg || '获取数据失败'
      }
    }
    
    // 解析数据
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
          cacheKey,
          tsCode,
          startDate,
          endDate,
          klineData,
          createTime: new Date(),
          updateTime: new Date()
        }
      })
    }
    
    return {
      success: true,
      data: klineData,
      fromCache: false
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
