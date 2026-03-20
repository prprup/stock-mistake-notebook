// 记录入口页面
Page({
  data: {
    recordTypes: [
      {
        id: 'manual',
        name: '手动录入',
        desc: '手动输入股票和交易信息',
        icon: '✏️',
        url: '/pages/record/manual/manual'
      },
      {
        id: 'ocr',
        name: '截图识别',
        desc: '上传交割单截图自动识别',
        icon: '📷',
        url: '/pages/record/ocr/ocr'
      }
    ]
  },

  goToRecord(e) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({ url })
  }
})