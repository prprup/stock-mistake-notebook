const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 录入错题并增加积分
 * 兼容旧调用，统一转发到 addMistake 主链
 */
exports.main = async (event, context) => {
  try {
    const addMistake = require('../addMistake/index.js')
    const result = await addMistake.main(event, context)

    if (result && typeof result.success === 'boolean') {
      return {
        code: result.success ? 0 : -1,
        message: result.success ? '录入成功' : (result.error || '录入失败'),
        data: result.success ? {
          mistakeId: result.data?._id,
          pointsAdded: result.data?.pointsAdded || 0,
          currentPoints: result.data?.currentPoints || 0,
          totalPoints: result.data?.totalPoints || 0
        } : null,
        success: result.success,
        error: result.error
      }
    }

    return result
  } catch (err) {
    console.error('录入错题失败:', err)
    return {
      code: -1,
      message: '录入失败',
      error: err.message
    }
  }
}
