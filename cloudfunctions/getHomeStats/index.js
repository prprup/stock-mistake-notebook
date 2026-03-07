const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command

  try {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // 1. 本月错题数
    const monthResult = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        date: _.gte(thisMonthStart)
      })
      .count()
    const monthMistakes = monthResult.total

    // 2. 累计错题数
    const totalResult = await db.collection('mistakes')
      .where({ _openid: OPENID })
      .count()
    const totalMistakes = totalResult.total

    // 3. 连续打卡天数
    const streakDays = await calculateStreak(db, OPENID)

    // 4. 今日提醒（根据数据生成）
    const todayTip = generateTodayTip(monthMistakes, totalMistakes, streakDays)

    // 5. 最常犯的错误（本月TOP1）
    const topMistake = await getTopMistake(db, OPENID, thisMonthStart)

    // 6. 最近错题（最近5条）
    const recentMistakesResult = await db.collection('mistakes')
      .where({ _openid: OPENID })
      .orderBy('createTime', 'desc')
      .limit(5)
      .get()
    
    const recentMistakes = recentMistakesResult.data.map(item => {
      const date = new Date(item.date || item.createTime)
      return {
        _id: item._id,
        stockName: item.stockName,
        stockCode: item.stockCode,
        mistakeTypes: item.mistakeTypes || [],
        reflection: item.reflection || '',
        formattedDate: `${date.getMonth() + 1}月${date.getDate()}日`
      }
    })

    return {
      success: true,
      data: {
        monthMistakes,
        totalMistakes,
        streakDays,
        todayTip,
        topMistake,
        recentMistakes
      }
    }
  } catch (err) {
    console.error('Get home stats error:', err)
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
      const date = new Date(item.date || item.createTime)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      recordDates.add(dateStr)
    })

    // 计算连续天数
    const today = new Date()
    let streak = 0
    let checkDate = new Date(today)

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

      if (streak >= 30) break
    }

    return streak
  } catch (err) {
    console.error('Calculate streak error:', err)
    return 0
  }
}

// 生成今日提醒
function generateTodayTip(monthMistakes, totalMistakes, streakDays) {
  if (totalMistakes === 0) {
    return '开始记录第一笔交易，建立你的错题本'
  }
  if (streakDays >= 7) {
    return `已连续记录${streakDays}天，保持这个好习惯！`
  }
  if (monthMistakes > 5) {
    return '本月错题较多，建议回顾交易计划'
  }
  return '交易日记得及时复盘，避免重复犯错'
}

// 获取最常犯的错误（本月）
async function getTopMistake(db, openid, monthStart) {
  try {
    const _ = db.command
    const { data: mistakes } = await db.collection('mistakes')
      .where({
        _openid: openid,
        date: _.gte(monthStart)
      })
      .get()

    if (mistakes.length === 0) {
      return null
    }

    // 统计错误类型
    const typeCount = {}
    mistakes.forEach(item => {
      if (item.mistakeTypes && Array.isArray(item.mistakeTypes)) {
        item.mistakeTypes.forEach(type => {
          typeCount[type] = (typeCount[type] || 0) + 1
        })
      }
    })

    // 找出最多的
    let maxType = null
    let maxCount = 0
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > maxCount) {
        maxType = type
        maxCount = count
      }
    }

    if (!maxType) {
      return null
    }

    // 错误类型描述映射
    const descriptions = {
      '追高买入': '看到涨势就冲动入场，往往买在短期高点',
      '恐慌割肉': '市场波动时情绪失控，低位卖出筹码',
      '该止损没止损': '不愿承认错误，小亏拖成大亏',
      '该止盈没止盈': '贪婪导致利润回吐，甚至转盈为亏',
      '单票过重': '仓位过于集中，风险无法分散',
      '满仓梭哈': '不留余地，失去操作灵活性',
      '频繁交易': '过度操作增加成本，损耗本金',
      '报复性交易': '亏损后急于翻本，失去理性判断',
      '听信消息': '未经验证的信息往往滞后或虚假',
      '跟风买入': '没有独立判断，成为接盘侠'
    }

    return {
      name: maxType,
      count: maxCount,
      description: descriptions[maxType] || '注意控制这类错误的发生'
    }
  } catch (err) {
    console.error('Get top mistake error:', err)
    return null
  }
}
