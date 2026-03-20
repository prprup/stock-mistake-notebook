// 股票打赏页面
Page({
  data: {
    // 搜索相关
    searchKeyword: '',
    searchResults: [],
    searching: false,
    
    // 选中的股票
    selectedStock: null,
    
    // 打赏相关
    points: 10,
    message: '',
    quickAmounts: [10, 50, 100, 500, 1000],
    
    // 用户积分
    userPoints: 0,
    
    // 提交状态
    submitting: false
  },

  onLoad() {
    this.loadUserPoints()
  },

  onShow() {
    this.loadUserPoints()
  },

  // 加载用户积分
  async loadUserPoints() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getPoints',
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        this.setData({ userPoints: res.data.points || 0 })
      }
    } catch (err) {
      console.error('获取积分失败:', err)
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      if (this.data.searchKeyword.trim()) {
        this.searchStocks()
      } else {
        this.setData({ searchResults: [] })
      }
    }, 300)
  },

  // 搜索股票
  async searchStocks() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) return

    this.setData({ searching: true })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'searchStocks',
          data: { keyword: keyword, limit: 10 },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        this.setData({ searchResults: res.data })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      console.error('搜索失败:', err)
      wx.showToast({ title: '搜索失败', icon: 'none' })
    } finally {
      this.setData({ searching: false })
    }
  },

  // 选择股票
  selectStock(e) {
    const stock = e.currentTarget.dataset.stock
    this.setData({
      selectedStock: stock,
      searchResults: [],
      searchKeyword: ''
    })
  },

  // 清除选中的股票
  clearSelectedStock() {
    this.setData({ selectedStock: null })
  },

  // 选择快捷金额
  selectQuickAmount(e) {
    const amount = e.currentTarget.dataset.amount
    this.setData({ points: amount })
  },

  // 积分输入
  onPointsInput(e) {
    let value = parseInt(e.detail.value) || 0
    if (value < 0) value = 0
    if (value > 10000) value = 10000
    this.setData({ points: value })
  },

  // 留言输入
  onMessageInput(e) {
    this.setData({ message: e.detail.value })
  },

  // 提交打赏
  async submitDonation() {
    const { selectedStock, points, message, userPoints, submitting } = this.data

    if (!selectedStock) {
      wx.showToast({ title: '请先选择股票', icon: 'none' })
      return
    }

    if (points <= 0) {
      wx.showToast({ title: '打赏积分必须大于0', icon: 'none' })
      return
    }

    if (points > userPoints) {
      wx.showToast({ title: '积分不足', icon: 'none' })
      return
    }

    if (submitting) return

    // 确认弹窗
    const confirmRes = await new Promise((resolve) => {
      wx.showModal({
        title: '确认打赏',
        content: `确定要打赏 ${selectedStock.name}(${selectedStock.code}) ${points}积分吗？`,
        success: (res) => resolve(res.confirm)
      })
    })

    if (!confirmRes) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'donateToStock',
          data: {
            stockCode: selectedStock.code,
            stockName: selectedStock.name,
            points: points,
            message: message
          },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      wx.hideLoading()

      if (res.code === 0) {
        wx.showToast({
          title: '打赏成功',
          icon: 'success',
          duration: 2000
        })

        // 更新积分和重置表单
        this.setData({
          userPoints: res.data.remainingPoints,
          selectedStock: null,
          points: 10,
          message: ''
        })

        // 延迟跳转到排行榜
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/stockDonation/ranking/ranking'
          })
        }, 1500)
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('打赏失败:', err)
      wx.showToast({ title: '打赏失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 跳转到排行榜
  goToRanking() {
    wx.navigateTo({
      url: '/pages/stockDonation/ranking/ranking'
    })
  },

  // 跳转到我的打赏
  goToMyDonations() {
    wx.navigateTo({
      url: '/pages/stockDonation/myDonations/myDonations'
    })
  }
})