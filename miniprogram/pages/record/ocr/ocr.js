// OCR识别页面
Page({
  data: {
    imagePath: '',
    recognizing: false,
    recognizedData: null
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          imagePath: res.tempFiles[0].tempFilePath
        })
        this.recognizeImage()
      }
    })
  },

  // 识别图片
  async recognizeImage() {
    if (!this.data.imagePath) return

    this.setData({ recognizing: true })

    try {
      // 上传图片到云存储
      const uploadRes = await new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath: `ocr/${Date.now()}.jpg`,
          filePath: this.data.imagePath,
          success: resolve,
          fail: reject
        })
      })

      // TODO: 调用OCR识别API
      // 这里使用模拟数据，实际应调用腾讯云OCR或百度OCR
      setTimeout(() => {
        this.setData({
          recognizing: false,
          recognizedData: {
            stockName: '模拟股票',
            stockCode: '000001',
            price: '10.50',
            quantity: '1000'
          }
        })
      }, 2000)

    } catch (err) {
      console.error('识别失败:', err)
      wx.showToast({ title: '识别失败', icon: 'none' })
      this.setData({ recognizing: false })
    }
  },

  // 确认并跳转到手动录入
  confirmAndGo() {
    const data = this.data.recognizedData
    if (!data) return

    const params = Object.keys(data)
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join('&')

    wx.redirectTo({
      url: `/pages/record/manual/manual?${params}`
    })
  },

  // 重新选择
  rechoose() {
    this.setData({
      imagePath: '',
      recognizedData: null
    })
    this.chooseImage()
  }
})