<template>
  <view class="container">
    <!-- 积分卡片 -->
    <view class="points-card">
      <view class="points-header">
        <text class="points-label">我的积分</text>
        <view class="points-detail" @click="goToRecords">
          <text>明细</text>
          <text class="arrow">></text>
        </view>
      </view>
      <view class="points-value">{{ points }}</view>
      <view class="points-total">累计获得 {{ totalPoints }} 积分</view>

      <!-- 签到区域 -->
      <view class="checkin-section">
        <view class="checkin-info">
          <text class="streak">连续签到 {{ checkInStreak }} 天</text>
          <text class="streak-tip" v-if="checkInStreak > 0">再坚持 {{ 7 - checkInStreak % 7 }} 天获额外奖励</text>
        </view>
        <button class="checkin-btn" :class="{ checked: hasCheckedIn }" @click="checkIn">
          {{ hasCheckedIn ? '已签到' : '签到' }}
        </button>
      </view>

      <view class="checkin-days">
        <view class="day-item" v-for="day in 7" :key="day">
          <view class="day-circle" :class="{ active: checkInStreak >= day }">
            <text class="day-num">{{ day }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">赚积分</text>
      </view>
      <view class="task-list">
        <view class="task-item" v-for="task in tasks" :key="task.id" @click="doTask(task.id)">
          <view class="task-icon">{{ task.icon }}</view>
          <view class="task-info">
            <text class="task-name">{{ task.name }}</text>
            <text class="task-desc">{{ task.desc }}</text>
          </view>
          <view class="task-right">
            <text class="task-points">+{{ task.points }}</text>
            <text class="task-hint" v-if="task.id === 'ad'">今日最多{{ adConfig.dailyLimit }}次</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section" v-if="pointsRecords.length > 0">
      <view class="section-header">
        <text class="section-title">最近记录</text>
        <text class="more" @click="goToRecords">查看全部 ></text>
      </view>
      <view class="record-list">
        <view class="record-item" v-for="(item, index) in pointsRecords" :key="index">
          <view class="record-left">
            <view class="record-icon" :class="item.type">
              <text v-if="item.type === 'mistake'">📝</text>
              <text v-else-if="item.type === 'ad'">🎬</text>
              <text v-else-if="item.type === 'checkin'">📅</text>
              <text v-else>🎁</text>
            </view>
            <view class="record-info">
              <text class="record-desc">{{ item.desc }}</text>
              <text class="record-time">{{ item.time }}</text>
            </view>
          </view>
          <text class="record-points">+{{ item.points }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  getPoints,
  checkIn as checkInApi,
  getPointsRecords,
  prepareAdRewardTicket,
  cancelAdRewardTicket,
  claimAdReward
} from '@/utils/pointsApi.js'
import {
  REWARDED_VIDEO_AD_UNIT_ID,
  AD_REWARD_POINTS,
  AD_DAILY_LIMIT,
  isValidRewardedVideoAdUnitId,
  getRewardedVideoAdUnavailableReason
} from '@/utils/adConfig.js'

export default {
  data() {
    return {
      points: 0,
      totalPoints: 0,
      checkInStreak: 0,
      hasCheckedIn: false,
      pointsRecords: [],
      tasks: [
        { id: 'mistake', name: '录入错题', desc: '每记录1条错题', points: 10, icon: '📝', status: 'ongoing' },
        { id: 'checkin', name: '每日签到', desc: '连续签到7天额外奖励', points: 5, icon: '📅', status: 'available' },
        { id: 'ad', name: '观看广告', desc: '完整观看激励视频可领取奖励', points: AD_REWARD_POINTS, icon: '🎬', status: 'available' }
      ],
      loading: false,
      adLoading: false,
      rewardedVideoAd: null,
      rewardedVideoAdReady: false,
      adCloseHandlerBound: false,
      adErrorHandlerBound: false,
      currentAdTraceId: '',
      currentAdTicketId: '',
      currentAdMinClaimAt: '',
      adConfig: {
        adUnitId: REWARDED_VIDEO_AD_UNIT_ID,
        dailyLimit: AD_DAILY_LIMIT
      }
    }
  },
  onLoad() {
    this.initRewardedVideoAd()
    this.loadPointsData()
  },
  onShow() {
    this.loadPointsData()
  },
  onUnload() {
    this.safeCancelPendingAdTicket('page_unload')
    this.destroyRewardedVideoAd()
  },
  onPullDownRefresh() {
    this.loadPointsData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async loadPointsData() {
      this.loading = true
      try {
        const [pointsRes, recordsRes] = await Promise.all([
          getPoints(),
          getPointsRecords({ page: 1, pageSize: 5 })
        ])

        if (pointsRes.code === 0) {
          const data = pointsRes.data
          let hasCheckedIn = false
          if (data.lastCheckIn) {
            const lastCheckIn = new Date(data.lastCheckIn)
            const utcOffset = 8 * 60
            const now = new Date()
            const beijingNow = new Date(now.getTime() + (utcOffset + now.getTimezoneOffset()) * 60000)
            const beijingLast = new Date(lastCheckIn.getTime() + (utcOffset + lastCheckIn.getTimezoneOffset()) * 60000)
            hasCheckedIn = beijingLast.toDateString() === beijingNow.toDateString()
          }
          this.points = data.points || 0
          this.totalPoints = data.totalPoints || 0
          this.checkInStreak = data.checkInStreak || 0
          this.hasCheckedIn = hasCheckedIn
        }

        if (recordsRes.code === 0) {
          this.pointsRecords = recordsRes.data.list || []
        }
      } catch (err) {
        console.error('加载积分数据失败:', err)
      } finally {
        this.loading = false
      }
    },

    initRewardedVideoAd() {
      // #ifdef MP-WEIXIN
      if (!wx.createRewardedVideoAd) {
        console.warn('当前基础库不支持激励视频广告')
        return
      }

      const invalidReason = getRewardedVideoAdUnavailableReason()
      if (invalidReason) {
        console.warn(invalidReason)
        return
      }

      if (this.rewardedVideoAd) return

      this.rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: this.adConfig.adUnitId
      })

      if (!this.adErrorHandlerBound) {
        this.rewardedVideoAd.onError((err) => {
          console.error('激励视频广告错误:', err)
          this.adLoading = false
          this.rewardedVideoAdReady = false
          uni.hideLoading()
          this.safeCancelPendingAdTicket('ad_error')
          uni.showToast({ title: this.getAdErrorMessage(err), icon: 'none' })
        })
        this.adErrorHandlerBound = true
      }

      if (!this.adCloseHandlerBound) {
        this.rewardedVideoAd.onClose(async (res) => {
          this.adLoading = false
          uni.hideLoading()

          if (res && (res.isEnded || res === undefined)) {
            await this.handleAdRewardClaim()
          } else {
            await this.safeCancelPendingAdTicket('close_unfinished')
            uni.showToast({ title: '完整观看后才可领取奖励', icon: 'none' })
          }
        })
        this.adCloseHandlerBound = true
      }

      this.rewardedVideoAd.load()
        .then(() => {
          this.rewardedVideoAdReady = true
        })
        .catch((err) => {
          console.error('广告预加载失败:', err)
          this.rewardedVideoAdReady = false
        })
      // #endif
    },

    destroyRewardedVideoAd() {
      // #ifdef MP-WEIXIN
      if (this.rewardedVideoAd && this.rewardedVideoAd.destroy) {
        this.rewardedVideoAd.destroy()
      }
      this.rewardedVideoAd = null
      this.rewardedVideoAdReady = false
      this.adCloseHandlerBound = false
      this.adErrorHandlerBound = false
      // #endif
    },

    async checkIn() {
      if (this.hasCheckedIn) {
        uni.showToast({ title: '今日已签到', icon: 'none' })
        return
      }

      uni.showLoading({ title: '签到中...' })
      try {
        const res = await checkInApi()
        uni.hideLoading()

        if (res.code === 0) {
          this.points = res.data.points
          this.totalPoints = res.data.totalPoints
          this.checkInStreak = res.data.checkInStreak
          this.hasCheckedIn = true
          uni.showToast({ title: res.message || '签到成功', icon: 'success' })
          this.loadPointsData()
        } else {
          uni.showToast({ title: res.message || '签到失败', icon: 'none' })
        }
      } catch (err) {
        uni.hideLoading()
        console.error('签到失败:', err)
        uni.showToast({ title: '签到失败', icon: 'none' })
      }
    },

    async watchAd() {
      // #ifdef MP-WEIXIN
      if (this.adLoading) return

      if (!isValidRewardedVideoAdUnitId(this.adConfig.adUnitId)) {
        uni.showToast({ title: getRewardedVideoAdUnavailableReason(), icon: 'none' })
        return
      }

      this.initRewardedVideoAd()
      if (!this.rewardedVideoAd) {
        uni.showToast({ title: '广告组件初始化失败', icon: 'none' })
        return
      }

      const ticketRes = await prepareAdRewardTicket({
        adUnitId: this.adConfig.adUnitId,
        adSource: 'rewarded-video',
        scene: 'points-page'
      })

      if (ticketRes.code !== 0 || !ticketRes.data || !ticketRes.data.ticketId || !ticketRes.data.traceId) {
        uni.showToast({ title: ticketRes.message || '广告任务创建失败', icon: 'none' })
        return
      }

      this.currentAdTicketId = ticketRes.data.ticketId
      this.currentAdTraceId = ticketRes.data.traceId
      this.currentAdMinClaimAt = ticketRes.data.minClaimAt || ''
      this.adLoading = true
      uni.showLoading({ title: '广告加载中...' })

      try {
        await this.rewardedVideoAd.show()
      } catch (showErr) {
        try {
          await this.rewardedVideoAd.load()
          this.rewardedVideoAdReady = true
          await this.rewardedVideoAd.show()
        } catch (err) {
          console.error('激励视频广告展示失败:', err)
          this.adLoading = false
          uni.hideLoading()
          await this.safeCancelPendingAdTicket('show_failed')
          uni.showToast({ title: this.getAdErrorMessage(err), icon: 'none' })
        }
      }
      // #endif

      // #ifndef MP-WEIXIN
      uni.showToast({ title: '仅微信小程序支持', icon: 'none' })
      // #endif
    },

    async handleAdRewardClaim() {
      if (!this.currentAdTraceId || !this.currentAdTicketId) {
        uni.showToast({ title: '广告票据缺失，请重试', icon: 'none' })
        return
      }

      if (this.currentAdMinClaimAt) {
        const minClaimAtMs = new Date(this.currentAdMinClaimAt).getTime()
        if (minClaimAtMs && Date.now() < minClaimAtMs) {
          await this.safeCancelPendingAdTicket('claim_too_early')
          uni.showToast({ title: '观看时长不足，暂不能领取奖励', icon: 'none' })
          return
        }
      }

      uni.showLoading({ title: '发放奖励中...' })
      try {
        const res = await claimAdReward({
          adUnitId: this.adConfig.adUnitId,
          adSource: 'rewarded-video',
          traceId: this.currentAdTraceId,
          ticketId: this.currentAdTicketId,
          scene: 'points-page'
        })

        uni.hideLoading()

        if (res.code === 0) {
          this.points = res.data.points || this.points
          this.totalPoints = res.data.totalPoints || this.totalPoints
          await this.loadPointsData()
          uni.showToast({ title: res.message || '奖励已发放', icon: 'success' })
          this.clearCurrentAdTicketState()
        } else {
          uni.showToast({ title: res.message || '奖励发放失败', icon: 'none' })
          await this.safeCancelPendingAdTicket('claim_failed')
        }
      } catch (err) {
        uni.hideLoading()
        console.error('广告奖励发放失败:', err)
        uni.showToast({ title: '奖励发放失败', icon: 'none' })
        await this.safeCancelPendingAdTicket('claim_exception')
      } finally {
        this.rewardedVideoAdReady = false
      }
    },

    async safeCancelPendingAdTicket(reason = 'cancel') {
      const ticketId = this.currentAdTicketId
      const traceId = this.currentAdTraceId
      if (!ticketId || !traceId) {
        this.clearCurrentAdTicketState()
        return
      }

      try {
        await cancelAdRewardTicket({ ticketId, traceId, reason })
      } catch (err) {
        console.error('取消广告票据失败:', err)
      } finally {
        this.clearCurrentAdTicketState()
      }
    },

    clearCurrentAdTicketState() {
      this.currentAdTraceId = ''
      this.currentAdTicketId = ''
      this.currentAdMinClaimAt = ''
    },

    getAdErrorMessage(err) {
      const code = Number(err && err.errCode)
      const codeMap = {
        1000: '后端接口调用失败',
        1001: '参数错误',
        1002: '广告单元无效',
        1003: '内部错误',
        1004: '无合适的广告',
        1005: '广告组件审核中',
        1006: '广告组件被驳回',
        1007: '广告组件已关闭',
        1008: '广告单元已关闭',
        2001: '广告加载中，请稍后再试',
        2002: '广告数据拉取失败'
      }
      return codeMap[code] || '广告暂时不可用，请稍后再试'
    },

    goToRecords() {
      uni.navigateTo({ url: '/pages/points/records/records' })
    },

    doTask(taskId) {
      switch (taskId) {
        case 'mistake':
          uni.switchTab({ url: '/pages/record/record' })
          break
        case 'ad':
          this.watchAd()
          break
        case 'checkin':
          this.checkIn()
          break
      }
    },

  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.points-card {
  background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  color: #fff;
  margin-bottom: 30rpx;
}

.points-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.points-label {
  font-size: 28rpx;
  opacity: 0.9;
}

.points-detail {
  font-size: 24rpx;
  opacity: 0.8;
  display: flex;
  align-items: center;
}

.arrow {
  margin-left: 4rpx;
}

.points-value {
  font-size: 80rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.points-total {
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 30rpx;
}

.checkin-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.checkin-info {
  display: flex;
  flex-direction: column;
}

.streak {
  font-size: 28rpx;
  font-weight: 500;
}

.streak-tip {
  font-size: 22rpx;
  opacity: 0.8;
  margin-top: 4rpx;
}

.checkin-btn {
  background: #fff;
  color: #e94560;
  font-size: 26rpx;
  padding: 16rpx 40rpx;
  border-radius: 30rpx;
  border: none;
  font-weight: 500;
  line-height: 1.5;
}

.checkin-btn.checked {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.checkin-days {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
}

.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.day-circle {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}

.day-circle.active {
  background: #fff;
}

.day-num {
  font-size: 24rpx;
  color: #e94560;
  font-weight: 600;
}

.section {
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more {
  font-size: 24rpx;
  color: #999;
}

.task-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.task-item:last-child {
  border-bottom: none;
}

.task-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.task-info {
  flex: 1;
}

.task-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 6rpx;
}

.task-desc {
  font-size: 24rpx;
  color: #999;
}

.task-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
  margin-left: 20rpx;
}

.task-points {
  font-size: 32rpx;
  color: #e94560;
  font-weight: 600;
}

.task-hint {
  font-size: 22rpx;
  color: #999;
}

.record-list {
  display: flex;
  flex-direction: column;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  align-items: center;
}

.record-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-right: 20rpx;
}

.record-icon.mistake {
  background: #fef2f2;
}

.record-icon.ad {
  background: #fef3c7;
}

.record-icon.checkin {
  background: #d1fae5;
}

.record-icon.bonus {
  background: #e0e7ff;
}

.record-info {
  display: flex;
  flex-direction: column;
}

.record-desc {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 6rpx;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-points {
  font-size: 32rpx;
  color: #e94560;
  font-weight: 600;
}
</style>
