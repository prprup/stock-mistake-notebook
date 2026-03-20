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
      // 获取用户信息
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

      // 获取积分信息
      const pointsRes = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getPoints',
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      this.setData({
        userInfo: userRes.userInfo,
        stats: {
          totalMistakes: 0, // TODO: 从云函数获取
          totalPoints: pointsRes.code === 0 ? pointsRes.data.totalPoints : 0,
          checkInStreak: pointsRes.code === 0 ? pointsRes.data.checkInStreak : 0
        }
      })
    } catch (err) {
      console.error('获取用户信息失败:', err)
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