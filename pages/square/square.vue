<template>
  <view class="container">
    <!-- 筛选标签 -->
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: currentFilter === 'all' }" @click="changeFilter('all')">全部</view>
      <view class="filter-item" v-for="type in mistakeTypes" :key="type.code"
        :class="{ active: currentFilter === type.code }" @click="changeFilter(type.code)">
        {{type.name}}
      </view>
    </view>

    <!-- 热门错题 -->
    <view class="hot-card" v-if="hotMistake">
      <view class="hot-header">
        <text class="hot-tag">🔥 本周热错</text>
      </view>
      <view class="hot-content" @click="viewDetail(hotMistake)">
        <text class="hot-type">{{hotMistake.mistakeType}}</text>
        <text class="hot-reflection">{{hotMistake.reflection}}</text>
        <text class="hot-count">{{hotMistake.count}}人踩过</text>
      </view>
    </view>

    <!-- 错题列表 -->
    <view class="mistake-list" v-if="mistakes.length > 0">
      <view class="mistake-card" v-for="(item, index) in mistakes" :key="index" @click="viewDetail(item)">
        <view class="mistake-header">
          <view class="stock-info">
            <text class="stock-name">{{item.stockName}}</text>
            <text class="stock-code">{{item.stockCode}}</text>
          </view>
          <text class="mistake-date">{{item.date}}</text>
        </view>
        <view class="mistake-types">
          <text class="type-tag" v-for="(type, i) in item.mistakeTypes" :key="i">{{type}}</text>
        </view>
        <text class="mistake-reflection">{{item.reflection}}</text>
        <view class="mistake-footer">
          <view class="emotion">
            <text class="emotion-icon">{{getEmotionIcon(item.emotion)}}</text>
            <text class="emotion-text">{{item.emotion}}</text>
          </view>
          <view class="likes">
            <text>👍 {{item.likes || 0}}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-more" v-if="loading">加载中...</view>
    <view class="no-more" v-if="!hasMore && mistakes.length > 0">没有更多了</view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && mistakes.length === 0">
      <text class="empty-icon">🌍</text>
      <text class="empty-text">广场空空如也</text>
      <text class="empty-sub">分享你的错题，帮助更多人避坑</text>
    </view>
  </view>
</template>

<script>
import { getSquarePosts } from '@/utils/squareApi.js'

export default {
  data() {
    return {
      currentFilter: 'all',
      mistakeTypes: [
        { code: 'chase_high', name: '追高' },
        { code: 'panic_sell', name: '割肉' },
        { code: 'no_stop_loss', name: '不止损' },
        { code: 'heavy_position', name: '重仓' },
        { code: 'frequent_trade', name: '频繁交易' },
        { code: 'revenge_trade', name: '报复交易' }
      ],
      hotMistake: null,
      mistakes: [],
      hasMore: true,
      page: 1,
      pageSize: 20,
      loading: false
    }
  },
  onLoad() {
    this.loadMistakes()
  },
  onShow() {
    this.refreshData()
  },
  onReachBottom() {
    this.loadMistakes()
  },
  onPullDownRefresh() {
    this.refreshData().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    refreshData() {
      this.page = 1
      this.mistakes = []
      this.hasMore = true
      return this.loadMistakes()
    },

    async loadMistakes() {
      if (this.loading || !this.hasMore) return
      this.loading = true

      try {
        const res = await getSquarePosts({
          page: this.page,
          pageSize: this.pageSize,
          filter: this.currentFilter
        })

        if (res.code === 0) {
          const data = res.data
          if (this.page === 1 && data.hotMistake) {
            this.hotMistake = data.hotMistake
          }
          const newMistakes = this.page === 1 ? data.list : [...this.mistakes, ...data.list]
          this.mistakes = newMistakes
          this.hasMore = data.hasMore
          this.page++
        }
      } catch (err) {
        console.error('加载广场数据失败:', err)
      } finally {
        this.loading = false
      }
    },

    changeFilter(filter) {
      this.currentFilter = filter
      this.refreshData()
    },

    getEmotionIcon(emotion) {
      const icons = {
        '恐慌': '😰', '贪婪': '🤑', '犹豫': '🤔', '冲动': '😤',
        '后悔': '😞', '焦虑': '😟', '平静': '😐'
      }
      return icons[emotion] || '😐'
    },

    viewDetail(item) {
      uni.navigateTo({
        url: `/pages/mistakes/detail?id=${item._id || item.id}`
      })
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
  white-space: nowrap;
}

.filter-item {
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background: #fff;
}

.filter-item.active {
  background: #e94560;
  color: #fff;
}

/* 热门错题 */
.hot-card {
  background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  color: #fff;
}

.hot-header {
  margin-bottom: 16rpx;
}

.hot-tag {
  font-size: 28rpx;
  font-weight: bold;
}

.hot-content {
  display: flex;
  flex-direction: column;
}

.hot-type {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.hot-reflection {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 12rpx;
  line-height: 1.5;
}

.hot-count {
  font-size: 24rpx;
  opacity: 0.8;
}

/* 错题列表 */
.mistake-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.mistake-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}

.mistake-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.stock-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.stock-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.stock-code {
  font-size: 24rpx;
  color: #999;
}

.mistake-date {
  font-size: 24rpx;
  color: #999;
}

.mistake-types {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.type-tag {
  background: #fef2f2;
  color: #e94560;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.mistake-reflection {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.mistake-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.emotion {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.emotion-icon {
  font-size: 28rpx;
}

.emotion-text {
  font-size: 24rpx;
  color: #999;
}

.likes {
  font-size: 24rpx;
  color: #999;
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
