// 首页逻辑
Page({
  data: {
    monthMistakes: 0,
    totalMistakes: 0,
    streakDays: 0,
    todayTip: '',
    topMistake: null,
    recentMistakes: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    // 模拟数据，实际从云数据库获取
    this.setData({
      monthMistakes: 12,
      totalMistakes: 47,
      streakDays: 5,
      todayTip: '你本月追高错误比上月增加了3次，注意控制冲动',
      topMistake: {
        name: '追高买入',
        count: 8,
        description: '看到股价上涨就忍不住买入，结果买在短期高点'
      },
      recentMistakes: [
        {
          _id: '1',
          stockName: '某科技股',
          formattedDate: '03-01',
          mistakeTypes: ['追高买入', '仓位过重'],
          reflection: '看到新闻说利好就冲进去了，没有等回调'
        },
        {
          _id: '2',
          stockName: '某新能源股',
          formattedDate: '02-28',
          mistakeTypes: ['恐慌割肉'],
          reflection: '早盘低开就慌了，结果下午反弹了5%'
        }
      ]
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
  }
})
