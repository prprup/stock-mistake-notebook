// 数据库事务工具

const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

/**
 * 执行带事务的操作
 * @param {Function} transactionFn - 事务函数，接收 transaction 对象
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
const runTransaction = async (transactionFn) => {
  try {
    const result = await db.runTransaction(async transaction => {
      return await transactionFn(transaction)
    })
    
    return {
      success: true,
      data: result
    }
  } catch (err) {
    console.error('Transaction error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * 安全地递增计数器（带事务）
 * @param {string} collection - 集合名
 * @param {string} docId - 文档ID
 * @param {string} field - 字段名
 * @param {number} increment - 增量（可为负数）
 */
const incrementCounter = async (collection, docId, field, increment = 1) => {
  return await runTransaction(async (transaction) => {
    const doc = await transaction.collection(collection).doc(docId).get()
    
    if (!doc.data) {
      throw new Error('Document not found')
    }
    
    const currentValue = doc.data[field] || 0
    const newValue = currentValue + increment
    
    // 检查不能为负数
    if (newValue < 0) {
      throw new Error('Counter cannot be negative')
    }
    
    await transaction.collection(collection).doc(docId).update({
      data: {
        [field]: newValue,
        updateTime: new Date()
      }
    })
    
    return { newValue }
  })
}

module.exports = {
  runTransaction,
  incrementCounter
}
