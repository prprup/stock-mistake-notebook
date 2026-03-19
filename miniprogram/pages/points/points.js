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
    ]
  },

  onLoad() {
    this.loadPointsData()
  },

  onShow() {
    this.loadPointsData()
  },

  async loadPointsData() {
    // 模拟数据，实际从云数据库获取
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    this.setData({
      points: 1250,
      totalPoints: 1580,
      checkInStreak: 3,
      hasCheckedIn: false, // 今天是否已签到
      pointsRecords: [
        { type: 'mistake', desc: '录入错题奖励', points: 10, time: '10:30' },
        { type: 'checkin', desc: '每日签到', points: 5, time: '昨天' },
        { type: 'ad', desc: '观看广告奖励', points: 20, time: '昨天' },
        { type: 'mistake', desc: '录入错题奖励', points: 10, time: '前天' }
      ]
    })
  },

  // 签到
  checkIn() {
    if (this.data.hasCheckedIn) {
      wx.showToast({ title: '今日已签到', icon: 'none' })
      return
    }

    wx.showLoading({ title: '签到中...' })
    
    // TODO: 调用云函数进行签到
    setTimeout(() => {
      const newStreak = this.data.checkInStreak + 1
      const bonusPoints = newStreak % 7 === 0 ? 10 : 0 // 连续7天额外奖励
      const totalAdd = 5 + bonusPoints

      this.setData({
        points: this.data.points + totalAdd,
        totalPoints: this.data.totalPoints + totalAdd,
        checkInStreak: newStreak,
        hasCheckedIn: true
      })

      wx.hideLoading()
      wx.showToast({ 
        title: bonusPoints > 0 ? `签到成功！连续${newStreak}天，额外+${bonusPoints}` : '签到成功 +5',
        icon: 'none'
      })
    }, 500)
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

      rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 完整观看，发放奖励
          this.addPoints(20, 'ad', '观看广告奖励')
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
  addPoints(points, type, desc) {
    // TODO: 调用云函数增加积分
    this.setData({
      points: this.data.points + points,
      totalPoints: this.data.totalPoints + points
    })
    
    const newRecord = { type, desc, points, time: '刚刚' }
    this.setData({
      pointsRecords: [newRecord, ...this.data.pointsRecords]
    })

    wx.showToast({ title: `+${points}积分`, icon: 'success' })
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
    
    switch(taskId) {
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
  }
})