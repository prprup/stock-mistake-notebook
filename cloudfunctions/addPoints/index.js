const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const AD_REWARD_POINTS = 20
const AD_DAILY_LIMIT = 5
const AD_COOLDOWN_SECONDS = 30
const AD_SOURCE = 'rewarded-video'

/**
 * 增加积分
 * @param {string} type - 积分类型: mistake(录入错题), ad(观看广告), checkin(签到), bonus(奖励)
 * @param {number} points - 积分数量
 * @param {string} description - 描述
 * @param {string} relatedId - 关联ID(如错题ID)
 * @param {string} adUnitId - 广告位ID（广告奖励时建议传）
 * @param {string} adSource - 广告来源，默认 rewarded-video
 * @param {string} traceId - 前端一次领奖链路的追踪ID，用于幂等
 * @param {string} scene - 页面场景，如 points-page
 * @param {string} ticketId - 服务端预创建的广告票据ID
 */
exports.main = async (event, context) => {
  const {
    type,
    points,
    description,
    relatedId,
    adUnitId = '',
    adSource = AD_SOURCE,
    traceId = '',
    scene = '',
    ticketId = ''
  } = event

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

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

  if (type === 'ad' && Number(points) !== AD_REWARD_POINTS) {
    return {
      code: -1,
      message: `广告奖励积分必须为 ${AD_REWARD_POINTS}`
    }
  }

  try {
    if (type === 'ad') {
      return await handleAdReward({
        openid,
        points: Number(points),
        description,
        relatedId,
        adUnitId,
        adSource,
        traceId,
        scene,
        ticketId
      })
    }

    return await handleGenericPoints({
      openid,
      type,
      points: Number(points),
      description,
      relatedId
    })
  } catch (err) {
    console.error('增加积分失败:', err)
    return {
      code: -1,
      message: '增加积分失败',
      error: err.message
    }
  }
}

async function handleGenericPoints({ openid, type, points, description, relatedId }) {
  let userPoints = await db.collection('user_points').where({
    _openid: openid
  }).get()

  let userData
  let docId

  if (userPoints.data.length === 0) {
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

  await db.collection('user_points').doc(docId).update({
    data: {
      points: _.inc(points),
      totalPoints: _.inc(points),
      updateTime: db.serverDate()
    }
  })

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
      points: (userData.points || 0) + points,
      totalPoints: (userData.totalPoints || 0) + points,
      addPoints: points,
      type: type
    }
  }
}

async function handleAdReward({ openid, points, description, relatedId, adUnitId, adSource, traceId, scene, ticketId }) {
  const transaction = await db.startTransaction()

  try {
    const now = new Date()
    const startOfDay = getStartOfBeijingDay(now)
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
    const cooldownBoundary = new Date(now.getTime() - AD_COOLDOWN_SECONDS * 1000)

    const safeTraceId = String(traceId || '').trim()
    const safeAdUnitId = String(adUnitId || '').trim()
    const safeScene = String(scene || '').trim()
    const safeSource = String(adSource || AD_SOURCE).trim()
    const safeTicketId = String(ticketId || '').trim()

    if (!safeTicketId) {
      await transaction.rollback()
      return {
        code: -1,
        message: '缺少广告票据，无法发放奖励'
      }
    }

    // 0. 广告票据校验
    const ticketRes = await transaction.collection('ad_reward_tickets').doc(safeTicketId).get()
    const ticket = ticketRes.data

    if (!ticket || ticket._openid !== openid) {
      await transaction.rollback()
      return {
        code: -1,
        message: '广告票据不存在或无权使用'
      }
    }

    if (ticket.status !== 'pending') {
      await transaction.rollback()
      return {
        code: ticket.status === 'claimed' ? 0 : -1,
        message: ticket.status === 'claimed' ? '广告奖励已领取，请勿重复提交' : '广告票据已失效',
        data: {
          duplicated: ticket.status === 'claimed',
          ticketStatus: ticket.status
        }
      }
    }

    const expireAt = ticket.expireAt ? new Date(ticket.expireAt) : null
    const minClaimAt = ticket.minClaimAt ? new Date(ticket.minClaimAt) : null

    if (!expireAt || expireAt.getTime() <= now.getTime()) {
      await transaction.rollback()
      await db.collection('ad_reward_tickets').doc(safeTicketId).update({
        data: {
          status: 'expired',
          expireReason: 'timeout',
          updateTime: db.serverDate()
        }
      })
      return {
        code: -1,
        message: '广告票据已过期，请重新观看广告'
      }
    }

    if (!minClaimAt || minClaimAt.getTime() > now.getTime()) {
      await transaction.rollback()
      return {
        code: -1,
        message: '观看时长不足，暂不能领取奖励'
      }
    }

    if (ticket.traceId !== safeTraceId) {
      await transaction.rollback()
      return {
        code: -1,
        message: '广告票据校验失败，请重试'
      }
    }

    if (ticket.adUnitId !== safeAdUnitId) {
      await transaction.rollback()
      return {
        code: -1,
        message: '广告位不匹配，请重试'
      }
    }

    if (ticket.adSource && ticket.adSource !== safeSource) {
      await transaction.rollback()
      return {
        code: -1,
        message: '广告来源校验失败，请重试'
      }
    }

    // 1. traceId 幂等校验
    if (safeTraceId) {
      const traceExists = await transaction.collection('ad_reward_logs').where({
        _openid: openid,
        traceId: safeTraceId
      }).get()

      if (traceExists.data.length > 0) {
        const userData = await getOrCreateUserPointsInTransaction(transaction, openid)
        await transaction.collection('ad_reward_tickets').doc(safeTicketId).update({
          data: {
            status: 'claimed',
            claimTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        await transaction.commit()
        return {
          code: 0,
          message: '广告奖励已领取，请勿重复提交',
          data: {
            points: userData.points || 0,
            totalPoints: userData.totalPoints || 0,
            addPoints: 0,
            type: 'ad',
            duplicated: true
          }
        }
      }
    }

    // 2. 冷却时间限制
    const cooldownRecords = await transaction.collection('ad_reward_logs').where({
      _openid: openid,
      rewardType: 'ad',
      createTime: _.gte(cooldownBoundary)
    }).get()

    if (cooldownRecords.data.length > 0) {
      const latest = cooldownRecords.data[0]
      const secondsLeft = Math.max(1, AD_COOLDOWN_SECONDS - Math.floor((now - new Date(latest.createTime)) / 1000))
      await transaction.rollback()
      return {
        code: -1,
        message: `领取过于频繁，请 ${secondsLeft} 秒后再试`
      }
    }

    // 3. 每日上限限制
    const todayRewardRecords = await transaction.collection('ad_reward_logs').where({
      _openid: openid,
      rewardType: 'ad',
      createTime: _.gte(startOfDay).and(_.lt(endOfDay))
    }).get()

    if (todayRewardRecords.data.length >= AD_DAILY_LIMIT) {
      await transaction.rollback()
      return {
        code: -1,
        message: `今日广告奖励已达上限（${AD_DAILY_LIMIT}次）`
      }
    }

    // 4. 获取或创建积分账户
    const userData = await getOrCreateUserPointsInTransaction(transaction, openid)

    // 5. 更新积分
    await transaction.collection('user_points').doc(userData._id).update({
      data: {
        points: _.inc(points),
        totalPoints: _.inc(points),
        updateTime: db.serverDate()
      }
    })

    // 6. 记录积分流水
    const recordData = {
      _openid: openid,
      type: 'ad',
      points,
      description: description || getDefaultDescription('ad'),
      adUnitId: safeAdUnitId,
      adSource: safeSource,
      traceId: safeTraceId,
      ticketId: safeTicketId,
      scene: safeScene,
      createTime: db.serverDate()
    }

    if (relatedId) {
      recordData.relatedId = relatedId
    }

    await transaction.collection('points_records').add({
      data: recordData
    })

    // 7. 记录广告奖励日志
    await transaction.collection('ad_reward_logs').add({
      data: {
        _openid: openid,
        rewardType: 'ad',
        points,
        adUnitId: safeAdUnitId,
        adSource: safeSource,
        traceId: safeTraceId,
        ticketId: safeTicketId,
        scene: safeScene,
        relatedId: relatedId || '',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    // 8. 核销票据
    await transaction.collection('ad_reward_tickets').doc(safeTicketId).update({
      data: {
        status: 'claimed',
        claimTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    await transaction.commit()

    return {
      code: 0,
      message: `+${points}积分`,
      data: {
        points: (userData.points || 0) + points,
        totalPoints: (userData.totalPoints || 0) + points,
        addPoints: points,
        type: 'ad',
        dailyCount: todayRewardRecords.data.length + 1,
        dailyLimit: AD_DAILY_LIMIT
      }
    }
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

async function getOrCreateUserPointsInTransaction(transaction, openid) {
  let userPoints = await transaction.collection('user_points').where({
    _openid: openid
  }).get()

  if (userPoints.data.length > 0) {
    return userPoints.data[0]
  }

  const newRecord = {
    _openid: openid,
    points: 0,
    totalPoints: 0,
    checkInStreak: 0,
    lastCheckIn: null,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }

  const result = await transaction.collection('user_points').add({
    data: newRecord
  })

  return {
    ...newRecord,
    _id: result._id
  }
}

function getDefaultDescription(type) {
  const descriptions = {
    mistake: '录入错题奖励',
    ad: '观看广告奖励',
    checkin: '每日签到',
    bonus: '系统奖励',
    invite: '邀请好友奖励',
    share: '分享奖励'
  }
  return descriptions[type] || '积分变动'
}

function getStartOfBeijingDay(date = new Date()) {
  const utcOffset = 8 * 60
  const beijingTime = new Date(date.getTime() + (utcOffset + date.getTimezoneOffset()) * 60000)
  return new Date(beijingTime.getFullYear(), beijingTime.getMonth(), beijingTime.getDate())
}
