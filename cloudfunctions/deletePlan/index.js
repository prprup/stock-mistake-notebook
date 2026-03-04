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
    
    // 检查权限
    const plan = await db.collection('plans').doc(id).get()
    if (!plan.data) {
      return { success: false, error: '预案不存在' }
    }
    if (plan.data._openid !== OPENID) {
      return { success: false, error: '无权删除' }
    }
    
    await db.collection('plans').doc(id).remove()
    
    return { success: true }
  } catch (err) {
    console.error('Delete plan error:', err)
    return { success: false, error: err.message }
  }
}