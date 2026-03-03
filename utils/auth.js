// 云开发初始化
const cloud = uniCloud.init({
  provider: 'wx',
  spaceId: '' // 后续填入云开发环境 ID
})

// 用户登录
export const login = async () => {
  try {
    // 获取微信登录凭证
    const [loginRes] = await uni.login({
      provider: 'weixin'
    })
    
    if (loginRes.code) {
      // 调用云函数登录
      const { result } = await uniCloud.callFunction({
        name: 'login',
        data: {
          code: loginRes.code
        }
      })
      
      if (result.success) {
        // 保存用户信息到本地
        uni.setStorageSync('userInfo', result.data)
        uni.setStorageSync('isLogin', true)
        return {
          success: true,
          data: result.data
        }
      } else {
        return {
          success: false,
          error: result.error
        }
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

// 检查登录状态
export const checkLogin = () => {
  return uni.getStorageSync('isLogin') === true
}

// 获取用户信息
export const getUserInfo = () => {
  return uni.getStorageSync('userInfo') || null
}

// 退出登录
export const logout = () => {
  uni.removeStorageSync('userInfo')
  uni.removeStorageSync('isLogin')
}

// 更新用户信息
export const updateUserInfo = async (userData) => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'updateUser',
      data: userData
    })
    
    if (result.success) {
      // 更新本地缓存
      const currentUser = getUserInfo()
      const updatedUser = { ...currentUser, ...userData }
      uni.setStorageSync('userInfo', updatedUser)
    }
    
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
