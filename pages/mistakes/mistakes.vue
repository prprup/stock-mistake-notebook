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
      mistakeTypes: [
        { code: '追高买入', name: '追高' },
        { code: '恐慌割肉', name: '割肉' },
        { code: '该止损没止损', name: '不止损' },
        { code: '该止盈没止盈', name: '不止盈' },
        { code: '单票过重', name: '重仓' },
        { code: '满仓梭哈', name: '满仓' },
        { code: '频繁交易', name: '频繁' },
        { code: '报复性交易', name: '报复' },
        { code: '听信消息', name: '听消息' },
        { code: '跟风买入', name: '跟风' }
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
    async loadMistakes(params = {}) {
      uni.showLoading({ title: '加载中...' })
      const res = await getMistakes(params)
      uni.hideLoading()

      if (res.success) {
        // 适配后端返回的分页数据结构
        const list = res.data.list || res.data || []
        // 字段映射适配
        this.mistakes = list.map(item => ({
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
    // setFilter方法调用loadMistakes并传入筛选参数
    setFilter(filter) {
      this.currentFilter = filter
      // 直接传中文名称，与数据库存储一致
      const params = filter !== 'all' ? { mistakeType: filter } : {}
      this.loadMistakes(params)
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
