// 积分中心页面
Page({
  data: {
    points: 0,
    totalPoints: 0,
    checkInStreak: 0,
    hasCheckedIn: false,
    pointsRecords: [],
    tasks: [
      { id: 'mistake', name: '录入错题', desc: '每记录1条错题', points: 10, icon: '📝', status: 'ongoing' },
      { id: 'ad', name: '观看广告', desc: '完整观看激励视频', points: 20, icon: '🎬', status: 'available' },
      { id: 'checkin', name: '每日签到', desc: '连续签到7天额外奖励', points: 5, icon: '📅', status: 'available' }
    ],
    loading: false
  },

  onLoad() {
    this.loadPointsData()
  },

  onShow() {
    this.loadPointsData()
  },

  // 加载积分数据
  async loadPointsData() {
    this.setData({ loading: true })
    
    try {
      // 并行获取积分信息和积分记录
      const [pointsRes, recordsRes] = await Promise.all([
        this.getPointsInfo(),
        this.getPointsRecords()
      ])

      if (pointsRes.code === 0) {
        const data = pointsRes.data
        
        // 检查今天是否已签到
        let hasCheckedIn = false
        if (data.lastCheckIn) {
          const lastCheckIn = new Date(data.lastCheckIn)
          const today = new Date()
          hasCheckedIn = lastCheckIn.toDateString() === today.toDateString()
        }

        this.setData({
          points: data.points || 0,
          totalPoints: data.totalPoints || 0,
          checkInStreak: data.checkInStreak || 0,
          hasCheckedIn: hasCheckedIn
        })
      }

      if (recordsRes.code === 0) {
        this.setData({
          pointsRecords: recordsRes.data.list || []
        })
      }
    } catch (err) {
      console.error('加载积分数据失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 获取用户积分信息
  getPointsInfo() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getPoints',
        success: (res) => {
          resolve(res.result)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  // 获取积分记录
  getPointsRecords() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getPointsRecords',
        data: { page: 1, pageSize: 20 },
        success: (res) => {
          resolve(res.result)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  // 签到
  async checkIn() {
    if (this.data.hasCheckedIn) {
      wx.showToast({ title: '今日已签到', icon: 'none' })
      return
    }

    wx.showLoading({ title: '签到中...' })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'checkIn',
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      wx.hideLoading()

      if (res.code === 0) {
        const data = res.data
        this.setData({
          points: data.points,
          totalPoints: data.totalPoints,
          checkInStreak: data.checkInStreak,
          hasCheckedIn: true
        })

        // 刷新积分记录
        this.loadPointsData()

        wx.showToast({
          title: res.message,
          icon: 'none',
          duration: 2000
        })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('签到失败:', err)
      wx.showToast({ title: '签到失败', icon: 'none' })
    }
  },

  // 观看广告
  watchAd() {
    // 调用微信激励视频广告
    if (wx.createRewardedVideoAd) {
      const rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-xxxxxxxxxxxx' // 替换为实际的广告单元ID
      })

      rewardedVideoAd.onLoad(() => {
        console.log('激励视频广告加载成功')
      })

      rewardedVideoAd.onError((err) => {
        console.error('激励视频广告加载失败', err)
        wx.showToast({ title: '广告加载失败', icon: 'none' })
      })

      rewardedVideoAd.onClose(async (res) => {
        if (res && res.isEnded) {
          // 完整观看，发放奖励
          await this.addPoints(20, 'ad', '观看广告奖励')
        } else {
          wx.showToast({ title: '需要完整观看才能获得奖励', icon: 'none' })
        }
      })

      rewardedVideoAd.show().catch(() => {
        rewardedVideoAd.load().then(() => rewardedVideoAd.show())
      })
    } else {
      wx.showToast({ title: '当前版本不支持广告', icon: 'none' })
    }
  },

  // 增加积分
  async addPoints(points, type, desc) {
    wx.showLoading({ title: '发放奖励...' })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'addPoints',
          data: { points, type, description: desc },
          success: (res) => resolve(res.result),
          fail: reject
        })
      })

      wx.hideLoading()

      if (res.code === 0) {
        this.setData({
          points: res.data.points,
          totalPoints: res.data.totalPoints
        })

        // 刷新积分记录
        this.loadPointsData()

        wx.showToast({ title: res.message, icon: 'success' })
      } else {
        wx.showToast({ title: res.message, icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('增加积分失败:', err)
      wx.showToast({ title: '奖励发放失败', icon: 'none' })
    }
  },

  // 查看积分明细
  goToRecords() {
    wx.navigateTo({
      url: '/pages/points/records/records'
    })
  },

  // 做任务
  doTask(e) {
    const taskId = e.currentTarget.dataset.id

    switch (taskId) {
      case 'mistake':
        wx.switchTab({
          url: '/pages/record/record'
        })
        break
      case 'ad':
        this.watchAd()
        break
      case 'checkin':
        this.checkIn()
        break
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadPointsData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})