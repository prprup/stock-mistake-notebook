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
    
    // 日期筛选 - 支持字符串日期或Date对象
    if (date) {
      // 如果是字符串格式 YYYY-MM-DD，转换为日期范围查询
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const startOfDay = new Date(date + 'T00:00:00.000Z')
        const endOfDay = new Date(date + 'T23:59:59.999Z')
        where.date = _.gte(startOfDay).and(_.lte(endOfDay))
      } else {
        where.date = date
      }
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
