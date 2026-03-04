const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { 
    stockName, 
    stockCode, 
    action, 
    date,
    targetPrice,
    stopLoss,
    takeProfit,
    position,
    triggerCondition,
    reason
  } = event
  
  if (!stockName || !stockCode || !targetPrice) {
    return { success: false, error: '股票信息和目标价位不能为空' }
  }
  
  try {
    const db = cloud.database()
    const now = new Date()
    
    const result = await db.collection('plans').add({
      data: {
        _openid: OPENID,
        stockName,
        stockCode,
        action: action || 'buy',
        date: date || now,
        targetPrice,
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
        position: position || 0,
        triggerCondition: triggerCondition || '',
        reason: reason || '',
        status: 'pending',
        createTime: now,
        updateTime: now
      }
    })
    
    return {
      success: true,
      data: { _id: result._id }
    }
  } catch (err) {
    console.error('Add plan error:', err)
    return { success: false, error: err.message }
  }
}