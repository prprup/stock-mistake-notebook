const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取首页统计数据
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
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    // 1. 获取本月错题数
    const monthStart = new Date(currentYear, currentMonth - 1, 1)
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)
    
    const monthCountResult = await db.collection('mistakes').where({
      _openid: openid,
      createTime: _.gte(monthStart).and(_.lte(monthEnd))
    }).count()

    // 2. 获取总错题数
    const totalCountResult = await db.collection('mistakes').where({
      _openid: openid
    }).count()

    // 3. 获取连续打卡天数（从用户积分表）
    const userPoints = await db.collection('user_points').where({
      _openid: openid
    }).get()
    
    const checkInStreak = userPoints.data.length > 0 
      ? userPoints.data[0].checkInStreak || 0 
      : 0

    // 4. 获取用户积分
    const points = userPoints.data.length > 0 
      ? userPoints.data[0].points || 0 
      : 0

    // 5. 获取最多的错误类型
    const allMistakes = await db.collection('mistakes').where({
      _openid: openid
    }).get()

    let topMistake = null
    if (allMistakes.data.length > 0) {
      // 统计错误类型
      const typeCount = {}
      allMistakes.data.forEach(mistake => {
        (mistake.mistakeTypes || []).forEach(type => {
          typeCount[type] = (typeCount[type] || 0) + 1
        })
      })
      
      // 找出最多的
      let maxCount = 0
      let maxType = ''
      for (const [type, count] of Object.entries(typeCount)) {
        if (count > maxCount) {
          maxCount = count
          maxType = type
        }
      }
      
      if (maxType) {
        const typeDescriptions = {
          '追高买入': '看到股价上涨就忍不住买入，结果买在短期高点',
          '恐慌割肉': '股价下跌时恐慌卖出，往往卖在最低点',
          '该止损没止损': '跌破止损线舍不得卖，导致更大亏损',
          '该止盈没止盈': '盈利后贪心不止盈，利润回撤甚至亏损',
          '单票过重': '单只股票仓位过重，风险集中',
          '满仓梭哈': '不留现金全部买入，没有余地应对',
          '频繁交易': '过度交易导致手续费累积，收益被侵蚀',
          '报复性交易': '亏损后急于回本，做出冲动决策',
          '听信消息': '根据小道消息买卖，缺乏独立判断',
          '跟风买入': '看到别人买就跟着买，没有自己的逻辑'
        }
        
        topMistake = {
          name: maxType,
          count: maxCount,
          description: typeDescriptions[maxType] || '需要重点关注和避免的错误'
        }
      }
    }

    // 6. 获取最近错题
    const recentMistakes = await db.collection('mistakes')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .limit(3)
      .get()

    const formattedRecent = recentMistakes.data.map(item => {
      const date = new Date(item.createTime)
      return {
        _id: item._id,
        stockName: item.stockName || '未知股票',
        formattedDate: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        mistakeTypes: item.mistakeTypes || [],
        reflection: item.reflection || ''
      }
    })

    // 7. 生成今日提示
    let todayTip = '开始记录你的第一笔错题吧'
    if (allMistakes.data.length > 0) {
      const tips = [
        '交易是反人性的，保持冷静才能少犯错',
        '每一笔错误都是学费，记录下来才能避免再犯',
        '市场永远有机会，不要急于一时',
        '纪律比智商更重要',
        '不要在情绪激动时做交易决策'
      ]
      todayTip = tips[Math.floor(Math.random() * tips.length)]
      
      // 如果有头号敌人，增加针对性提示
      if (topMistake) {
        todayTip = `你的头号敌人是"${topMistake.name}"，本月已犯${topMistake.count}次，需要警惕`
      }
    }

    return {
      code: 0,
      data: {
        monthMistakes: monthCountResult.total,
        totalMistakes: totalCountResult.total,
        streakDays: checkInStreak,
        points: points,
        todayTip: todayTip,
        topMistake: topMistake,
        recentMistakes: formattedRecent
      }
    }
  } catch (err) {
    console.error('获取首页统计失败:', err)
    return {
      code: -1,
      message: '获取数据失败',
      error: err.message
    }
  }
}