const cloud = require('wx-server-sdk')
cloud.init()

const { withLock } = require('../utils/lock.js')
const { runTransaction } = require('../utils/transaction.js')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event
  
  if (!id) {
    return { success: false, error: '缺少记录ID' }
  }
  
  try {
    // 使用分布式锁防止并发修改计数
    const result = await withLock(`user_${OPENID}_mistake`, async () => {
      const db = cloud.database()
      
      // 使用事务确保数据一致性
      const transactionResult = await runTransaction(async (transaction) => {
        // 先查询记录是否存在
        const mistakeQuery = await transaction.collection('mistakes').where({
          _openid: OPENID,
          _id: id
        }).get()
        
        if (mistakeQuery.data.length === 0) {
          throw new Error('记录不存在或无权删除')
        }
        
        // 删除记录
        await transaction.collection('mistakes').doc(id).remove()
        
        // 查询用户当前计数
        const userQuery = await transaction.collection('users').where({
          _openid: OPENID
        }).get()
        
        if (userQuery.data.length === 0) {
          throw new Error('用户不存在')
        }
        
        const user = userQuery.data[0]
        const currentCount = user.mistakeCount || 0
        const newCount = Math.max(0, currentCount - 1) // 不能减到负数
        
        // 更新用户错题计数
        await transaction.collection('users').doc(user._id).update({
          data: {
            mistakeCount: newCount,
            updateTime: new Date()
          }
        })
        
        return { newCount }
      })
      
      if (!transactionResult.success) {
        throw new Error(transactionResult.error)
      }
      
      return transactionResult.data
    }, 30)
    
    return {
      success: true,
      data: {
        mistakeCount: result.newCount
      }
    }
  } catch (err) {
    console.error('Delete mistake error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
