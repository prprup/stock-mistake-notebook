const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取用户积分信息
 */
exports.main = async (event, context) => {
  const { userId } = event
  const wxContext = cloud.getWXContext()
  const openid = userId || wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    // 获取或创建用户积分记录
    let userPoints = await db.collection('user_points').where({
      _openid: openid
    }).get()

    if (userPoints.data.length === 0) {
      // 创建新用户积分记录
      const newRecord = {
        _openid: openid,
        points: 0,
        totalPoints: 0,
        checkInStreak: 0,
        lastCheckIn: null,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      const result = await db.collection('user_points').add({
        data: newRecord
      })
      
      return {
        code: 0,
        data: {
          ...newRecord,
          _id: result._id
        }
      }
    }

    const userData = userPoints.data[0]
    
    // 检查是否需要重置连续签到（超过24小时未签到）
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (userData.lastCheckIn) {
      const lastCheckIn = new Date(userData.lastCheckIn)
      const lastCheckInDate = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate())
      const diffDays = Math.floor((today - lastCheckInDate) / (1000 * 60 * 60 * 24))
      
      // 如果超过1天没签到，重置连续天数
      if (diffDays > 1) {
        await db.collection('user_points').doc(userData._id).update({
          data: {
            checkInStreak: 0,
            updateTime: db.serverDate()
          }
        })
        userData.checkInStreak = 0
      }
    }

    return {
      code: 0,
      data: userData
    }
  } catch (err) {
    console.error('获取积分信息失败:', err)
    return {
      code: -1,
      message: '获取积分信息失败',
      error: err.message
    }
  }
}