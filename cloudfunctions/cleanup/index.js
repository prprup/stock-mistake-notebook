const cloud = require('wx-server-sdk')
cloud.init()

const { cleanupExpiredKeys } = require('./utils/idempotency.js')
const { cleanupExpiredLocks } = require('./utils/lock.js')

exports.main = async (event, context) => {
  try {
    const keysRemoved = await cleanupExpiredKeys()
    const locksRemoved = await cleanupExpiredLocks()
    
    return {
      success: true,
      data: {
        keysRemoved,
        locksRemoved
      }
    }
  } catch (err) {
    console.error('Cleanup error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
