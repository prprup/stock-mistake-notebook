const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { tsCode, startDate, endDate } = event
  
  try {
    const db = cloud.database()
    
    // 获取用户的错题记录
    const { data: mistakes } = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        stockCode: tsCode
      })
      .get()
    
    // 获取K线数据（调用另一个云函数或直接从缓存查）
    const { data: cacheData } = await db.collection('kline_cache').where({
      tsCode,
      startDate: db.command.lte(startDate),
      endDate: db.command.gte(endDate)
    }).get()
    
    let klineData = []
    if (cacheData.length > 0) {
      // 过滤日期范围
      klineData = cacheData[0].klineData.filter(k => 
        k.date >= startDate && k.date <= endDate
      )
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
    return {
      success: false,
      error: err.message
    }
  }
}
