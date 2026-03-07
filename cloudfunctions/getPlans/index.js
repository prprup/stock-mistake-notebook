const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  let { date, status, limit = 50 } = event
  
  // 添加limit参数上限限制（最大100）
  limit = parseInt(limit) || 50
  if (limit < 1) {
    limit = 1
  }
  if (limit > 100) {
    limit = 100
  }
  
  try {
    const db = cloud.database()
    const _ = db.command
    
    let where = { _openid: OPENID }
    
    if (date) {
      where.date = date
    }
    
    if (status) {
      where.status = status
    }
    
    const result = await db.collection('plans')
      .where(where)
      .orderBy('date', 'desc')
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    console.error('Get plans error:', err)
    return { success: false, error: err.message }
  }
}
