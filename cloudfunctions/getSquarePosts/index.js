const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取广场帖子列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} filter - 筛选类型
 */
exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, filter = 'all' } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    let query = db.collection('mistakes').where({
      isPublic: true
    })

    // 按错误类型筛选
    if (filter !== 'all') {
      const filterMap = {
        'chase_high': '追高买入',
        'panic_sell': '恐慌割肉',
        'no_stop_loss': '该止损没止损',
        'heavy_position': '单票过重',
        'frequent_trade': '频繁交易',
        'revenge_trade': '报复性交易'
      }
      
      if (filterMap[filter]) {
        query = query.where({
          mistakeTypes: filterMap[filter]
        })
      }
    }

    // 获取总数
    const countResult = await query.count()
    const total = countResult.total

    // 获取列表
    const postsResult = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取本周热错统计
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const weekMistakes = await db.collection('mistakes')
      .where({
        isPublic: true,
        createTime: _.gte(weekStart)
      })
      .get()

    // 统计本周错误类型
    const typeCount = {}
    weekMistakes.data.forEach(item => {
      (item.mistakeTypes || []).forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1
      })
    })

    let hotMistake = null
    if (Object.keys(typeCount).length > 0) {
      const sortedTypes = Object.entries(typeCount)
        .sort((a, b) => b[1] - a[1])
      
      if (sortedTypes.length > 0) {
        hotMistake = {
          name: sortedTypes[0][0],
          count: sortedTypes[0][1]
        }
      }
    }

    // 格式化帖子数据
    const posts = postsResult.data.map(item => {
      const date = new Date(item.createTime)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      let timeAgo
      if (diffMins < 60) {
        timeAgo = diffMins < 5 ? '刚刚' : `${diffMins}分钟前`
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}小时前`
      } else if (diffDays < 7) {
        timeAgo = `${diffDays}天前`
      } else {
        timeAgo = `${date.getMonth() + 1}月${date.getDate()}日`
      }

      return {
        _id: item._id,
        mistakeTypes: item.mistakeTypes || [],
        reflection: item.reflection || '',
        emotion: item.emotion || '',
        timeAgo: timeAgo,
        likes: item.likes || 0,
        comments: item.comments || 0,
        isLiked: false, // TODO: 检查用户是否点赞
        isMyPost: item._openid === openid
      }
    })

    return {
      code: 0,
      data: {
        list: posts,
        total: total,
        hasMore: page * pageSize < total,
        hotMistake: hotMistake
      }
    }
  } catch (err) {
    console.error('获取广场帖子失败:', err)
    return {
      code: -1,
      message: '获取数据失败',
      error: err.message
    }
  }
}