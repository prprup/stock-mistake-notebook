// 首页数据 API

// 获取首页统计数据
export const getHomeStats = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getHomeStats'
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
