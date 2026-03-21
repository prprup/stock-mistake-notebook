// 积分相关 API

// 获取用户积分信息
export const getPoints = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getPoints'
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 每日签到
export const checkIn = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'checkIn'
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 增加积分
export const addPoints = async (points, type, description) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'addPoints',
      data: { points, type, description }
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 获取积分记录
export const getPointsRecords = async (params = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getPointsRecords',
      data: params
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 录入错题并加积分
export const addMistakeWithPoints = async (data) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'addMistakeWithPoints',
      data
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
