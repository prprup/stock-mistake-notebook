const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const db = cloud.database()
    const _ = db.command
    
    // 获取用户错题数量
    const mistakeCount = await db.collection('mistakes')
      .where({
        _openid: OPENID
      })
      .count()
    
    // 获取用户信息
    const { data: userData } = await db.collection('users')
      .where({
        _openid: OPENID
      })
      .get()
    
    const user = userData.length > 0 ? userData[0] : {}
    
    // 计算连续打卡天数
    const streak = await calculateStreak(db, OPENID)
    
    return {
      success: true,
      data: {
        user: {
          nickname: user.nickname || '微信用户',
          id: user._id || '',
          avatarUrl: user.avatarUrl || ''
        },
        stats: {
          mistakes: mistakeCount.total || 0,
          streak: streak  // 连续打卡天数
        }
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 计算连续打卡天数
async function calculateStreak(db, openid) {
  try {
    const _ = db.command
    
    // 获取最近30天的错题记录，按日期分组
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: mistakes } = await db.collection('mistakes')
      .where({
        _openid: openid,
        createTime: _.gte(thirtyDaysAgo)
      })
      .orderBy('createTime', 'desc')
      .get()
    
    if (mistakes.length === 0) {
      return 0
    }
    
    // 提取有记录的日期（去重）
    const recordDates = new Set()
    mistakes.forEach(item => {
      const date = new Date(item.createTime || item.date)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      recordDates.add(dateStr)
    })
    
    // 计算连续天数
    const today = new Date()
    let streak = 0
    let checkDate = new Date(today)
    
    // 检查今天是否有记录
    const todayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
    
    // 如果今天没有记录，从昨天开始算
    if (!recordDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // 向前遍历计算连续天数
    while (true) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      
      if (recordDates.has(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
      
      // 防止无限循环，最多查30天
      if (streak >= 30) {
        break
      }
    }
    
    return streak
  } catch (err) {
    console.error('Calculate streak error:', err)
    return 0
  }
}
