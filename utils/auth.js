// 用户登录
export const login = async () => {
  try {
    // 获取微信登录凭证
    const [loginRes] = await uni.login({
      provider: 'weixin'
    })
    
    if (!loginRes.code) {
      return {
        success: false,
        error: '获取登录凭证失败'
      }
    }
    
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
      uni.setStorageSync('loginTime', Date.now())
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        error: result.error || '登录失败'
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '登录异常'
    }
  }
}

// 检查登录状态
export const checkLogin = () => {
  const isLogin = uni.getStorageSync('isLogin') === true
  const loginTime = uni.getStorageSync('loginTime')
  
  // 检查登录是否过期（7天）
  if (isLogin && loginTime) {
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - loginTime > sevenDays) {
      // 过期，清除登录状态
      logout()
      return false
    }
  }
  
  return isLogin
}

// 获取用户信息
export const getUserInfo = () => {
  return uni.getStorageSync('userInfo') || null
}

// 退出登录
export const logout = () => {
  uni.removeStorageSync('userInfo')
  uni.removeStorageSync('isLogin')
  uni.removeStorageSync('loginTime')
}

// 更新用户信息
export const updateUserInfo = async (userData) => {
  try {
    // 字段白名单校验
    const allowedFields = ['nickname', 'avatarUrl', 'gender', 'birthday']
    const filteredData = {}
    
    for (const key of allowedFields) {
      if (userData.hasOwnProperty(key)) {
        filteredData[key] = userData[key]
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      return {
        success: false,
        error: '没有有效的更新字段'
      }
    }
    
    const { result } = await uniCloud.callFunction({
      name: 'updateUser',
      data: filteredData
    })
    
    if (result.success) {
      // 更新本地缓存
      const currentUser = getUserInfo() || {}
      const updatedUser = { ...currentUser, ...filteredData }
      uni.setStorageSync('userInfo', updatedUser)
    }
    
    return result
  } catch (err) {
    return {
      success: false,
      error: err.message || '更新失败'
    }
  }
}
