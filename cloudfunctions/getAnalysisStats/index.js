const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 获取统计分析数据
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
    // 获取用户所有错题
    const mistakesResult = await db.collection('mistakes')
      .where({ _openid: openid })
      .get()

    const mistakes = mistakesResult.data
    const totalMistakes = mistakes.length

    // 本月错题数
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    const monthMistakes = mistakes.filter(m => {
      const date = new Date(m.createTime)
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth
    }).length

    // 统计错误类型分布
    const typeCount = {}
    const emotionCount = {}

    mistakes.forEach(mistake => {
      // 统计错误类型
      (mistake.mistakeTypes || []).forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1
      })

      // 统计情绪
      if (mistake.emotion) {
        emotionCount[mistake.emotion] = (emotionCount[mistake.emotion] || 0) + 1
      }
    })

    // 转换为数组并排序
    const typeDistribution = Object.entries(typeCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalMistakes > 0 ? Math.round((count / totalMistakes) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)

    const emotionStats = Object.entries(emotionCount)
      .map(([emotion, count]) => ({
        emotion,
        count
      }))
      .sort((a, b) => b.count - a.count)

    // 计算改进率（假设连续7天没有新错题表示改进，这里简化处理）
    const improvementRate = totalMistakes > 0 
      ? Math.max(0, 100 - Math.round((monthMistakes / totalMistakes) * 100))
      : 0

    return {
      code: 0,
      data: {
        totalMistakes,
        monthMistakes,
        improvementRate,
        typeDistribution,
        emotionStats
      }
    }
  } catch (err) {
    console.error('获取统计分析失败:', err)
    return {
      code: -1,
      message: '获取失败',
      error: err.message
    }
  }
}