// 个人中心页面
Page({
  data: {
    userInfo: null,
    stats: {
      totalMistakes: 0,
      totalPoints: 0,
      checkInStreak: 0
    },
    loading: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    this.setData({ loading: true })

    try {
      // 获取用户信息（使用 wx.getUserProfile 或 wx.getUserInfo）
      let userInfo = null
      try {
        const userRes = await new Promise((resolve, reject) => {
          wx.getUserProfile ? 
            wx.getUserProfile({
              desc: '用于完善用户资料',
              success: resolve,
              fail: reject
            }) :
            wx.getUserInfo({
              success: resolve,
              fail: reject
            })
        })
        userInfo = userRes.userInfo
      } catch (e) {
        console.log('获取用户信息失败，可能未授权')
      }

      // 获取用户统计信息（积分、错题数等）
      const statsRes = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getUserStats',
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (statsRes.code === 0) {
        this.setData({
          userInfo: userInfo,
          stats: {
            totalMistakes: statsRes.data.totalMistakes,
            totalPoints: statsRes.data.totalPoints,
            checkInStreak: statsRes.data.checkInStreak
          }
        })
      } else {
        this.setData({ userInfo })
        wx.showToast({ title: statsRes.message, icon: 'none' })
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 去积分中心
  goToPoints() {
    wx.navigateTo({
      url: '/pages/points/points'
    })
  },

  // 去股票打赏
  goToStockDonation() {
    wx.navigateTo({
      url: '/pages/stockDonation/donate/donate'
    })
  },

  // 去排行榜
  goToRanking() {
    wx.navigateTo({
      url: '/pages/stockDonation/ranking/ranking'
    })
  }
})