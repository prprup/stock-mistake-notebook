const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command

  try {
    // 获取本周的起始时间（周一），使用北京时间
    const now = new Date()
    const utcOffset = 8 * 60 // 北京时间 UTC+8
    const beijingTime = new Date(now.getTime() + (utcOffset + now.getTimezoneOffset()) * 60000)
    const dayOfWeek = beijingTime.getDay() || 7 // 周日是0，转为7
    const weekStart = new Date(beijingTime)
    weekStart.setDate(beijingTime.getDate() - dayOfWeek + 1)
    weekStart.setHours(0, 0, 0, 0)

    // 本周结束时间（周日23:59:59）
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // 1. 获取本周所有错题记录（用于统计错误类型）
    const { data: weeklyMistakes } = await db.collection('mistakes')
      .where({
        date: _.gte(weekStart).and(_.lte(weekEnd))
      })
      .get()

    // 2. 统计所有错误类型
    const typeCount = {}
    const uniqueUsers = new Set()
    
    weeklyMistakes.forEach(item => {
      // 统计独立用户数
      if (item._openid) {
        uniqueUsers.add(item._openid)
      }
      
      // 统计错误类型
      if (item.mistakeTypes && Array.isArray(item.mistakeTypes)) {
        item.mistakeTypes.forEach(type => {
          if (!typeCount[type]) {
            typeCount[type] = { count: 0, users: new Set() }
          }
          typeCount[type].count++
          typeCount[type].users.add(item._openid)
        })
      }
    })

    // 3. 获取当前用户的错误类型
    const { data: userMistakes } = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        date: _.gte(weekStart).and(_.lte(weekEnd))
      })
      .get()
    
    const userTypes = new Set()
    userMistakes.forEach(item => {
      if (item.mistakeTypes && Array.isArray(item.mistakeTypes)) {
        item.mistakeTypes.forEach(type => userTypes.add(type))
      }
    })

    // 4. 转换为数组并排序，取TOP3
    const typeRank = Object.entries(typeCount)
      .map(([type, data]) => ({
        type,
        count: data.count,
        userCount: data.users.size
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // 5. 计算总错误次数（用于百分比计算）
    const totalMistakes = weeklyMistakes.length
    
    // 6. 计算百分比并标记用户是否也有这个错误
    const top3WithPercent = typeRank.map((item, index) => ({
      rank: index + 1,
      type: item.type,
      count: item.count,
      userCount: item.userCount,
      percent: totalMistakes > 0 ? Math.round((item.count / totalMistakes) * 100) : 0,
      hasSameMistake: userTypes.has(item.type)
    }))

    // 7. 估算参与人数（独立用户数，至少为1）
    const participantCount = Math.max(uniqueUsers.size, 1)

    return {
      success: true,
      data: {
        weekRange: {
          start: formatDate(weekStart),
          end: formatDate(weekEnd)
        },
        participantCount,
        totalMistakes,
        top3: top3WithPercent
      }
    }
  } catch (err) {
    console.error('Get ranking stats error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
