const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取用户打赏记录
 * @param {number} page - 页码，默认1
 * @param {number} pageSize - 每页条数，默认20
 * @param {string} stockCode - 筛选特定股票（可选）
 */
exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, stockCode } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    let query = db.collection('stock_donations').where({
      _openid: openid
    })

    // 按股票筛选
    if (stockCode) {
      query = query.where({ stockCode: stockCode })
    }

    // 获取总数
    const countResult = await query.count()
    const total = countResult.total

    // 获取打赏记录
    const recordsResult = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 格式化时间
    const records = recordsResult.data.map(item => {
      const date = new Date(item.createTime)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24))

      let timeStr
      if (diffDays === 0) {
        timeStr = `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      } else if (diffDays === 1) {
        timeStr = `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      } else if (diffDays < 7) {
        timeStr = `${diffDays}天前`
      } else {
        timeStr = `${date.getMonth() + 1}月${date.getDate()}日`
      }

      return {
        _id: item._id,
        stockCode: item.stockCode,
        stockName: item.stockName,
        points: item.points,
        message: item.message,
        time: timeStr,
        formattedTime: timeStr,
        createTime: item.createTime
      }
    })

    // 统计用户打赏总额
    const statsResult = await db.collection('stock_donations')
      .where({ _openid: openid })
      .get()
    
    const totalDonated = statsResult.data.reduce((sum, item) => sum + item.points, 0)
    
    // 统计打赏过的股票数量
    const uniqueStocks = new Set(statsResult.data.map(item => item.stockCode))

    return {
      code: 0,
      data: {
        list: records,
        total: total,
        page: page,
        pageSize: pageSize,
        hasMore: page * pageSize < total,
        stats: {
          totalDonated: totalDonated,
          stockCount: uniqueStocks.size,
          donationCount: statsResult.data.length
        }
      }
    }
  } catch (err) {
    console.error('获取打赏记录失败:', err)
    return {
      code: -1,
      message: '获取打赏记录失败',
      error: err.message
    }
  }
}