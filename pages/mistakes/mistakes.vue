<template>
  <view class="container">
    <view class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-item" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">全部</view>
        <view v-for="item in mistakeTypes" :key="item.code"
          class="filter-item" :class="{ active: currentFilter === item.code }"
          @click="setFilter(item.code)">{{item.name}}</view>
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
          <text class="type-tag" v-for="(type, idx) in item.mistakeTypes" :key="idx">{{type}}</text>
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
      mistakeTypes: [
        { code: 'chase_high', name: '追高' },
        { code: 'panic_sell', name: '割肉' },
        { code: 'no_stop_loss', name: '不止损' },
        { code: 'heavy_position', name: '重仓' }
      ],
      mistakes: []
    }
  },
  onLoad() {
    this.loadMistakes()
  },
  onShow() {
    this.loadMistakes()
  },
  methods: {
    async loadMistakes() {
      uni.showLoading({ title: '加载中...' })
      const res = await getMistakes()
      uni.hideLoading()
      
      if (res.success) {
        // 字段映射适配
        this.mistakes = res.data.map(item => ({
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
      } else {
        uni.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    },
    setFilter(filter) {
      this.currentFilter = filter
    },
    goToDetail(id) {
      uni.navigateTo({ url: `/pages/mistakes/detail?id=${id}` })
    }
  }
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; }
.filter-bar { background: #fff; padding: 20rpx 0; position: sticky; top: 0; z-index: 10; border-bottom: 1rpx solid #eee; }
.filter-scroll { white-space: nowrap; padding: 0 20rpx; }
.filter-item { display: inline-block; padding: 16rpx 32rpx; margin-right: 16rpx; background: #f5f5f5; border-radius: 30rpx; font-size: 26rpx; color: #666; }
.filter-item.active { background: #e94560; color: #fff; }
.mistake-list { padding: 20rpx; }
.mistake-card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.stock-info { display: flex; align-items: center; gap: 16rpx; }
.stock-name { font-size: 32rpx; font-weight: bold; color: #333; }
.stock-code { font-size: 24rpx; color: #999; }
.trade-date { font-size: 24rpx; color: #999; }
.trade-info { display: flex; align-items: center; gap: 20rpx; margin-bottom: 20rpx; }
.action { font-size: 26rpx; padding: 8rpx 20rpx; border-radius: 8rpx; }
.action.buy { background: #ffe5e5; color: #e94560; }
.action.sell { background: #e5f5e5; color: #52c41a; }
.price { font-size: 28rpx; color: #666; }
.mistake-types { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 20rpx; }
.type-tag { background: #ffe5e5; color: #e94560; font-size: 22rpx; padding: 8rpx 16rpx; border-radius: 8rpx; }
.reflection { font-size: 26rpx; color: #666; line-height: 1.5; }
</style>
