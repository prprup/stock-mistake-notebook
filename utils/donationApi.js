// 股票打赏相关 API

// 打赏股票
export const donateToStock = async (data) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'donateToStock',
      data
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 获取股票打赏排行榜
export const getStockRanking = async (params = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getStockRanking',
      data: params
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 获取用户打赏记录
export const getUserDonations = async (params = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getUserDonations',
      data: params
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 搜索股票（复用原有 searchStock 云函数）
export const searchStocks = async (keyword) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'searchStock',
      data: { keyword }
    })
    // 统一返回格式
    if (result.success && result.data) {
      return {
        code: 0,
        data: result.data.map(s => ({
          code: s.tsCode || s.ts_code || '',
          name: s.name || '',
          market: (s.tsCode || s.ts_code || '').includes('.SH') ? '上海' : '深圳'
        }))
      }
    }
    return { code: -1, message: result.error || '搜索失败' }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
