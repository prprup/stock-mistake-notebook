const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 每日签到
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    // 获取用户积分记录
    let userPoints = await db.collection('user_points').where({
      _openid: openid
    }).get()

    let userData
    let docId

    if (userPoints.data.length === 0) {
      // 创建新记录
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
      userData = newRecord
      docId = result._id
    } else {
      userData = userPoints.data[0]
      docId = userData._id
    }

    // 检查今天是否已签到
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (userData.lastCheckIn) {
      const lastCheckIn = new Date(userData.lastCheckIn)
      const lastCheckInDate = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate())
      
      if (lastCheckInDate.getTime() === today.getTime()) {
        return {
          code: -1,
          message: '今日已签到'
        }
      }
    }

    // 计算连续签到天数
    let newStreak = 1
    let bonusPoints = 0

    if (userData.lastCheckIn) {
      const lastCheckIn = new Date(userData.lastCheckIn)
      const lastCheckInDate = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate())
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      
      if (lastCheckInDate.getTime() === yesterday.getTime()) {
        // 连续签到
        newStreak = userData.checkInStreak + 1
      }
    }

    // 连续7天额外奖励
    if (newStreak % 7 === 0) {
      bonusPoints = 10
    }

    const basePoints = 5
    const totalAdd = basePoints + bonusPoints

    // 更新用户积分
    await db.collection('user_points').doc(docId).update({
      data: {
        points: _.inc(totalAdd),
        totalPoints: _.inc(totalAdd),
        checkInStreak: newStreak,
        lastCheckIn: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    // 添加积分记录
    await db.collection('points_records').add({
      data: {
        _openid: openid,
        type: 'checkin',
        points: basePoints,
        bonusPoints: bonusPoints,
        description: bonusPoints > 0 
          ? `每日签到(连续${newStreak}天，额外奖励)` 
          : '每日签到',
        streak: newStreak,
        createTime: db.serverDate()
      }
    })

    return {
      code: 0,
      message: bonusPoints > 0 
        ? `签到成功！连续${newStreak}天，额外+${bonusPoints}积分` 
        : '签到成功 +5积分',
      data: {
        points: userData.points + totalAdd,
        totalPoints: userData.totalPoints + totalAdd,
        checkInStreak: newStreak,
        basePoints: basePoints,
        bonusPoints: bonusPoints,
        totalAdd: totalAdd
      }
    }
  } catch (err) {
    console.error('签到失败:', err)
    return {
      code: -1,
      message: '签到失败',
      error: err.message
    }
  }
}