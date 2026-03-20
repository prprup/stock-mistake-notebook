// 错题详情页面
Page({
  data: {
    mistake: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.loadMistakeDetail(id)
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
    }
  },

  async loadMistakeDetail(id) {
    this.setData({ loading: true })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getMistakeDetail',
          data: { id: id },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        this.setData({
          mistake: res.data,
          loading: false
        })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
        wx.navigateBack()
      }
    } catch (err) {
      console.error('加载详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      wx.navigateBack()
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  }
})