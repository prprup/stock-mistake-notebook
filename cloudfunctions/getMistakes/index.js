const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取错题列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} type - 错误类型筛选
 */
exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, type = null } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    let query = db.collection('mistakes').where({
      _openid: openid
    })

    // 按错误类型筛选
    if (type) {
      const typeMap = {
        'chase_high': '追高买入',
        'panic_sell': '恐慌割肉',
        'no_stop_loss': '该止损没止损',
        'no_take_profit': '该止盈没止盈',
        'heavy_position': '单票过重',
        'full_position': '满仓梭哈',
        'frequent_trade': '频繁交易',
        'revenge_trade': '报复性交易',
        'follow_news': '听信消息',
        'follow_others': '跟风买入'
      }
      
      const typeName = typeMap[type] || type
      query = query.where({
        mistakeTypes: typeName
      })
    }

    // 获取总数
    const countResult = await query.count()
    const total = countResult.total

    // 获取列表
    const listResult = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 格式化数据
    const list = listResult.data.map(item => {
      const date = new Date(item.createTime)
      return {
        _id: item._id,
        stockCode: item.stockCode,
        stockName: item.stockName,
        action: item.action,
        price: item.price,
        quantity: item.quantity,
        tradeDate: item.tradeDate,
        mistakeTypes: item.mistakeTypes || [],
        emotion: item.emotion,
        reflection: item.reflection,
        isPublic: item.isPublic,
        formattedDate: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      }
    })

    return {
      code: 0,
      data: {
        list: list,
        total: total,
        page: page,
        pageSize: pageSize,
        hasMore: page * pageSize < total
      }
    }
  } catch (err) {
    console.error('获取错题列表失败:', err)
    return {
      code: -1,
      message: '获取失败',
      error: err.message
    }
  }
}