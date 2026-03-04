// 预案相关云函数调用

// 添加预案
export const addPlan = async (data) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'addPlan',
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

// 获取预案列表
export const getPlans = async (params = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getPlans',
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

// 获取预案详情
export const getPlanDetail = async (id) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getPlanDetail',
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

// 更新预案
export const updatePlan = async (id, data) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'updatePlan',
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

// 删除预案
export const deletePlan = async (id) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'deletePlan',
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

// 执行预案（标记为已执行并关联错题）
export const executePlan = async (id, mistakeId) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'executePlan',
      data: { id, mistakeId }
    })
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
