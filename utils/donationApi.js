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

// 搜索股票
export const searchStocks = async (keyword) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'searchStocks',
      data: { keyword }
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
