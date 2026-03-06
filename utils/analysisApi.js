// 统计分析相关云函数调用

// 获取统计分析数据
export const getAnalysisStats = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getAnalysisStats'
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
