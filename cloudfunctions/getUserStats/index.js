const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const db = cloud.database()
    
    // 获取用户错题数量
    const mistakeCount = await db.collection('mistakes')
      .where({
        _openid: OPENID
      })
      .count()
    
    // 获取公开分享的错题数量
    const publicCount = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        isPublic: true
      })
      .count()
    
    // 获取用户信息
    const { data: userData } = await db.collection('users')
      .where({
        _openid: OPENID
      })
      .get()
    
    const user = userData.length > 0 ? userData[0] : {}
    
    return {
      success: true,
      data: {
        user: {
          nickname: user.nickname || '微信用户',
          id: user._id || '',
          avatarUrl: user.avatarUrl || ''
        },
        stats: {
          mistakes: mistakeCount.total || 0,
          public: publicCount.total || 0,
          likes: 0  // 点赞功能暂未实现
        }
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}