const cloud = require('wx-server-sdk')
cloud.init()

const { withLock } = require('../utils/lock.js')

exports.main = async (event, context) => {
  const { code } = event
  
  try {
    // 获取 openid
    const { OPENID } = cloud.getWXContext()
    
    if (!OPENID) {
      return { success: false, error: '获取用户标识失败' }
    }
    
    const db = cloud.database()
    const userCollection = db.collection('users')
    
    // 使用锁防止并发创建重复用户
    const result = await withLock(`login_${OPENID}`, async () => {
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
      
      return userInfo
    }, 30)
    
    return {
      success: true,
      data: result
    }
  } catch (err) {
    console.error('Login error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
