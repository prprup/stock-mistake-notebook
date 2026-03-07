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
  
  // 参数校验：stockName和stockCode不能为空
  if (!stockName || !stockName.trim()) {
    return {
      success: false,
      error: '股票名称不能为空'
    }
  }
  
  if (!stockCode || !stockCode.trim()) {
    return {
      success: false,
      error: '股票代码不能为空'
    }
  }
  
  try {
    const db = cloud.database()
    const now = new Date()
    
    // 使用数据库事务包裹添加错题和更新用户计数
    const transaction = await db.startTransaction()
    
    try {
      // 添加错题记录
      const result = await transaction.collection('mistakes').add({
        data: {
          _openid: OPENID,
          stockName: stockName.trim(),
          stockCode: stockCode.trim(),
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
      await transaction.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          mistakeCount: db.command.inc(1),
          updateTime: now
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        data: {
          _id: result._id
        }
      }
    } catch (err) {
      // 事务回滚
      await transaction.rollback()
      throw err
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
