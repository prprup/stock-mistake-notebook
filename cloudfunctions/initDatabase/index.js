const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 数据库集合配置
const collections = [
  {
    name: 'users',
    description: '用户信息',
    indexes: [
      { name: 'openid_index', fields: [{ openid: 1 }], unique: true }
    ]
  },
  {
    name: 'mistakes',
    description: '错题记录',
    indexes: [
      { name: 'userId_time_index', fields: [{ userId: 1 }, { createTime: -1 }] },
      { name: 'userId_stock_index', fields: [{ userId: 1 }, { stockCode: 1 }] },
      { name: 'planId_index', fields: [{ planId: 1 }] }
    ]
  },
  {
    name: 'plans',
    description: '交易预案',
    indexes: [
      { name: 'userId_date_index', fields: [{ userId: 1 }, { date: -1 }] },
      { name: 'userId_status_index', fields: [{ userId: 1 }, { status: 1 }] },
      { name: 'userId_stock_index', fields: [{ userId: 1 }, { stockCode: 1 }] }
    ]
  },
  {
    name: 'kline_cache',
    description: 'K线数据缓存',
    indexes: [
      { name: 'stock_date_index', fields: [{ stockCode: 1 }, { tradeDate: -1 }] },
      { name: 'expire_index', fields: [{ expireAt: 1 }], expireAfterSeconds: 0 }
    ]
  },
  {
    name: 'idempotency_keys',
    description: '幂等性键',
    indexes: [
      { name: 'key_index', fields: [{ key: 1 }], unique: true },
      { name: 'expire_index', fields: [{ expireAt: 1 }], expireAfterSeconds: 0 }
    ]
  },
  {
    name: 'distributed_locks',
    description: '分布式锁',
    indexes: [
      { name: 'resource_index', fields: [{ resource: 1 }], unique: true },
      { name: 'expire_index', fields: [{ expireAt: 1 }], expireAfterSeconds: 0 }
    ]
  }
]

// 集合权限配置
const permissions = {
  read: true,
  write: 'doc._openid == auth.openid || doc.userId == auth.openid'
}

exports.main = async (event, context) => {
  const results = []
  
  for (const coll of collections) {
    try {
      // 1. 创建集合
      await db.createCollection(coll.name)
      results.push({ collection: coll.name, action: 'created', status: 'success' })
      
      // 2. 创建索引
      for (const index of coll.indexes || []) {
        try {
          // 微信云开发创建索引的 API
          await db.collection(coll.name).createIndex({
            name: index.name,
            unique: index.unique || false,
            keys: index.fields.reduce((acc, field) => {
              const key = Object.keys(field)[0]
              acc[key] = field[key]
              return acc
            }, {})
          })
          results.push({ collection: coll.name, index: index.name, status: 'created' })
        } catch (indexErr) {
          results.push({ 
            collection: coll.name, 
            index: index.name, 
            status: 'error', 
            error: indexErr.message 
          })
        }
      }
      
    } catch (err) {
      if (err.message.includes('already exists')) {
        results.push({ collection: coll.name, action: 'exists', status: 'skipped' })
      } else {
        results.push({ 
          collection: coll.name, 
          action: 'create', 
          status: 'error', 
          error: err.message 
        })
      }
    }
  }
  
  return {
    success: true,
    message: '数据库初始化完成',
    results
  }
}
