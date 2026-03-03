// 错题相关云函数调用

// 添加错题
export const addMistake = async (data) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'addMistake',
      data
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 获取错题列表
export const getMistakes = async (params = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getMistakes',
      data: params
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 获取错题详情
export const getMistakeDetail = async (id) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getMistakeDetail',
      data: { id }
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 更新错题
export const updateMistake = async (id, data) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'updateMistake',
      data: { id, ...data }
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 删除错题
export const deleteMistake = async (id) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'deleteMistake',
      data: { id }
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 上传图片到云存储
export const uploadImage = async (filePath) => {
  try {
    const { fileID } = await uniCloud.uploadFile({
      cloudPath: `mistakes/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`,
      filePath
    })
    return {
      success: true,
      fileID
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
