<template>
  <view class="container">
    <!-- 筛选标签 -->
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: typeFilter === '' }" @click="filterByType('')">全部</view>
      <view class="filter-item" :class="{ active: typeFilter === 'checkin' }" @click="filterByType('checkin')">签到</view>
      <view class="filter-item" :class="{ active: typeFilter === 'mistake' }" @click="filterByType('mistake')">录入</view>
      <view class="filter-item" :class="{ active: typeFilter === 'bonus' }" @click="filterByType('bonus')">奖励</view>
    </view>

    <!-- 记录列表 -->
    <view class="record-list" v-if="records.length > 0">
      <view class="record-item" v-for="(item, index) in records" :key="index">
        <view class="record-left">
          <view class="record-icon" :class="item.type">
            <text v-if="item.type === 'mistake'">📝</text>
            <text v-else-if="item.type === 'ad'">🎬</text>
            <text v-else-if="item.type === 'checkin'">📅</text>
            <text v-else>🎁</text>
          </view>
          <view class="record-info">
            <text class="record-desc">{{item.desc}}</text>
            <text class="record-time">{{item.time}}</text>
          </view>
        </view>
        <text class="record-points">+{{item.points}}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-more" v-if="loading">加载中...</view>
    <view class="no-more" v-if="!hasMore && records.length > 0">没有更多了</view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && records.length === 0">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无积分记录</text>
      <text class="empty-sub">完成任务即可获得积分</text>
    </view>
  </view>
</template>

<script>
import { getPointsRecords } from '@/utils/pointsApi.js'

export default {
  data() {
    return {
      records: [],
      loading: false,
      hasMore: true,
      page: 1,
      pageSize: 20,
      total: 0,
      typeFilter: ''
    }
  },
  onLoad() {
    this.loadRecords()
  },
  onShow() {
    this.page = 1
    this.records = []
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
        const res = await getPointsRecords({
          page: this.page,
          pageSize: this.pageSize,
          type: this.typeFilter || undefined
        })

        if (res.code === 0) {
          const data = res.data
          const newRecords = this.page === 1 ? data.list : [...this.records, ...data.list]
          this.records = newRecords
          this.total = data.total
          this.hasMore = data.hasMore
          this.page++
        } else {
          uni.showToast({ title: res.message || '加载失败', icon: 'none' })
        }
      } catch (err) {
        console.error('加载积分记录失败:', err)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    filterByType(type) {
      this.typeFilter = type
      this.page = 1
      this.records = []
      this.hasMore = true
      this.loadRecords()
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

/* 筛选标签 */
.filter-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 30rpx;
  overflow-x: auto;
}

.filter-item {
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background: #fff;
  white-space: nowrap;
}

.filter-item.active {
  background: #e94560;
  color: #fff;
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

.record-icon.mistake { background: #fef2f2; }
.record-icon.ad { background: #fef3c7; }
.record-icon.checkin { background: #d1fae5; }
.record-icon.bonus { background: #e0e7ff; }

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
}
</style>
