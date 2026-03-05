const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { code } = event
  
  try {
    // 获取 openid
    const { OPENID } = cloud.getWXContext()
    
    const db = cloud.database()
    const userCollection = db.collection('users')
    
    // 查询用户是否已存在
    const { data } = await userCollection.where({
      _openid: OPENID
    }).get()
    
    let userInfo
    
    if (data.length === 0) {
      // 新用户，创建记录
      const now = new Date()
      const result = await userCollection.add({
        data: {
          _openid: OPENID,
          createTime: now,
          updateTime: now,
          nickname: '',
          avatarUrl: '',
          mistakeCount: 0
        }
      })
      userInfo = {
        _id: result._id,
        _openid: OPENID,
        createTime: now,
        nickname: '',
        avatarUrl: '',
        mistakeCount: 0
      }
    } else {
      // 老用户，返回信息
      userInfo = data[0]
    }
    
    return {
      success: true,
      data: userInfo
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
