const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 获取用户统计信息
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    // 获取积分信息
    const pointsResult = await db.collection('user_points').where({
      _openid: openid
    }).get()

    const pointsData = pointsResult.data[0] || {
      points: 0,
      totalPoints: 0,
      checkInStreak: 0
    }

    // 获取错题总数
    const mistakeCountResult = await db.collection('mistakes').where({
      _openid: openid
    }).count()

    // 获取本月错题数
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const monthCountResult = await db.collection('mistakes').where({
      _openid: openid,
      createTime: db.command.gte(monthStart).and(db.command.lte(monthEnd))
    }).count()

    return {
      code: 0,
      data: {
        points: pointsData.points || 0,
        totalPoints: pointsData.totalPoints || 0,
        checkInStreak: pointsData.checkInStreak || 0,
        totalMistakes: mistakeCountResult.total,
        monthMistakes: monthCountResult.total
      }
    }
  } catch (err) {
    console.error('获取用户统计失败:', err)
    return {
      code: -1,
      message: '获取失败',
      error: err.message
    }
  }
}