const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event
  
  try {
    const db = cloud.database()
    
    await db.collection('mistakes').where({
      _openid: OPENID,
      _id: id
    }).remove()
    
    // 更新用户错题计数
    await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: {
        mistakeCount: db.command.inc(-1),
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
