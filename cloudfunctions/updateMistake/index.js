const cloud = require('wx-server-sdk')
cloud.init()

const { checkIdempotency, updateIdempotencyResult } = require('../utils/idempotency.js')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id, idempotencyKey, ...updateData } = event
  
  if (!id) {
    return { success: false, error: '缺少记录ID' }
  }
  
  // 生成幂等键
  const key = idempotencyKey || `update_${OPENID}_${id}_${JSON.stringify(updateData)}`
  
  try {
    // 幂等性检查
    const idempotencyCheck = await checkIdempotency(key, 300)
    if (!idempotencyCheck.isNew) {
      return {
        success: true,
        data: idempotencyCheck.existingResult,
        isDuplicate: true
      }
    }
    
    const db = cloud.database()
    
    // 先查询记录是否存在
    const { data } = await db.collection('mistakes').where({
      _openid: OPENID,
      _id: id
    }).get()
    
    if (data.length === 0) {
      return { success: false, error: '记录不存在或无权修改' }
    }
    
    // 执行更新
    await db.collection('mistakes').doc(id).update({
      data: {
        ...updateData,
        updateTime: new Date()
      }
    })
    
    const result = { updated: true }
    await updateIdempotencyResult(key, result)
    
    return {
      success: true,
      data: result
    }
  } catch (err) {
    console.error('Update mistake error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
