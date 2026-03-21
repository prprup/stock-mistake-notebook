<template>
  <view class="container">
    <!-- 周期筛选 -->
    <view class="period-bar">
      <view class="period-item" :class="{ active: period === 'all' }" @click="changePeriod('all')">总榜</view>
      <view class="period-item" :class="{ active: period === 'week' }" @click="changePeriod('week')">本周</view>
      <view class="period-item" :class="{ active: period === 'month' }" @click="changePeriod('month')">本月</view>
    </view>

    <!-- 排行列表 -->
    <view class="rank-list" v-if="rankList.length > 0">
      <view class="rank-item" v-for="(item, index) in rankList" :key="index">
        <view class="rank-medal" v-if="index < 3">
          <text class="medal-icon">{{['🥇','🥈','🥉'][index]}}</text>
        </view>
        <view class="rank-num" v-else>
          <text>{{index + 1}}</text>
        </view>
        <view class="rank-info">
          <text class="rank-name">{{item.stockName}}</text>
          <text class="rank-code">{{item.stockCode}}</text>
        </view>
        <view class="rank-right">
          <text class="rank-points">{{item.totalPoints}}</text>
          <text class="rank-count">{{item.donateCount}}次打赏</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-more" v-if="loading">加载中...</view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && rankList.length === 0">
      <text class="empty-icon">🏆</text>
      <text class="empty-text">暂无排行数据</text>
      <text class="empty-sub">成为第一个打赏的人吧</text>
    </view>
  </view>
</template>

<script>
import { getStockRanking } from '@/utils/donationApi.js'

export default {
  data() {
    return {
      rankList: [],
      loading: false,
      period: 'all'
    }
  },
  onLoad() {
    this.loadRanking()
  },
  onShow() {
    this.loadRanking()
  },
  onPullDownRefresh() {
    this.loadRanking().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async loadRanking() {
      this.loading = true
      try {
        const res = await getStockRanking({ period: this.period })
        if (res.code === 0) {
          this.rankList = res.data.list || []
        }
      } catch (err) {
        console.error('加载排行榜失败:', err)
      } finally {
        this.loading = false
      }
    },

    changePeriod(period) {
      this.period = period
      this.loadRanking()
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

/* 周期筛选 */
.period-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 30rpx;
}

.period-item {
  padding: 12rpx 32rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background: #fff;
}

.period-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

/* 排行列表 */
.rank-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-medal {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.medal-icon {
  font-size: 40rpx;
}

.rank-num {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
  font-weight: bold;
  margin-right: 20rpx;
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
}

.rank-code {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.rank-right {
  text-align: right;
}

.rank-points {
  font-size: 32rpx;
  color: #667eea;
  font-weight: bold;
  display: block;
}

.rank-count {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 加载状态 */
.loading-more {
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
}
</style>
