const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { nickname, avatarUrl } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    const db = cloud.database()
    
    await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: {
        nickname,
        avatarUrl,
        updateTime: new Date()
      }
    })
    
    return {
      success: true
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
