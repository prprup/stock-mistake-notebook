const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const AD_TICKET_EXPIRE_SECONDS = 10 * 60
const AD_MIN_WATCH_SECONDS = 15
const MAX_ACTIVE_PENDING_TICKETS = 1
const DEFAULT_SOURCE = 'rewarded-video'

exports.main = async (event, context) => {
  const {
    action = 'prepare',
    adUnitId = '',
    adSource = DEFAULT_SOURCE,
    scene = '',
    ticketId = '',
    traceId = '',
    reason = ''
  } = event || {}

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: -1, message: '用户未登录' }
  }

  try {
    if (action === 'prepare') {
      return await prepareTicket({ openid, adUnitId, adSource, scene, wxContext })
    }

    if (action === 'cancel') {
      return await cancelTicket({ openid, ticketId, traceId, reason })
    }

    return { code: -1, message: '无效操作' }
  } catch (err) {
    console.error('adRewardTicket失败:', err)
    return {
      code: -1,
      message: '广告票据处理失败',
      error: err.message
    }
  }
}

async function prepareTicket({ openid, adUnitId, adSource, scene, wxContext }) {
  const safeAdUnitId = String(adUnitId || '').trim()
  const safeSource = String(adSource || DEFAULT_SOURCE).trim()
  const safeScene = String(scene || '').trim()

  if (!safeAdUnitId) {
    return { code: -1, message: '缺少广告位ID' }
  }

  const now = new Date()
  const expireAt = new Date(now.getTime() + AD_TICKET_EXPIRE_SECONDS * 1000)
  const minClaimAt = new Date(now.getTime() + AD_MIN_WATCH_SECONDS * 1000)

  const pendingRes = await db.collection('ad_reward_tickets').where({
    _openid: openid,
    status: 'pending'
  }).limit(5).get()

  const activePending = (pendingRes.data || []).filter(item => {
    const itemExpireAt = item.expireAt ? new Date(item.expireAt) : null
    return itemExpireAt && itemExpireAt.getTime() > now.getTime()
  })

  const reusablePending = activePending.find(item => (
    item.adUnitId === safeAdUnitId &&
    (item.adSource || DEFAULT_SOURCE) === safeSource &&
    (item.scene || '') === safeScene
  ))

  if (reusablePending) {
    return {
      code: 0,
      message: '已存在待完成广告任务',
      data: formatTicket(reusablePending, true)
    }
  }

  if (activePending.length >= MAX_ACTIVE_PENDING_TICKETS) {
    return {
      code: -1,
      message: '已有未完成的广告任务，请先完成或关闭当前广告'
    }
  }

  const traceId = `ad_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const result = await db.collection('ad_reward_tickets').add({
    data: {
      _openid: openid,
      status: 'pending',
      traceId,
      adUnitId: safeAdUnitId,
      adSource: safeSource,
      scene: safeScene,
      minClaimAt,
      expireAt,
      appId: wxContext.APPID || '',
      prepareMeta: {
        appId: wxContext.APPID || '',
        scene: safeScene,
        adSource: safeSource
      },
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })

  return {
    code: 0,
    message: '广告票据已创建',
    data: {
      ticketId: result._id,
      traceId,
      adUnitId: safeAdUnitId,
      adSource: safeSource,
      scene: safeScene,
      expireAt: expireAt.toISOString(),
      minClaimAt: minClaimAt.toISOString(),
      minWatchSeconds: AD_MIN_WATCH_SECONDS,
      reused: false
    }
  }
}

async function cancelTicket({ openid, ticketId, traceId, reason }) {
  const safeTicketId = String(ticketId || '').trim()
  const safeTraceId = String(traceId || '').trim()
  const safeReason = String(reason || '').trim() || 'user_cancel'

  if (!safeTicketId || !safeTraceId) {
    return { code: -1, message: '缺少票据参数' }
  }

  const ticketRes = await db.collection('ad_reward_tickets').doc(safeTicketId).get()
  const ticket = ticketRes.data

  if (!ticket || ticket._openid !== openid) {
    return { code: -1, message: '广告票据不存在' }
  }

  if (ticket.traceId !== safeTraceId) {
    return { code: -1, message: '广告票据不匹配' }
  }

  if (ticket.status !== 'pending') {
    return {
      code: 0,
      message: '广告票据已处理',
      data: {
        ticketId: safeTicketId,
        status: ticket.status
      }
    }
  }

  await db.collection('ad_reward_tickets').doc(safeTicketId).update({
    data: {
      status: 'canceled',
      cancelReason: safeReason,
      cancelTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })

  return {
    code: 0,
    message: '广告票据已取消',
    data: {
      ticketId: safeTicketId,
      status: 'canceled'
    }
  }
}

function formatTicket(ticket, reused = false) {
  return {
    ticketId: ticket._id,
    traceId: ticket.traceId,
    adUnitId: ticket.adUnitId,
    adSource: ticket.adSource,
    scene: ticket.scene || '',
    expireAt: ticket.expireAt ? new Date(ticket.expireAt).toISOString() : '',
    minClaimAt: ticket.minClaimAt ? new Date(ticket.minClaimAt).toISOString() : '',
    minWatchSeconds: AD_MIN_WATCH_SECONDS,
    reused
  }
}
