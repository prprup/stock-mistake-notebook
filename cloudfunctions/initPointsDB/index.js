const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 初始化数据库集合
 * 创建积分系统和股票打赏系统所需的数据库集合
 */
exports.main = async (event, context) => {
  try {
    const collections = [
      'user_points',           // 用户积分表
      'points_records',        // 积分变动记录
      'mistakes',              // 错题记录
      'stock_donations',       // 股票打赏记录
      'stock_donation_stats'   // 股票打赏统计
    ]
    
    const results = []

    for (const collectionName of collections) {
      try {
        // 检查集合是否存在
        await db.collection(collectionName).limit(1).get()
        results.push({
          collection: collectionName,
          status: 'exists',
          message: '集合已存在'
        })
      } catch (err) {
        if (err.message.includes('collection not exists')) {
          // 创建集合
          await db.createCollection(collectionName)
          results.push({
            collection: collectionName,
            status: 'created',
            message: '集合创建成功'
          })
        } else {
          results.push({
            collection: collectionName,
            status: 'error',
            message: err.message
          })
        }
      }
    }

    return {
      code: 0,
      message: '数据库初始化完成',
      data: results
    }
  } catch (err) {
    console.error('初始化数据库失败:', err)
    return {
      code: -1,
      message: '初始化失败',
      error: err.message
    }
  }
}