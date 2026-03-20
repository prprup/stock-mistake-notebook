const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN || ''
const STOCK_CACHE_HOURS = 24  // 缓存24小时

/**
 * 从Tushare同步股票基础列表
 * 调用频率：每天一次
 */
async function syncStockListFromTushare() {
  try {
    console.log('开始从Tushare同步股票列表...')
    
    const response = await axios.post('http://api.tushare.pro', {
      api_name: 'stock_basic',
      token: TUSHARE_TOKEN,
      params: {
        exchange: '',
        list_status: 'L'  // 上市状态
      },
      fields: 'ts_code,symbol,name,area,industry,list_date'
    })

    if (response.data.code !== 0) {
      throw new Error(response.data.msg || 'Tushare接口返回错误')
    }

    const fields = response.data.data.fields
    const items = response.data.data.items
    
    // 转换为对象数组
    const stocks = items.map(item => {
      const obj = {}
      fields.forEach((field, index) => {
        obj[field] = item[index]
      })
      return {
        ts_code: obj.ts_code,      // 股票代码(带后缀)
        code: obj.symbol,          // 纯数字代码
        name: obj.name,
        area: obj.area,
        industry: obj.industry,
        list_date: obj.list_date,
        exchange: obj.ts_code.endsWith('.SH') ? 'SH' : 
                  obj.ts_code.endsWith('.SZ') ? 'SZ' : 'BJ',
        updateTime: db.serverDate()
      }
    })

    console.log(`获取到 ${stocks.length} 只股票`)

    // 批量写入数据库（分批处理，每批500条）
    const batchSize = 500
    let successCount = 0
    
    for (let i = 0; i < stocks.length; i += batchSize) {
      const batch = stocks.slice(i, i + batchSize)
      
      // 使用云开发的批量写入
      const tasks = batch.map(stock => {
        return db.collection('stock_basic').where({
          ts_code: stock.ts_code
        }).count().then(res => {
          if (res.total === 0) {
            // 新增
            return db.collection('stock_basic').add({ data: stock })
          } else {
            // 更新
            return db.collection('stock_basic').where({
              ts_code: stock.ts_code
            }).update({ 
              data: {
                name: stock.name,
                area: stock.area,
                industry: stock.industry,
                updateTime: stock.updateTime
              }
            })
          }
        })
      })
      
      await Promise.all(tasks)
      successCount += batch.length
    }

    // 记录缓存时间
    await db.collection('cache_config').doc('stock_basic_cache').set({
      data: {
        lastUpdate: db.serverDate(),
        count: stocks.length
      }
    })

    console.log(`同步完成，共处理 ${successCount} 只股票`)
    return { success: true, count: successCount }
  } catch (err) {
    console.error('同步股票列表失败:', err)
    throw err
  }
}

/**
 * 检查缓存是否有效
 */
async function isCacheValid() {
  try {
    const cacheInfo = await db.collection('cache_config').doc('stock_basic_cache').get()
    if (!cacheInfo.data) return false
    
    const lastUpdate = cacheInfo.data.lastUpdate
    const now = new Date()
    const cacheTime = new Date(lastUpdate)
    const diffHours = (now - cacheTime) / (1000 * 60 * 60)
    
    return diffHours < STOCK_CACHE_HOURS
  } catch (err) {
    return false
  }
}

/**
 * 搜索股票
 */
exports.main = async (event, context) => {
  const { keyword, limit = 20, forceUpdate = false } = event

  if (!keyword || keyword.trim() === '') {
    return {
      code: -1,
      message: '请输入搜索关键词'
    }
  }

  try {
    // 检查是否需要同步数据
    const cacheValid = await isCacheValid()
    if (!cacheValid || forceUpdate) {
      console.log('缓存无效或强制更新，开始同步...')
      await syncStockListFromTushare()
    }

    // 从本地数据库搜索
    const searchKey = keyword.trim()
    const searchKeyUpper = searchKey.toUpperCase()

    // 构建查询条件
    let query = db.collection('stock_basic')

    // 如果输入是纯数字，按代码搜索
    if (/^\d+$/.test(searchKey)) {
      query = query.where({
        code: db.RegExp({
          regexp: searchKey,
          options: 'i'
        })
      })
    } else {
      // 否则按名称搜索
      query = query.where({
        name: db.RegExp({
          regexp: searchKey,
          options: 'i'
        })
      })
    }

    const result = await query
      .limit(parseInt(limit))
      .get()

    // 格式化返回数据
    const stocks = result.data.map(item => ({
      code: item.code,
      name: item.name,
      ts_code: item.ts_code,
      exchange: item.exchange,
      area: item.area,
      industry: item.industry
    }))

    return {
      code: 0,
      data: stocks,
      message: stocks.length > 0 ? '搜索成功' : '未找到匹配的股票',
      meta: {
        cacheValid: true,
        count: stocks.length
      }
    }
  } catch (err) {
    console.error('搜索股票失败:', err)
    return {
      code: -1,
      message: '搜索失败',
      error: err.message
    }
  }
}