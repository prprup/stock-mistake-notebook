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
    hotMistake: {
      name: '追高买入AI概念股',
      count: 328
    },
    mistakes: [],
    hasMore: true,
    page: 1
  },

  onLoad() {
    this.loadMistakes()
  },

  loadMistakes() {
    // 模拟数据
    const mockData = [
      {
        _id: '1',
        mistakeTypes: ['追高买入', '仓位过重'],
        reflection: '看到群里说这只票要涨停，没忍住全仓冲进去了，结果当天就炸板，第二天低开割肉。以后再也不信群消息了。',
        emotion: '贪婪',
        timeAgo: '2小时前',
        likes: 45,
        comments: 12,
        isLiked: false
      },
      {
        _id: '2',
        mistakeTypes: ['恐慌割肉'],
        reflection: '早盘低开3个点就慌了，赶紧割肉止损。结果下午V型反转，收盘涨2个点。我的心理素质还是太差了。',
        emotion: '恐慌',
        timeAgo: '5小时前',
        likes: 128,
        comments: 34,
        isLiked: true
      },
      {
        _id: '3',
        mistakeTypes: ['该止损没止损'],
        reflection: '-5%的时候舍不得割，想等反弹，结果一路跌到-20%。侥幸心理害死人，纪律性太差。',
        emotion: '犹豫',
        timeAgo: '昨天',
        likes: 89,
        comments: 23,
        isLiked: false
      },
      {
        _id: '4',
        mistakeTypes: ['频繁交易'],
        reflection: '这周每天都在买卖，手续费都亏了不少。回头看，如果拿着不动反而能赚。手痒是病，得治。',
        emotion: '冲动',
        timeAgo: '昨天',
        likes: 56,
        comments: 8,
        isLiked: false
      },
      {
        _id: '5',
        mistakeTypes: ['报复性交易'],
        reflection: '上午亏了一笔，下午就想赚回来，结果越亏越多。情绪失控的时候真的不能交易。',
        emotion: '后悔',
        timeAgo: '2天前',
        likes: 234,
        comments: 67,
        isLiked: true
      }
    ]

    this.setData({
      mistakes: mockData
    })
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ 
      currentFilter: filter,
      page: 1
    })
    // TODO: 根据筛选条件重新加载数据
    this.loadMistakes()
  },

  likeMistake(e) {
    const id = e.currentTarget.dataset.id
    const mistakes = this.data.mistakes.map(item => {
      if (item._id === id) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likes: item.isLiked ? item.likes - 1 : item.likes + 1
        }
      }
      return item
    })
    this.setData({ mistakes })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/square/detail/detail?id=${id}`
    })
  },

  loadMore() {
    // TODO: 加载更多数据
    wx.showToast({ title: '加载中...', icon: 'loading' })
  }
})
