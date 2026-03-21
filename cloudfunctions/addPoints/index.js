const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 增加积分
 * @param {string} type - 积分类型: mistake(录入错题), ad(观看广告), checkin(签到), bonus(奖励)
 * @param {number} points - 积分数量
 * @param {string} description - 描述
 * @param {string} relatedId - 关联ID(如错题ID)
 */
exports.main = async (event, context) => {
  const { type, points, description, relatedId } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  // 参数校验
  if (!type || !points || points <= 0) {
    return {
      code: -1,
      message: '参数错误: type和points为必填项，points必须大于0'
    }
  }

  const validTypes = ['mistake', 'ad', 'checkin', 'bonus', 'invite', 'share']
  if (!validTypes.includes(type)) {
    return {
      code: -1,
      message: `无效的积分类型，支持: ${validTypes.join(', ')}`
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

    // 更新用户积分
    await db.collection('user_points').doc(docId).update({
      data: {
        points: _.inc(points),
        totalPoints: _.inc(points),
        updateTime: db.serverDate()
      }
    })

    // 添加积分记录
    const recordData = {
      _openid: openid,
      type: type,
      points: points,
      description: description || getDefaultDescription(type),
      createTime: db.serverDate()
    }

    if (relatedId) {
      recordData.relatedId = relatedId
    }

    await db.collection('points_records').add({
      data: recordData
    })

    return {
      code: 0,
      message: `+${points}积分`,
      data: {
        points: userData.points + points,
        totalPoints: userData.totalPoints + points,
        addPoints: points,
        type: type
      }
    }
  } catch (err) {
    console.error('增加积分失败:', err)
    return {
      code: -1,
      message: '增加积分失败',
      error: err.message
    }
  }
}

function getDefaultDescription(type) {
  const descriptions = {
    'mistake': '录入错题奖励',
    'ad': '观看广告奖励',
    'checkin': '每日签到',
    'bonus': '系统奖励',
    'invite': '邀请好友奖励',
    'share': '分享奖励'
  }
  return descriptions[type] || '积分变动'
}