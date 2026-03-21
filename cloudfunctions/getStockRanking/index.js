const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取股票打赏排行榜
 * @param {number} page - 页码，默认1
 * @param {number} pageSize - 每页条数，默认20
 * @param {string} period - 统计周期：all(全部), week(本周), month(本月)
 */
exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, period = 'all' } = event

  try {
    let query = db.collection('stock_donation_stats')

    // 根据周期筛选
    if (period !== 'all') {
      const now = new Date()
      let startDate

      if (period === 'week') {
        // 本周开始（周一）
        const dayOfWeek = now.getDay() || 7
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1)
      } else if (period === 'month') {
        // 本月开始
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      if (startDate) {
        // 需要聚合查询，这里简化处理
        // 实际项目中可以添加周期字段到stats表
        query = query.where({
          updateTime: _.gte(startDate)
        })
      }
    }

    // 获取总数
    const countResult = await query.count()
    const total = countResult.total

    // 按总积分排序
    const rankingResult = await query
      .orderBy('totalPoints', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取当前用户的打赏信息
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    let userDonations = []

    if (openid) {
      const userDonationResult = await db.collection('stock_donations')
        .where({ _openid: openid })
        .orderBy('createTime', 'desc')
        .limit(100)
        .get()
      
      // 统计用户打赏的股票
      const userStockMap = {}
      userDonationResult.data.forEach(item => {
        if (!userStockMap[item.stockCode]) {
          userStockMap[item.stockCode] = {
            stockCode: item.stockCode,
            stockName: item.stockName,
            totalPoints: 0
          }
        }
        userStockMap[item.stockCode].totalPoints += item.points
      })
      userDonations = Object.values(userStockMap)
    }

    // 格式化返回数据
    const ranking = rankingResult.data.map((item, index) => ({
      rank: (page - 1) * pageSize + index + 1,
      stockCode: item.stockCode,
      stockName: item.stockName,
      totalPoints: item.totalPoints,
      donorCount: item.donorCount || 0,
      isMyDonation: userDonations.some(d => d.stockCode === item.stockCode)
    }))

    return {
      code: 0,
      data: {
        list: ranking,
        total: total,
        page: page,
        pageSize: pageSize,
        hasMore: page * pageSize < total,
        period: period,
        userDonations: userDonations
      }
    }
  } catch (err) {
    console.error('获取排行榜失败:', err)
    return {
      code: -1,
      message: '获取排行榜失败',
      error: err.message
    }
  }
}