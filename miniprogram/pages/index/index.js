// 首页逻辑
Page({
  data: {
    monthMistakes: 0,
    totalMistakes: 0,
    streakDays: 0,
    points: 0,
    todayTip: '',
    topMistake: null,
    recentMistakes: [],
    loading: false
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getHomeStats',
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        this.setData({
          monthMistakes: res.data.monthMistakes,
          totalMistakes: res.data.totalMistakes,
          streakDays: res.data.streakDays,
          points: res.data.points,
          todayTip: res.data.todayTip,
          topMistake: res.data.topMistake,
          recentMistakes: res.data.recentMistakes
        })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      console.error('加载数据失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goToPoints() {
    wx.navigateTo({
      url: '/pages/points/points'
    })
  },

  goToManual() {
    wx.navigateTo({
      url: '/pages/record/manual/manual'
    })
  },

  goToOCR() {
    wx.navigateTo({
      url: '/pages/record/ocr/ocr'
    })
  },

  goToMistakes() {
    wx.switchTab({
      url: '/pages/mistakes/mistakes'
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/mistakes/detail/detail?id=${id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})