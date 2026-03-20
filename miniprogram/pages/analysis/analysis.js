// 统计分析页面
Page({
  data: {
    stats: null,
    loading: true
  },

  onLoad() {
    this.loadStats()
  },

  async loadStats() {
    this.setData({ loading: true })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getAnalysisStats',
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        this.setData({
          stats: res.data,
          loading: false
        })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载统计失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  }
})