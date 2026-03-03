// 幂等性控制工具

const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

/**
 * 检查并记录幂等键
 * @param {string} idempotencyKey - 幂等键
 * @param {number} expireSeconds - 过期时间（秒），默认300秒
 * @returns {Promise<{isNew: boolean, existingResult?: any}>}
 */
const checkIdempotency = async (idempotencyKey, expireSeconds = 300) => {
  try {
    // 先查询是否已存在
    const { data } = await db.collection('idempotency_keys').where({
      key: idempotencyKey
    }).get()
    
    if (data.length > 0) {
      // 已存在，返回之前的结果
      return {
        isNew: false,
        existingResult: data[0].result
      }
    }
    
    // 不存在，创建新记录（先占位，防止并发）
    const now = new Date()
    const expireTime = new Date(now.getTime() + expireSeconds * 1000)
    
    try {
      await db.collection('idempotency_keys').add({
        data: {
          key: idempotencyKey,
          status: 'processing',
          createTime: now,
          expireTime: expireTime
        }
      })
      return { isNew: true }
    } catch (err) {
      // 可能是并发导致的重复键，再查一次
      const { data: retryData } = await db.collection('idempotency_keys').where({
        key: idempotencyKey
      }).get()
      
      if (retryData.length > 0) {
        return {
          isNew: false,
          existingResult: retryData[0].result
        }
      }
      throw err
    }
  } catch (err) {
    console.error('Idempotency check error:', err)
    // 出错时允许继续执行（降级处理）
    return { isNew: true }
  }
}

/**
 * 更新幂等键结果
 * @param {string} idempotencyKey - 幂等键
 * @param {any} result - 执行结果
 */
const updateIdempotencyResult = async (idempotencyKey, result) => {
  try {
    await db.collection('idempotency_keys').where({
      key: idempotencyKey
    }).update({
      data: {
        status: 'completed',
        result: result,
        completeTime: new Date()
      }
    })
  } catch (err) {
    console.error('Update idempotency result error:', err)
  }
}

/**
 * 清理过期的幂等键（可定时触发）
 */
const cleanupExpiredKeys = async () => {
  try {
    const now = new Date()
    const { stats } = await db.collection('idempotency_keys').where({
      expireTime: db.command.lt(now)
    }).remove()
    
    console.log(`Cleaned up ${stats.removed} expired idempotency keys`)
    return stats.removed
  } catch (err) {
    console.error('Cleanup error:', err)
    return 0
  }
}

module.exports = {
  checkIdempotency,
  updateIdempotencyResult,
  cleanupExpiredKeys
}
