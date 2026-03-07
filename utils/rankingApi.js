// 排行榜 API

// 获取本周错题共鸣排行榜（TOP3错误类型统计）
export const getRankingStats = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getRankingStats'
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
