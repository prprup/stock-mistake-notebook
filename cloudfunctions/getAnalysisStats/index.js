const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command
  const $ = db.command.aggregate

  try {
    // 1. 获取总错题数
    const totalResult = await db.collection('mistakes')
      .where({ _openid: OPENID })
      .count()
    const totalMistakes = totalResult.total

    // 2. 获取本月错题数（使用北京时间）
    const now = new Date()
    const utcOffset = 8 * 60
    const beijingTime = new Date(now.getTime() + (utcOffset + now.getTimezoneOffset()) * 60000)
    const thisMonthStart = new Date(beijingTime.getFullYear(), beijingTime.getMonth(), 1)
    const thisMonthResult = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        date: _.gte(thisMonthStart)
      })
      .count()
    const thisMonth = thisMonthResult.total

    // 3. 计算改进率（本月 vs 上月）
    const lastMonthStart = new Date(beijingTime.getFullYear(), beijingTime.getMonth() - 1, 1)
    const lastMonthEnd = new Date(beijingTime.getFullYear(), beijingTime.getMonth(), 0)
    const lastMonthResult = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        date: _.gte(lastMonthStart).and(_.lte(lastMonthEnd))
      })
      .count()
    const lastMonth = lastMonthResult.total

    let improvement = 0
    if (lastMonth > 0) {
      improvement = Math.round(((lastMonth - thisMonth) / lastMonth) * 100)
    } else if (thisMonth > 0) {
      improvement = 0 // 上月无数据，本月有数据，不算改进
    } else {
      improvement = 0 // 都无数据
    }

    // 4. 获取错误类型分布统计
    const mistakesResult = await db.collection('mistakes')
      .where({ _openid: OPENID })
      .get()

    const mistakeTypes = {}
    mistakesResult.data.forEach(item => {
      if (item.mistakeTypes && Array.isArray(item.mistakeTypes)) {
        item.mistakeTypes.forEach(type => {
          mistakeTypes[type] = (mistakeTypes[type] || 0) + 1
        })
      }
    })

    // 转换为数组并排序
    const typeRank = Object.entries(mistakeTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 计算百分比
    const maxCount = typeRank.length > 0 ? typeRank[0].count : 0
    typeRank.forEach(item => {
      item.percent = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
    })

    // 5. 获取情绪与错误关联统计
    const emotions = {}
    mistakesResult.data.forEach(item => {
      if (item.emotion) {
        emotions[item.emotion] = (emotions[item.emotion] || 0) + 1
      }
    })

    const emotionStats = Object.entries(emotions)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)

    // 计算百分比
    const totalEmotions = emotionStats.reduce((sum, item) => sum + item.count, 0)
    emotionStats.forEach(item => {
      item.rate = totalEmotions > 0 ? Math.round((item.count / totalEmotions) * 100) : 0
    })

    return {
      success: true,
      data: {
        stats: {
          totalMistakes,
          thisMonth,
          improvement
        },
        typeRank,
        emotionStats
      }
    }
  } catch (err) {
    console.error('Get analysis stats error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
