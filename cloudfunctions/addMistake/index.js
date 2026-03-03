const cloud = require('wx-server-sdk')
cloud.init()

const { checkIdempotency, updateIdempotencyResult } = require('../utils/idempotency.js')
const { withLock } = require('../utils/lock.js')
const { runTransaction } = require('../utils/transaction.js')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { 
    stockName, 
    stockCode, 
    mistakeTypes, 
    emotion, 
    reflection, 
    lossAmount, 
    date,
    images = [],
    idempotencyKey  // 幂等键，前端生成
  } = event
  
  // 参数校验
  if (!stockName || !stockCode) {
    return { success: false, error: '股票信息不能为空' }
  }
  
  // 生成默认幂等键（如果前端没传）
  const key = idempotencyKey || `${OPENID}_${stockCode}_${date || ''}_${stockName}`
  
  try {
    // 1. 幂等性检查
    const idempotencyCheck = await checkIdempotency(key, 300)
    if (!idempotencyCheck.isNew) {
      // 重复请求，返回之前的结果
      return {
        success: true,
        data: idempotencyCheck.existingResult,
        isDuplicate: true
      }
    }
    
    // 2. 获取分布式锁（防止并发修改用户计数）
    const result = await withLock(`user_${OPENID}_mistake`, async () => {
      const db = cloud.database()
      const now = new Date()
      
      // 3. 使用事务添加记录和更新计数
      const transactionResult = await runTransaction(async (transaction) => {
        // 添加错题记录
        const mistakeResult = await transaction.collection('mistakes').add({
          data: {
            _openid: OPENID,
            stockName,
            stockCode,
            mistakeTypes: mistakeTypes || [],
            emotion: emotion || '',
            reflection: reflection || '',
            lossAmount: lossAmount || 0,
            date: date || now,
            images,
            createTime: now,
            updateTime: now
          }
        })
        
        // 查询用户当前计数
        const userQuery = await transaction.collection('users').where({
          _openid: OPENID
        }).get()
        
        if (userQuery.data.length === 0) {
          throw new Error('User not found')
        }
        
        const user = userQuery.data[0]
        const newCount = (user.mistakeCount || 0) + 1
        
        // 更新用户错题计数
        await transaction.collection('users').doc(user._id).update({
          data: {
            mistakeCount: newCount,
            updateTime: now
          }
        })
        
        return {
          mistakeId: mistakeResult._id,
          newCount: newCount
        }
      })
      
      if (!transactionResult.success) {
        throw new Error(transactionResult.error)
      }
      
      return transactionResult.data
    }, 30)
    
    // 4. 更新幂等键结果
    const responseData = {
      _id: result.mistakeId,
      mistakeCount: result.newCount
    }
    await updateIdempotencyResult(key, responseData)
    
    return {
      success: true,
      data: responseData
    }
    
  } catch (err) {
    console.error('Add mistake error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
