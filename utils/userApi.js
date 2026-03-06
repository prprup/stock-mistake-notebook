// 用户相关 API

// 获取用户统计数据
export const getUserStats = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getUserStats'
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}