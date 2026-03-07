const cloud = require('wx-server-sdk')
cloud.init()

// 字段长度限制
const FIELD_LIMITS = {
  nickname: { max: 50, label: '昵称' },
  avatarUrl: { max: 500, label: '头像URL' }
}

exports.main = async (event, context) => {
  const { nickname, avatarUrl } = event
  const { OPENID } = cloud.getWXContext()
  
  // 至少有一个字段需要更新
  if (nickname === undefined && avatarUrl === undefined) {
    return {
      success: false,
      error: '没有要更新的字段'
    }
  }
  
  // 字段长度校验
  if (nickname !== undefined && nickname !== null) {
    if (String(nickname).length > FIELD_LIMITS.nickname.max) {
      return {
        success: false,
        error: `${FIELD_LIMITS.nickname.label}不能超过${FIELD_LIMITS.nickname.max}个字符`
      }
    }
  }
  
  if (avatarUrl !== undefined && avatarUrl !== null) {
    if (String(avatarUrl).length > FIELD_LIMITS.avatarUrl.max) {
      return {
        success: false,
        error: `${FIELD_LIMITS.avatarUrl.label}不能超过${FIELD_LIMITS.avatarUrl.max}个字符`
      }
    }
  }
  
  try {
    const db = cloud.database()
    
    // 检查用户是否存在
    const { data: userData } = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    if (userData.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }
    
    const updateData = {
      updateTime: new Date()
    }
    
    if (nickname !== undefined) {
      updateData.nickname = nickname
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl
    }
    
    await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: updateData
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
