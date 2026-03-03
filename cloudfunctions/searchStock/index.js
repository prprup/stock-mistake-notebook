const cloud = require('wx-server-sdk')
cloud.init()
const axios = require('axios')

// Tushare API 配置 - 从环境变量读取
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN

if (!TUSHARE_TOKEN) {
  console.error('TUSHARE_TOKEN not set in environment variables')
}
const TUSHARE_API = 'http://api.tushare.pro'

exports.main = async (event, context) => {
  const { keyword } = event
  
  try {
    const response = await axios.post(TUSHARE_API, {
      api_name: 'stock_basic',
      token: TUSHARE_TOKEN,
      params: {
        list_status: 'L'
      },
      fields: 'ts_code,symbol,name,area,industry,list_date'
    })
    
    if (response.data.code !== 0) {
      return {
        success: false,
        error: response.data.msg
      }
    }
    
    const fields = response.data.data.fields
    const items = response.data.data.items
    
    // 模糊搜索
    const results = items
      .map(item => {
        const obj = {}
        fields.forEach((field, index) => {
          obj[field] = item[index]
        })
        return obj
      })
      .filter(stock => 
        stock.name.includes(keyword) || 
        stock.symbol.includes(keyword) ||
        stock.ts_code.includes(keyword)
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
    return {
      success: false,
      error: err.message
    }
  }
}
