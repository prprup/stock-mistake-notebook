const cloud = require('wx-server-sdk')
cloud.init()

// 允许更新的字段白名单
const ALLOWED_FIELDS = [
  'stockName',
  'stockCode',
  'mistakeTypes',
  'emotion',
  'reflection',
  'lossAmount',
  'date',
  'action',
  'price',
  'quantity',
  'planId'
]

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id, ...updateData } = event
  
  if (!id) {
    return { success: false, error: '记录ID不能为空' }
  }
  
  try {
    const db = cloud.database()
    
    // 检查权限
    const record = await db.collection('mistakes').doc(id).get()
    if (!record.data) {
      return { success: false, error: '记录不存在' }
    }
    if (record.data._openid !== OPENID) {
      return { success: false, error: '无权修改' }
    }
    
    // 使用白名单过滤，只保留允许的字段
    const filteredData = {}
    for (const field of ALLOWED_FIELDS) {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field]
      }
    }
    
    await db.collection('mistakes').doc(id).update({
      data: {
        ...filteredData,
        updateTime: new Date()
      }
    })
    
    return {
      success: true
    }
  } catch (err) {
    console.error('Update mistake error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
