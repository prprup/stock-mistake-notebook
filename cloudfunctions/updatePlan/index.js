const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id, ...updateData } = event
  
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
      return { success: false, error: '无权修改' }
    }
    
    const dataToUpdate = {
      ...updateData,
      updateTime: new Date()
    }
    
    // 如果标记为执行，记录执行时间
    if (updateData.status === 'executed' && !plan.data.executeTime) {
      dataToUpdate.executeTime = new Date()
    }
    
    await db.collection('plans').doc(id).update({
      data: dataToUpdate
    })
    
    return { success: true }
  } catch (err) {
    console.error('Update plan error:', err)
    return { success: false, error: err.message }
  }
}