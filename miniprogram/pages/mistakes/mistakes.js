// 错题列表页面
Page({
  data: {
    mistakes: [],
    filterType: 'all',
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20
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
          name: 'getMistakes',
          data: {
            page: this.data.page,
            pageSize: this.data.pageSize,
            type: this.data.filterType === 'all' ? null : this.data.filterType
          },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        const newMistakes = this.data.page === 1 
          ? res.data.list 
          : [...this.data.mistakes, ...res.data.list]

        this.setData({
          mistakes: newMistakes,
          hasMore: res.data.hasMore,
          page: this.data.page + 1
        })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      console.error('加载错题失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  setFilter(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      filterType: type,
      page: 1,
      mistakes: [],
      hasMore: true
    })
    this.loadMistakes()
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/mistakes/detail/detail?id=${id}`
    })
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