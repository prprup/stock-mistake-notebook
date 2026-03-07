const cloud = require('wx-server-sdk')
cloud.init()
const axios = require('axios')

// Tushare API 配置 - 从环境变量读取
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN

if (!TUSHARE_TOKEN) {
  console.error('TUSHARE_TOKEN not set in environment variables')
}
const TUSHARE_API = 'http://api.tushare.pro'

// 缓存配置
const CACHE_COLLECTION = 'stock_cache'
const CACHE_KEY = 'stock_basic_list'
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24小时

/**
 * 获取缓存的股票数据
 */
async function getCachedStockData(db) {
  try {
    const cacheDoc = await db.collection(CACHE_COLLECTION).doc(CACHE_KEY).get()
    if (cacheDoc.data) {
      const cacheTime = cacheDoc.data.updateTime
      const now = new Date()
      // 检查缓存是否过期
      if (now.getTime() - new Date(cacheTime).getTime() < CACHE_DURATION_MS) {
        console.log('Using cached stock data')
        return cacheDoc.data.data
      }
    }
  } catch (err) {
    // 缓存不存在或读取失败
    console.log('Cache miss or error:', err.message)
  }
  return null
}

/**
 * 更新缓存
 */
async function updateCache(db, stockData) {
  try {
    const cacheRef = db.collection(CACHE_COLLECTION).doc(CACHE_KEY)
    await cacheRef.set({
      data: stockData,
      updateTime: new Date()
    })
    console.log('Stock cache updated')
  } catch (err) {
    console.error('Update cache error:', err)
  }
}

/**
 * 从 Tushare API 获取股票数据
 */
async function fetchStockDataFromAPI() {
  const response = await axios.post(TUSHARE_API, {
    api_name: 'stock_basic',
    token: TUSHARE_TOKEN,
    params: {
      list_status: 'L'
    },
    fields: 'ts_code,symbol,name,area,industry,list_date'
  })
  
  if (response.data.code !== 0) {
    throw new Error(response.data.msg)
  }
  
  const fields = response.data.data.fields
  const items = response.data.data.items
  
  // 转换为对象数组
  return items.map(item => {
    const obj = {}
    fields.forEach((field, index) => {
      obj[field] = item[index]
    })
    return obj
  })
}

exports.main = async (event, context) => {
  const { keyword } = event
  
  if (!keyword || keyword.trim().length === 0) {
    return { success: false, error: '搜索关键词不能为空' }
  }
  
  try {
    const db = cloud.database()
    const searchKey = keyword.trim()
    
    // 1. 尝试从缓存获取数据
    let stockData = await getCachedStockData(db)
    
    // 2. 缓存不存在或已过期，从API获取
    if (!stockData) {
      console.log('Fetching stock data from API...')
      stockData = await fetchStockDataFromAPI()
      // 更新缓存（异步，不阻塞返回结果）
      updateCache(db, stockData)
    }
    
    // 3. 在内存中过滤搜索结果
    const results = stockData
      .filter(stock => 
        stock.name.includes(searchKey) || 
        stock.symbol.includes(searchKey) ||
        stock.ts_code.includes(searchKey)
      )
      .slice(0, 20) // 最多返回20条
    
    return {
      success: true,
      data: results.map(s => ({
        tsCode: s.ts_code,
        symbol: s.symbol,
        name: s.name,
        area: s.area,
        industry: s.industry
      }))
    }
  } catch (err) {
    console.error('Search stock error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
