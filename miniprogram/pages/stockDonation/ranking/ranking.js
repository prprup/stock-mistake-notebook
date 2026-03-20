// 股票打赏排行榜页面
Page({
  data: {
    // 排行榜数据
    ranking: [],
    userDonations: [],
    
    // 分页
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    
    // 周期筛选
    period: 'all',
    periods: [
      { key: 'all', name: '总榜' },
      { key: 'week', name: '本周' },
      { key: 'month', name: '本月' }
    ],
    
    // 我的统计
    myStats: null
  },

  onLoad() {
    this.loadRanking()
  },

  onShow() {
    this.refreshData()
  },

  // 刷新数据
  refreshData() {
    this.setData({
      page: 1,
      ranking: [],
      hasMore: true
    })
    this.loadRanking()
  },

  // 加载排行榜
  async loadRanking() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'getStockRanking',
          data: {
            page: this.data.page,
            pageSize: this.data.pageSize,
            period: this.data.period
          },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      if (res.code === 0) {
        const data = res.data
        
        // 合并数据
        const newRanking = this.data.page === 1 
          ? data.list 
          : [...this.data.ranking, ...data.list]

        this.setData({
          ranking: newRanking,
          userDonations: data.userDonations || [],
          hasMore: data.hasMore,
          page: this.data.page + 1
        })

        // 计算我的统计
        this.calculateMyStats(data.userDonations)
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      console.error('加载排行榜失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 计算我的统计
  calculateMyStats(userDonations) {
    if (!userDonations || userDonations.length === 0) {
      this.setData({ myStats: null })
      return
    }

    const totalDonated = userDonations.reduce((sum, item) => sum + item.totalPoints, 0)
    const stockCount = userDonations.length

    // 找出我打赏最多的股票
    const topStock = userDonations.sort((a, b) => b.totalPoints - a.totalPoints)[0]

    this.setData({
      myStats: {
        totalDonated,
        stockCount,
        topStockName: topStock.stockName,
        topStockPoints: topStock.totalPoints
      }
    })
  },

  // 切换周期
  switchPeriod(e) {
    const period = e.currentTarget.dataset.period
    this.setData({
      period: period,
      page: 1,
      ranking: [],
      hasMore: true
    })
    this.loadRanking()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadRanking()
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

  // 去我的打赏
  goToMyDonations() {
    wx.navigateTo({
      url: '/pages/stockDonation/myDonations/myDonations'
    })
  },

  // 获取排名样式
  getRankStyle(rank) {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'silver'
    if (rank === 3) return 'bronze'
    return ''
  }
})