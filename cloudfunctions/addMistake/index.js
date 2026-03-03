const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { 
    stockName, 
    stockCode, 
    mistakeTypes, 
    emotion, 
    reflection, 
    lossAmount, 
    date,
    images = []
  } = event
  
  try {
    const db = cloud.database()
    const now = new Date()
    
    // 添加错题记录
    const result = await db.collection('mistakes').add({
      data: {
        _openid: OPENID,
        stockName,
        stockCode,
        mistakeTypes: mistakeTypes || [],
        emotion: emotion || '',
        reflection: reflection || '',
        lossAmount: lossAmount || 0,
        date: date || now,
        images,
        createTime: now,
        updateTime: now
      }
    })
    
    // 更新用户错题计数
    await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: {
        mistakeCount: db.command.inc(1),
        updateTime: now
      }
    })
    
    return {
      success: true,
      data: {
        _id: result._id
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
