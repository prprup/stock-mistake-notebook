// 我的打赏记录页面
Page({
  data: {
    // 记录列表
    records: [],
    
    // 分页
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    
    // 统计
    stats: null
  },

  onLoad() {
    this.loadDonations()
  },

  onShow() {
    this.refreshData()
  },

  // 刷新数据
  refreshData() {
    this.setData({
      page: 1,
      records: [],
      hasMore: true,
      stats: null
    })
    this.loadDonations()
  },

  // 加载打赏记录
  async loadDonations() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getUserDonations',
          data: {
            page: this.data.page,
            pageSize: this.data.pageSize
          },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        const data = res.data
        
        // 合并数据
        const newRecords = this.data.page === 1 
          ? data.list 
          : [...this.data.records, ...data.list]

        this.setData({
          records: newRecords,
          stats: data.stats,
          hasMore: data.hasMore,
          page: this.data.page + 1
        })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      console.error('加载打赏记录失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadDonations()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
    wx.stopPullDownRefresh()
  },

  // 去打赏
  goToDonate() {
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