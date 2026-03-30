<template>
  <view class="container">
    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{stats.totalDonations || 0}}</text>
        <text class="stat-label">打赏次数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{stats.totalPoints || 0}}</text>
        <text class="stat-label">累计积分</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{stats.stockCount || 0}}</text>
        <text class="stat-label">打赏股票</text>
      </view>
    </view>

    <!-- 打赏记录 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">打赏记录</text>
      </view>
      <view class="record-list" v-if="records.length > 0">
        <view class="record-item" v-for="(item, index) in records" :key="index">
          <view class="record-left">
            <view class="stock-avatar">
              <text class="avatar-text">{{item.stockName ? item.stockName.substring(0, 1) : '?'}}</text>
            </view>
            <view class="record-info">
              <text class="stock-name">{{item.stockName}}</text>
              <text class="stock-code">{{item.stockCode}}</text>
              <text class="record-message" v-if="item.message">{{item.message}}</text>
            </view>
          </view>
          <view class="record-right">
            <text class="record-points">-{{item.points}}</text>
            <text class="record-time">{{item.time}}</text>
          </view>
        </view>
      </view>

      <view class="loading-more" v-if="loading">加载中...</view>
      <view class="no-more" v-if="!hasMore && records.length > 0">没有更多了</view>

      <view class="empty-state" v-if="!loading && records.length === 0">
        <text class="empty-icon">💝</text>
        <text class="empty-text">暂无打赏记录</text>
        <text class="empty-sub">去打赏你喜欢的股票吧</text>
        <button class="donate-btn" @click="goToDonate">去打赏</button>
      </view>
    </view>
  </view>
</template>

<script>
import { getUserDonations } from '@/utils/donationApi.js'

export default {
  data() {
    return {
      stats: {},
      records: [],
      loading: false,
      hasMore: true,
      page: 1,
      pageSize: 20
    }
  },
  onLoad() {
    this.loadRecords()
  },
  onShow() {
    this.page = 1
    this.records = []
    this.hasMore = true
    this.loadRecords()
  },
  onReachBottom() {
    this.loadRecords()
  },
  onPullDownRefresh() {
    this.page = 1
    this.records = []
    this.hasMore = true
    this.loadRecords().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async loadRecords() {
      if (this.loading || !this.hasMore) return
      this.loading = true

      try {
        const res = await getUserDonations({
          page: this.page,
          pageSize: this.pageSize
        })

        if (res.code === 0) {
          const data = res.data
          const rawStats = data.stats || {}
          this.stats = {
            totalDonations: rawStats.donationCount || rawStats.totalDonations || 0,
            totalPoints: rawStats.totalDonated || rawStats.totalPoints || 0,
            stockCount: rawStats.stockCount || 0
          }
          const newRecords = this.page === 1 ? data.list : [...this.records, ...data.list]
          this.records = newRecords
          this.hasMore = data.hasMore
          this.page++
        }
      } catch (err) {
        console.error('加载打赏记录失败:', err)
      } finally {
        this.loading = false
      }
    },

    goToDonate() {
      uni.navigateTo({ url: '/pages/stockDonation/donate/donate' })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: #fff;
  margin-bottom: 30rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255,255,255,0.3);
}

/* 分区 */
.section {
  margin-bottom: 30rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

/* 记录列表 */
.record-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.stock-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.avatar-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.record-info {
  flex: 1;
}

.stock-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
}

.stock-code {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.record-message {
  font-size: 24rpx;
  color: #666;
  background: #f5f5f5;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  margin-top: 8rpx;
  display: inline-block;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-right {
  text-align: right;
}

.record-points {
  font-size: 32rpx;
  color: #e94560;
  font-weight: 600;
  display: block;
}

.record-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 加载状态 */
.loading-more, .no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.empty-sub {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.donate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 28rpx 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  border: none;
}
</style>
