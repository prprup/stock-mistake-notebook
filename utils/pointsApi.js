// 积分相关 API
import { AD_REWARD_POINTS } from './adConfig.js'

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

// 增加积分（通用）
export const addPoints = async (points, type, description, extra = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'addPoints',
      data: { points, type, description, ...extra }
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 申请广告奖励票据
export const prepareAdRewardTicket = async (extra = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'adRewardTicket',
      data: {
        action: 'prepare',
        ...extra
      }
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 取消广告奖励票据
export const cancelAdRewardTicket = async (extra = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'adRewardTicket',
      data: {
        action: 'cancel',
        ...extra
      }
    })
    return result
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

// 领取广告奖励
export const claimAdReward = async (extra = {}) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'addPoints',
      data: {
        type: 'ad',
        points: AD_REWARD_POINTS,
        description: '观看广告奖励',
        ...extra
      }
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

