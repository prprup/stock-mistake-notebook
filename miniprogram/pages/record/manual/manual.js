// 手动录入页逻辑
Page({
  data: {
    stockCode: '',
    action: 'buy',
    price: '',
    quantity: '',
    tradeDate: '',
    mistakeTypes: [
      { code: 'chase_high', name: '追高买入', selected: false },
      { code: 'panic_sell', name: '恐慌割肉', selected: false },
      { code: 'no_stop_loss', name: '该止损没止损', selected: false },
      { code: 'no_take_profit', name: '该止盈没止盈', selected: false },
      { code: 'heavy_position', name: '单票过重', selected: false },
      { code: 'full_position', name: '满仓梭哈', selected: false },
      { code: 'frequent_trade', name: '频繁交易', selected: false },
      { code: 'revenge_trade', name: '报复性交易', selected: false },
      { code: 'follow_news', name: '听信消息', selected: false },
      { code: 'follow_others', name: '跟风买入', selected: false }
    ],
    emotions: ['恐慌', '贪婪', '犹豫', '冲动', '自信', '后悔', '平静'],
    emotion: '',
    reflection: '',
    isPublic: false
  },

  onLoad() {
    // 设置默认日期为今天
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({ tradeDate: dateStr })
  },

  onStockCodeInput(e) {
    this.setData({ stockCode: e.detail.value })
  },

  selectAction(e) {
    this.setData({ action: e.currentTarget.dataset.action })
  },

  onPriceInput(e) {
    this.setData({ price: e.detail.value })
  },

  onQuantityInput(e) {
    this.setData({ quantity: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ tradeDate: e.detail.value })
  },

  toggleMistakeType(e) {
    const index = e.currentTarget.dataset.index
    const types = this.data.mistakeTypes
    types[index].selected = !types[index].selected
    this.setData({ mistakeTypes: types })
  },

  selectEmotion(e) {
    this.setData({ emotion: e.currentTarget.dataset.emotion })
  },

  onReflectionInput(e) {
    this.setData({ reflection: e.detail.value })
  },

  togglePublic(e) {
    this.setData({ isPublic: e.detail.value })
  },

  submit() {
    // 表单验证
    if (!this.data.stockCode) {
      wx.showToast({ title: '请输入股票代码', icon: 'none' })
      return
    }
    if (!this.data.price || !this.data.quantity) {
      wx.showToast({ title: '请输入价格和数量', icon: 'none' })
      return
    }
    
    const selectedTypes = this.data.mistakeTypes.filter(t => t.selected)
    if (selectedTypes.length === 0) {
      wx.showToast({ title: '请选择错误类型', icon: 'none' })
      return
    }

    // 构造提交数据
    const data = {
      stockCode: this.data.stockCode,
      action: this.data.action,
      price: parseFloat(this.data.price),
      quantity: parseInt(this.data.quantity),
      tradeDate: this.data.tradeDate,
      mistakeTypes: selectedTypes.map(t => t.name),
      emotion: this.data.emotion,
      reflection: this.data.reflection,
      isPublic: this.data.isPublic
    }

    console.log('提交数据:', data)

    // TODO: 调用云函数保存数据
    wx.showLoading({ title: '保存中...' })
    
    setTimeout(() => {
      wx.hideLoading()
      
      // 积分奖励提示
      wx.showToast({ 
        title: '记录成功 +10积分', 
        icon: 'success',
        duration: 2000
      })
      
      // TODO: 调用云函数增加积分
      // addPoints(10, 'mistake', '录入错题奖励', mistakeId)
      
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
    }, 1000)
  }
})
