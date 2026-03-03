const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const db = cloud.database()
    const _ = db.command
    
    // 获取当前月份
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const monthStart = `${year}-${month}-01`
    const monthEnd = `${year}-${month}-31`
    
    // 1. 获取用户统计
    const { data: users } = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    const userInfo = users[0] || { mistakeCount: 0 }
    
    // 2. 获取本月错题数
    const monthCountRes = await db.collection('mistakes').where({
      _openid: OPENID,
      date: _.gte(new Date(monthStart)).and(_.lte(new Date(monthEnd)))
    }).count()
    
    // 3. 获取最近5条错题
    const { data: recentMistakes } = await db.collection('mistakes')
      .where({ _openid: OPENID })
      .orderBy('createTime', 'desc')
      .limit(5)
      .get()
    
    // 4. 获取错误类型统计（本月）
    const { data: monthMistakes } = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        date: _.gte(new Date(monthStart)).and(_.lte(new Date(monthEnd)))
      })
      .get()
    
    // 统计错误类型
    const typeCount = {}
    monthMistakes.forEach(m => {
      (m.mistakeTypes || []).forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1
      })
    })
    
    // 找出TOP1错误
    let topMistake = null
    const typeEntries = Object.entries(typeCount)
    if (typeEntries.length > 0) {
      typeEntries.sort((a, b) => b[1] - a[1])
      const [name, count] = typeEntries[0]
      topMistake = {
        name,
        count,
        description: getMistakeDesc(name)
      }
    }
    
    // 5. 计算连续记录天数
    const streakDays = calculateStreakDays(monthMistakes)
    
    // 6. 生成提示
    const todayTip = generateTip(typeCount, monthMistakes)
    
    // 格式化最近错题
    const formattedRecent = recentMistakes.map(m => ({
      _id: m._id,
      stockName: m.stockName,
      formattedDate: formatDate(m.date),
      mistakeTypes: m.mistakeTypes || [],
      reflection: m.reflection
    }))
    
    return {
      success: true,
      data: {
        monthMistakes: monthCountRes.total,
        totalMistakes: userInfo.mistakeCount || 0,
        streakDays,
        todayTip,
        topMistake,
        recentMistakes: formattedRecent
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

// 获取错误描述
function getMistakeDesc(type) {
  const descMap = {
    '追高买入': '看到股价上涨就忍不住买入，结果买在短期高点',
    '恐慌割肉': '下跌时情绪失控，低位卖出导致实际亏损',
    '不止损': '亏损不断扩大，最终深套',
    '仓位过重': '单只股票投入过多资金，风险集中',
    '频繁交易': '过度操作，手续费吃掉利润',
    '盲目跟风': '听信他人推荐，没有独立判断',
    '没有计划': '买卖随意，没有明确的交易策略',
    '贪心不足': '盈利时不肯止盈，最终利润回吐',
    '逆势操作': '与市场趋势对抗，越套越深',
    '情绪交易': '被恐惧或贪婪支配，非理性决策'
  }
  return descMap[type] || '需要反思和改进的交易行为'
}

// 计算连续记录天数
function calculateStreakDays(mistakes) {
  if (mistakes.length === 0) return 0
  
  // 按日期去重排序
  const dates = [...new Set(mistakes.map(m => {
    const d = new Date(m.date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }))].sort().reverse()
  
  if (dates.length === 0) return 0
  
  // 检查今天或昨天是否有记录
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
    return 0 // 连续记录已断
  }
  
  // 计算连续天数
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i - 1])
    const prev = new Date(dates[i])
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24)
    
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

// 生成提示
function generateTip(typeCount, mistakes) {
  const typeEntries = Object.entries(typeCount)
  
  if (typeEntries.length === 0) {
    return '开始记录你的第一笔错题吧，避免重复犯错'
  }
  
  // 找出增长最快的错误类型（需要上月数据对比，这里简化）
  const topType = typeEntries.sort((a, b) => b[1] - a[1])[0]
  
  if (topType[1] >= 5) {
    return `你本月${topType[0]}犯了${topType[1]}次，这是你最常犯的错误，需要重点注意`
  } else if (mistakes.length >= 10) {
    return `本月已记录${mistakes.length}笔错题，记得定期复盘总结`
  } else {
    return '坚持记录，每一笔错题都是进步的阶梯'
  }
}

// 格式化日期
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
