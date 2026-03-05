const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { page = 1, pageSize = 20, startDate, endDate } = event
  
  try {
    const db = cloud.database()
    const _ = db.command
    
    let whereCondition = {
      _openid: OPENID
    }
    
    // 日期筛选
    if (startDate || endDate) {
      whereCondition.date = {}
      if (startDate) whereCondition.date.gte = new Date(startDate)
      if (endDate) whereCondition.date.lte = new Date(endDate)
    }
    
    const { data } = await db.collection('mistakes')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    // 获取总数
    const countResult = await db.collection('mistakes')
      .where(whereCondition)
      .count()
    
    return {
      success: true,
      data: {
        list: data,
        total: countResult.total,
        page,
        pageSize
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
