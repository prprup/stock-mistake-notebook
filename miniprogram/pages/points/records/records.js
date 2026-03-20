// 积分明细页面
Page({
  data: {
    records: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    total: 0,
    typeFilter: '' // 筛选类型
  },

  onLoad(options) {
    this.loadRecords()
  },

  onShow() {
    // 页面显示时刷新
    this.setData({ page: 1, records: [] })
    this.loadRecords()
  },

  // 加载积分记录
  async loadRecords() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getPointsRecords',
          data: {
            page: this.data.page,
            pageSize: this.data.pageSize,
            type: this.data.typeFilter || undefined
          },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        const data = res.data
        const newRecords = this.data.page === 1 
          ? data.list 
          : [...this.data.records, ...data.list]

        this.setData({
          records: newRecords,
          total: data.total,
          hasMore: data.hasMore,
          page: this.data.page + 1
        })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      console.error('加载积分记录失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadRecords()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1, records: [], hasMore: true })
    this.loadRecords().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 筛选类型
  filterByType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      typeFilter: type === this.data.typeFilter ? '' : type,
      page: 1,
      records: [],
      hasMore: true
    })
    this.loadRecords()
  },

  // 获取类型图标
  getTypeIcon(type) {
    const icons = {
      'mistake': '📝',
      'ad': '🎬',
      'checkin': '📅',
      'bonus': '🎁',
      'invite': '👥',
      'share': '🔗'
    }
    return icons[type] || '💰'
  },

  // 获取类型名称
  getTypeName(type) {
    const names = {
      'mistake': '录入错题',
      'ad': '观看广告',
      'checkin': '每日签到',
      'bonus': '系统奖励',
      'invite': '邀请好友',
      'share': '分享'
    }
    return names[type] || type
  }
})