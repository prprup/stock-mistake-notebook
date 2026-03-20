// 广场详情页面
Page({
  data: {
    mistake: null,
    loading: true,
    comments: []
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.loadDetail(id)
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
    }
  },

  async loadDetail(id) {
    this.setData({ loading: true })

    try {
      // 获取错题详情
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
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      wx.navigateBack()
    }
  },

  // 点赞
  async like() {
    wx.showToast({ title: '点赞功能开发中', icon: 'none' })
  },

  // 评论
  comment() {
    wx.showToast({ title: '评论功能开发中', icon: 'none' })
  }
})