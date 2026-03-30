const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event
  
  if (!id) {
    return { success: false, error: '预案ID不能为空' }
  }
  
  try {
    const db = cloud.database()
    const transaction = await db.startTransaction()

    try {
      const plan = await transaction.collection('plans').doc(id).get()
      if (!plan.data) {
        await transaction.rollback()
        return { success: false, error: '预案不存在' }
      }
      if (plan.data._openid !== OPENID) {
        await transaction.rollback()
        return { success: false, error: '无权删除' }
      }
      
      await transaction.collection('plans').doc(id).remove()
      await transaction.commit()
      
      return { success: true }
    } catch (innerErr) {
      await transaction.rollback()
      throw innerErr
    }
  } catch (err) {
    console.error('Delete plan error:', err)
    return { success: false, error: err.message }
  }
}
