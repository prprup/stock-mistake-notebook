// 并发控制工具（基于数据库乐观锁）

const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

/**
 * 获取分布式锁
 * @param {string} lockKey - 锁的标识
 * @param {number} expireSeconds - 锁过期时间（秒），默认30秒
 * @returns {Promise<{success: boolean, lockId?: string}>}
 */
const acquireLock = async (lockKey, expireSeconds = 30) => {
  const lockId = `${lockKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const expireTime = new Date(Date.now() + expireSeconds * 1000)
  
  try {
    // 尝试创建锁
    await db.collection('distributed_locks').add({
      data: {
        key: lockKey,
        lockId: lockId,
        createTime: new Date(),
        expireTime: expireTime
      }
    })
    
    return { success: true, lockId }
  } catch (err) {
    // 可能是锁已存在，检查是否过期
    const { data } = await db.collection('distributed_locks').where({
      key: lockKey
    }).get()
    
    if (data.length > 0) {
      const lock = data[0]
      // 锁已过期，强制释放并重新获取
      if (new Date() > new Date(lock.expireTime)) {
        await db.collection('distributed_locks').doc(lock._id).remove()
        
        // 重新尝试获取
        try {
          await db.collection('distributed_locks').add({
            data: {
              key: lockKey,
              lockId: lockId,
              createTime: new Date(),
              expireTime: expireTime
            }
          })
          return { success: true, lockId }
        } catch (retryErr) {
          return { success: false, error: 'Lock acquisition failed after retry' }
        }
      }
    }
    
    return { success: false, error: 'Lock already held' }
  }
}

/**
 * 释放分布式锁
 * @param {string} lockKey - 锁的标识
 * @param {string} lockId - 锁ID
 */
const releaseLock = async (lockKey, lockId) => {
  try {
    await db.collection('distributed_locks').where({
      key: lockKey,
      lockId: lockId
    }).remove()
    return { success: true }
  } catch (err) {
    console.error('Release lock error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 带锁执行函数
 * @param {string} lockKey - 锁标识
 * @param {Function} fn - 要执行的函数
 * @param {number} expireSeconds - 锁过期时间
 */
const withLock = async (lockKey, fn, expireSeconds = 30) => {
  const lock = await acquireLock(lockKey, expireSeconds)
  
  if (!lock.success) {
    throw new Error(`Failed to acquire lock: ${lock.error}`)
  }
  
  try {
    const result = await fn()
    return result
  } finally {
    await releaseLock(lockKey, lock.lockId)
  }
}

/**
 * 清理过期的锁（可定时触发）
 */
const cleanupExpiredLocks = async () => {
  try {
    const now = new Date()
    const { stats } = await db.collection('distributed_locks').where({
      expireTime: db.command.lt(now)
    }).remove()
    
    console.log(`Cleaned up ${stats.removed} expired locks`)
    return stats.removed
  } catch (err) {
    console.error('Cleanup locks error:', err)
    return 0
  }
}

module.exports = {
  acquireLock,
  releaseLock,
  withLock,
  cleanupExpiredLocks
}
