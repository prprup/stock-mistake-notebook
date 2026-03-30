const cloud = require('wx-server-sdk')
cloud.init()

// 允许更新的字段白名单
const ALLOWED_FIELDS = [
  'stockName',
  'stockCode',
  'action',
  'date',
  'targetPrice',
  'stopLoss',
  'takeProfit',
  'position',
  'triggerCondition',
  'reason',
  'status',
  'mistakeId',
  'executeTime'
]

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
    
    // 使用白名单过滤，只保留允许的字段
    const filteredData = {}
    for (const field of ALLOWED_FIELDS) {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field]
      }
    }
    
    // 如果更新了 date 字段，确保是 Date 类型
    if (filteredData.date && !(filteredData.date instanceof Date)) {
      const dateObj = new Date(filteredData.date)
      if (!isNaN(dateObj.getTime())) {
        filteredData.date = dateObj
      }
    }
    
    const dataToUpdate = {
      ...filteredData,
      updateTime: new Date()
    }
    
    // 如果标记为执行，记录执行时间
    if (filteredData.status === 'executed' && !plan.data.executeTime) {
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
