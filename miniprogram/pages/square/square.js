// 错题广场逻辑
Page({
  data: {
    currentFilter: 'all',
    mistakeTypes: [
      { code: 'chase_high', name: '追高' },
      { code: 'panic_sell', name: '割肉' },
      { code: 'no_stop_loss', name: '不止损' },
      { code: 'heavy_position', name: '重仓' },
      { code: 'frequent_trade', name: '频繁交易' },
      { code: 'revenge_trade', name: '报复交易' }
    ],
    hotMistake: null,
    mistakes: [],
    hasMore: true,
    page: 1,
    pageSize: 20,
    loading: false
  },

  onLoad() {
    this.loadMistakes()
  },

  onShow() {
    this.refreshData()
  },

  refreshData() {
    this.setData({
      page: 1,
      mistakes: [],
      hasMore: true
    })
    this.loadMistakes()
  },

  async loadMistakes() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getSquarePosts',
          data: {
            page: this.data.page,
            pageSize: this.data.pageSize,
            filter: this.data.currentFilter
          },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        const data = res.data
        
        // 合并数据
        const newMistakes = this.data.page === 1 
          ? data.list 
          : [...this.data.mistakes, ...data.list]

        this.setData({
          mistakes: newMistakes,
          hotMistake: data.hotMistake,
          hasMore: data.hasMore,
          page: this.data.page + 1
        })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      console.error('加载广场数据失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ 
      currentFilter: filter,
      page: 1,
      mistakes: [],
      hasMore: true
    })
    this.loadMistakes()
  },

  loadMore() {
    this.loadMistakes()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMistakes()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
    wx.stopPullDownRefresh()
  }
})