// K线数据相关 API

// 获取股票K线数据
export const getKlineData = async (tsCode, startDate, endDate) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getKlineData',
      data: { tsCode, startDate, endDate }
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 搜索股票
export const searchStock = async (keyword) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'searchStock',
      data: { keyword }
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 获取带错题标记的K线数据
export const getKlineWithMistakes = async (tsCode, startDate, endDate) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getKlineWithMistakes',
      data: { tsCode, startDate, endDate }
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 格式化K线数据为图表所需格式
export const formatKlineData = (klineData) => {
  return klineData.map(item => ({
    date: item.date,
    // ucharts 格式：[开盘价, 收盘价, 最低价, 最高价, 成交量]
    data: [item.open, item.close, item.low, item.high, item.volume],
    // 标记信息
    mark: item.hasMistake ? {
      type: 'mistake',
      info: item.mistakeInfo
    } : null
  }))
}

// 获取日期范围（默认最近90天）
export const getDateRange = (days = 90) => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  
  const format = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}${m}${d}`
  }
  
  return {
    startDate: format(start),
    endDate: format(end)
  }
}
