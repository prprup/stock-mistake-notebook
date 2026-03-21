const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN || ''

/**
 * 从Tushare同步股票基础列表
 * 用于定时任务或手动触发
 */
exports.main = async (event, context) => {
  const { forceUpdate = false } = event
  
  if (!TUSHARE_TOKEN) {
    return {
      code: -1,
      message: 'TUSHARE_TOKEN未配置'
    }
  }

  try {
    console.log('开始从Tushare同步股票列表...')
    
    const response = await axios.post('http://api.tushare.pro', {
      api_name: 'stock_basic',
      token: TUSHARE_TOKEN,
      params: {
        exchange: '',
        list_status: 'L'  // 上市状态
      },
      fields: 'ts_code,symbol,name,area,industry,list_date,market,is_hs'
    }, {
      timeout: 30000
    })

    if (response.data.code !== 0) {
      throw new Error(response.data.msg || 'Tushare接口返回错误')
    }

    const fields = response.data.data.fields
    const items = response.data.data.items
    
    console.log(`获取到 ${items.length} 只股票数据`)

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
        area: obj.area || '',
        industry: obj.industry || '',
        market: obj.market || '',
        is_hs: obj.is_hs || '',
        list_date: obj.list_date,
        exchange: obj.ts_code.endsWith('.SH') ? 'SH' : 
                  obj.ts_code.endsWith('.SZ') ? 'SZ' : 'BJ',
        updateTime: db.serverDate()
      }
    })

    // 清空旧数据并批量写入新数据
    // 先删除所有数据
    const oldData = await db.collection('stock_basic').limit(1000).get()
    const deleteTasks = oldData.data.map(item => 
      db.collection('stock_basic').doc(item._id).remove()
    )
    if (deleteTasks.length > 0) {
      await Promise.all(deleteTasks)
      console.log(`删除旧数据 ${deleteTasks.length} 条`)
    }

    // 批量写入新数据
    const batchSize = 500
    let successCount = 0
    
    for (let i = 0; i < stocks.length; i += batchSize) {
      const batch = stocks.slice(i, i + batchSize)
      const addTasks = batch.map(stock => 
        db.collection('stock_basic').add({ data: stock })
      )
      await Promise.all(addTasks)
      successCount += batch.length
      console.log(`已写入 ${successCount}/${stocks.length}`)
    }

    // 记录缓存时间
    await db.collection('cache_config').doc('stock_basic_cache').set({
      data: {
        lastUpdate: db.serverDate(),
        count: stocks.length,
        updateTime: db.serverDate()
      }
    })

    console.log(`同步完成，共处理 ${successCount} 只股票`)
    
    return {
      code: 0,
      message: '同步成功',
      data: {
        total: successCount,
        lastUpdate: new Date().toISOString()
      }
    }
  } catch (err) {
    console.error('同步股票列表失败:', err)
    return {
      code: -1,
      message: '同步失败',
      error: err.message
    }
  }
}