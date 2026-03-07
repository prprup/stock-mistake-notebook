const cloud = require('wx-server-sdk')
cloud.init()

// 日期格式校验函数
const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  let { page = 1, pageSize = 20, startDate, endDate, mistakeType } = event
  
  // 参数校验：page和pageSize参数校验（防止负数或过大值）
  page = parseInt(page) || 1
  pageSize = parseInt(pageSize) || 20
  
  if (page < 1) {
    return {
      success: false,
      error: '页码不能小于1'
    }
  }
  
  if (pageSize < 1) {
    return {
      success: false,
      error: '每页条数不能小于1'
    }
  }
  
  // 限制最大每页条数为100
  if (pageSize > 100) {
    pageSize = 100
  }
  
  // 日期格式校验
  if (startDate && !isValidDate(startDate)) {
    return {
      success: false,
      error: '开始日期格式不正确，应为YYYY-MM-DD格式'
    }
  }
  
  if (endDate && !isValidDate(endDate)) {
    return {
      success: false,
      error: '结束日期格式不正确，应为YYYY-MM-DD格式'
    }
  }
  
  // 错误类型校验
  if (mistakeType && typeof mistakeType !== 'string') {
    return {
      success: false,
      error: '错误类型格式不正确'
    }
  }
  
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
    
    // 错误类型筛选 - 使用数组包含查询
    if (mistakeType && mistakeType.trim()) {
      whereCondition.mistakeTypes = _.all([mistakeType.trim()])
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
