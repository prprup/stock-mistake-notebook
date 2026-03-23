<template>
  <view class="container">
    <view class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-item" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">全部</view>
        <view class="filter-item" :class="{ active: currentFilter === '7days' }" @click="setFilter('7days')">最近7天</view>
        <view class="filter-item" :class="{ active: currentFilter === '30days' }" @click="setFilter('30days')">最近30天</view>
        <view class="filter-item" :class="{ active: currentFilter === 'thisMonth' }" @click="setFilter('thisMonth')">本月</view>
        <view class="filter-item" :class="{ active: currentFilter === 'lastMonth' }" @click="setFilter('lastMonth')">上月</view>
      </scroll-view>
    </view>

    <view class="mistake-list">
      <view class="mistake-card" v-for="item in mistakes" :key="item._id" @click="goToDetail(item._id)">
        <view class="card-header">
          <view class="stock-info">
            <text class="stock-name">{{item.stockName}}</text>
            <text class="stock-code">{{item.stockCode}}</text>
          </view>
          <text class="trade-date">{{item.tradeDate}}</text>
        </view>

        <view class="trade-info">
          <text class="action" :class="item.action">{{item.action === 'buy' ? '买入' : '卖出'}}</text>
          <text class="price">￥{{item.price}} × {{item.quantity}}股</text>
        </view>

        <view class="mistake-types">
          <text class="type-tag" v-for="(type, idx) in item.mistakeTypes" :key="type">{{type}}</text>
        </view>

        <view class="reflection" v-if="item.reflection">{{item.reflection}}</view>
      </view>
    </view>
  </view>
</template>

<script>
import { getMistakes } from '@/utils/mistakeApi.js'

export default {
  data() {
    return {
      currentFilter: 'all',
      mistakes: [],
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false
    }
  },
  onLoad() {
    this.loadMistakes()
  },
  onShow() {
    this.page = 1
    this.hasMore = true
    this.loadMistakes()
  },
  onPullDownRefresh() {
    this.page = 1
    this.hasMore = true
    this.loadMistakes().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.loadMistakes()
    }
  },
  methods: {
    async loadMistakes(params = {}) {
      if (this.loading) return
      this.loading = true

      const isFirstPage = this.page === 1
      if (isFirstPage) {
        this.mistakes = []
      }

      uni.showLoading({ title: '加载中...' })
      const res = await getMistakes({ ...params, page: this.page, pageSize: this.pageSize })
      uni.hideLoading()

      if (res.success) {
        const list = res.data.list || res.data || []
        const newItems = list.map(item => ({
          _id: item._id,
          stockName: item.stockName,
          stockCode: item.stockCode,
          tradeDate: item.date || item.createTime,
          action: item.action || 'buy',
          price: item.price || 0,
          quantity: item.quantity || 0,
          mistakeTypes: item.mistakeTypes || [],
          reflection: item.reflection || ''
        }))

        if (isFirstPage) {
          this.mistakes = newItems
        } else {
          this.mistakes = [...this.mistakes, ...newItems]
        }

        this.hasMore = newItems.length >= this.pageSize
        if (newItems.length > 0) {
          this.page++
        }
      } else {
        uni.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
      this.loading = false
    },
    setFilter(filter) {
      this.currentFilter = filter
      this.page = 1
      this.hasMore = true
      const params = this.getDateParams(filter)
      this.loadMistakes(params)
    },
    getDateParams(filter) {
      const now = new Date()
      const format = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      }
      
      switch (filter) {
        case '7days':
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          return { startDate: format(sevenDaysAgo), endDate: format(now) }
        case '30days':
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return { startDate: format(thirtyDaysAgo), endDate: format(now) }
        case 'thisMonth':
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          return { startDate: format(thisMonthStart), endDate: format(now) }
        case 'lastMonth':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
          return { startDate: format(lastMonthStart), endDate: format(lastMonthEnd) }
        default:
          return {}
      }
    },
    goToDetail(id) {
      uni.navigateTo({ url: `/pages/mistakes/detail?id=${id}` })
    }
  }
}
</script>

<style scoped>
.container { background: #F5F7FA; min-height: 100vh; }
.filter-bar { 
  background: #FFFFFF; 
  padding: 24rpx 0; 
  position: sticky; 
  top: 0; 
  z-index: 10; 
  box-shadow: 0 2rpx 12rpx rgba(30, 58, 138, 0.04);
}
.filter-scroll { white-space: nowrap; padding: 0 24rpx; }
.filter-item { 
  display: inline-block; 
  padding: 16rpx 32rpx; 
  margin-right: 16rpx; 
  background: #F3F4F6; 
  border-radius: 30rpx; 
  font-size: 26rpx; 
  color: #6B7280; 
  transition: all 0.2s;
}
.filter-item.active { 
  background: #1E3A8A; 
  color: #fff; 
  font-weight: 500;
}
.mistake-list { padding: 24rpx; }
.mistake-card { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 32rpx; 
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.stock-info { display: flex; align-items: center; gap: 16rpx; }
.stock-name { font-size: 32rpx; font-weight: bold; color: #111827; }
.stock-code { font-size: 24rpx; color: #9CA3AF; }
.trade-date { font-size: 24rpx; color: #9CA3AF; }
.trade-info { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; }
.action { font-size: 26rpx; padding: 10rpx 24rpx; border-radius: 8rpx; font-weight: 500; }
.action.buy { background: #EFF6FF; color: #1E3A8A; }
.action.sell { background: #F3F4F6; color: #6B7280; }
.price { font-size: 28rpx; color: #6B7280; }
.mistake-types { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 20rpx; }
.type-tag { 
  background: #EFF6FF; 
  color: #1E3A8A; 
  font-size: 22rpx; 
  padding: 8rpx 16rpx; 
  border-radius: 8rpx;
  font-weight: 500;
}
.reflection { font-size: 26rpx; color: #6B7280; line-height: 1.5; }
</style>
