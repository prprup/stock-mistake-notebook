const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event
  
  if (!id) {
    return { success: false, error: '记录ID不能为空' }
  }
  
  const db = cloud.database()
  const _ = db.command
  
  try {
    // 使用事务包裹删除记录和更新计数两个操作
    const transaction = await db.startTransaction()
    
    try {
      // 1. 删除错题记录
      const deleteResult = await transaction.collection('mistakes').where({
        _openid: OPENID,
        _id: id
      }).remove()
      
      if (deleteResult.stats.removed === 0) {
        await transaction.rollback()
        return { success: false, error: '记录不存在或无权删除' }
      }
      
      // 2. 更新用户错题计数
      await transaction.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          mistakeCount: _.inc(-1),
          updateTime: new Date()
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true
      }
    } catch (err) {
      // 事务内部错误，回滚
      await transaction.rollback()
      throw err
    }
  } catch (err) {
    console.error('Delete mistake error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
