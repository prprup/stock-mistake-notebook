const cloud = require('wx-server-sdk')
cloud.init()
const axios = require('axios')

// Tushare API 配置
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN
const TUSHARE_API = 'http://api.tushare.pro'

function normalizeTsCode(value = '') {
  return String(value || '').trim().toUpperCase()
}

function toTradeDate8(value) {
  if (!value) return ''
  if (typeof value === 'string') {
    const direct = value.replace(/[^\d]/g, '')
    if (/^\d{8}$/.test(direct)) return direct
  }
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { tsCode, stockCode, startDate, endDate } = event
  const normalizedTsCode = normalizeTsCode(tsCode || stockCode)
  
  // 参数校验
  if (!normalizedTsCode) {
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
    
    // 获取用户的错题记录：兼容 stockCode=tsCode 的旧数据，也兼容未来 stockSymbol 字段
    const mistakeQuery = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        stockCode: normalizedTsCode
      })
      .get()
    const mistakes = (mistakeQuery.data || []).map(item => ({
      ...item,
      normalizedTradeDate: toTradeDate8(item.tradeDate || item.date || item.createTime),
      normalizedTsCode: normalizeTsCode(item.stockCode || item.tsCode || item.stockTsCode)
    }))
    
    // 获取K线数据（从缓存或API）
    let klineData = []
    const cacheKey = `${normalizedTsCode}_${startDate}_${endDate}`
    const { data: cacheData } = await db.collection('kline_cache').where({
      cacheKey
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
      klineData = await fetchKlineData(normalizedTsCode, startDate, endDate)
      
      // 存入缓存
      if (cacheData.length > 0) {
        await db.collection('kline_cache').doc(cacheData[0]._id).update({
          data: {
            klineData,
            tsCode: normalizedTsCode,
            updateTime: new Date()
          }
        })
      } else {
        await db.collection('kline_cache').add({
          data: {
            cacheKey,
            tsCode: normalizedTsCode,
            startDate,
            endDate,
            klineData,
            createTime: new Date(),
            updateTime: new Date()
          }
        })
      }
    }
    
    // 标记错题位置：统一用 YYYYMMDD 交易日比较，避免 Date/String/时区导致挂点失败
    const mistakesByDate = new Map()
    for (const m of mistakes) {
      if (!m.normalizedTradeDate) continue
      if (!mistakesByDate.has(m.normalizedTradeDate)) {
        mistakesByDate.set(m.normalizedTradeDate, [])
      }
      mistakesByDate.get(m.normalizedTradeDate).push(m)
    }

    const markedKline = klineData.map(k => {
      const dayMistakes = mistakesByDate.get(k.date) || []
      const primaryMistake = dayMistakes[0] || null
      return {
        ...k,
        hasMistake: dayMistakes.length > 0,
        mistakeCount: dayMistakes.length,
        mistakeItems: dayMistakes.map(m => ({
          _id: m._id,
          date: m.tradeDate || m.date || m.createTime,
          tradeDate: m.tradeDate || m.date || m.createTime,
          mistakeTypes: m.mistakeTypes || [],
          reflection: m.reflection || '',
          emotion: m.emotion || '',
          lossAmount: m.lossAmount || 0
        })),
        mistakeInfo: primaryMistake ? {
          types: primaryMistake.mistakeTypes || [],
          reflection: primaryMistake.reflection || '',
          lossAmount: primaryMistake.lossAmount || 0,
          count: dayMistakes.length
        } : null
      }
    })
    
    const mistakeList = mistakes
      .slice()
      .sort((a, b) => String(b.normalizedTradeDate || '').localeCompare(String(a.normalizedTradeDate || '')))
      .map(m => ({
        _id: m._id,
        stockCode: m.stockCode,
        tradeDate: m.tradeDate || m.date || m.createTime,
        date: m.tradeDate || m.date || m.createTime,
        normalizedTradeDate: m.normalizedTradeDate,
        mistakeTypes: m.mistakeTypes || [],
        reflection: m.reflection || '',
        emotion: m.emotion || '',
        lossAmount: m.lossAmount || 0
      }))

    return {
      success: true,
      data: {
        tsCode: normalizedTsCode,
        klineData: markedKline,
        mistakeCount: mistakes.length,
        mistakeList
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
