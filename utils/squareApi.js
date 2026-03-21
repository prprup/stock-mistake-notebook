// 错题广场相关 API

// 获取广场帖子
export const getSquarePosts = async (params = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getSquarePosts',
      data: params
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
