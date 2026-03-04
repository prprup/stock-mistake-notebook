<template>
  <view class="container">
    <view class="date-filter">
      <picker mode="date" :value="filterDate" @change="onDateChange">
        <view class="date-picker">
          <text class="date-text">{{filterDate || '全部日期'}}</text>
          <text class="date-icon">▼</text>
        </view>
      </picker>
      <view class="filter-tabs">
        <view class="tab" :class="{ active: statusFilter === 'all' }" @click="setStatusFilter('all')">全部</view>
        <view class="tab" :class="{ active: statusFilter === 'pending' }" @click="setStatusFilter('pending')">待执行</view>
        <view class="tab" :class="{ active: statusFilter === 'executed' }" @click="setStatusFilter('executed')">已执行</view>
      </view>
    </view>
    <view class="plan-list" v-if="plans.length > 0">
      <view class="plan-card" v-for="item in plans" :key="item._id" @click="goToDetail(item._id)">
        <view class="card-header">
          <view class="date-badge">
            <text class="month">{{formatMonth(item.date)}}</text>
            <text class="day">{{formatDay(item.date)}}</text>
          </view>
          <view class="stock-info">
            <text class="stock-name">{{item.stockName}}</text>
            <text class="stock-code">{{item.stockCode}}</text>
          </view>
          <view class="status-tag" :class="item.status">{{statusText(item.status)}}</view>
        </view>
        <view class="plan-content">
          <view class="plan-row">
            <text class="label">操作</text>
            <text class="value action" :class="item.action">{{item.action === 'buy' ? '买入' : '卖出'}}</text>
          </view>
          <view class="plan-row">
            <text class="label">目标价</text>
            <text class="value">¥{{item.targetPrice}}</text>
          </view>
          <view class="plan-row" v-if="item.stopLoss">
            <text class="label">止损</text>
            <text class="value stop">¥{{item.stopLoss}}</text>
          </view>
          <view class="plan-row" v-if="item.takeProfit">
            <text class="label">止盈</text>
            <text class="value profit">¥{{item.takeProfit}}</text>
          </view>
          <view class="plan-row" v-if="item.position">
            <text class="label">仓位</text>
            <text class="value">{{item.position}}%</text>
          </view>
        </view>
        <view class="reason-box" v-if="item.reason">
          <text class="reason-label">理由</text>
          <text class="reason-text">{{item.reason}}</text>
        </view>
        <view class="card-footer" v-if="item.status === 'pending'">
          <view class="btn execute" @click.stop="executePlan(item)">执行</view>
          <view class="btn edit" @click.stop="editPlan(item._id)">编辑</view>
        </view>
      </view>
    </view>
    <view class="empty-state" v-else>
      <text class="empty-icon">📝</text>
      <text class="empty-text">还没有预案</text>
      <text class="empty-sub">提前规划，避免冲动交易</text>
      <view class="create-btn" @click="goToEdit">创建预案</view>
    </view>
    <view class="fab" @click="goToEdit" v-if="plans.length > 0">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script>
import { getPlans } from '@/utils/planApi.js'
export default {
  data() {
    return {
      filterDate: '',
      statusFilter: 'all',
      plans: []
    }
  },
  onLoad() {
    this.loadPlans()
  },
  onShow() {
    this.loadPlans()
  },
  methods: {
    async loadPlans() {
      uni.showLoading({ title: '加载中' })
      const result = await getPlans({
        date: this.filterDate,
        status: this.statusFilter === 'all' ? '' : this.statusFilter
      })
      uni.hideLoading()
      if (result.success) {
        this.plans = result.data || []
      } else {
        uni.showToast({ title: result.error || '加载失败', icon: 'none' })
      }
    },
    onDateChange(e) {
      this.filterDate = e.detail.value
      this.loadPlans()
    },
    setStatusFilter(status) {
      this.statusFilter = status
      this.loadPlans()
    },
    formatMonth(dateStr) {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月`
    },
    formatDay(dateStr) {
      const date = new Date(dateStr)
      return String(date.getDate()).padStart(2, '0')
    },
    statusText(status) {
      const map = { pending: '待执行', executed: '已执行', cancelled: '已取消' }
      return map[status] || status
    },
    goToDetail(id) {
      uni.navigateTo({ url: `/pages/plan/detail?id=${id}` })
    },
    goToEdit() {
      uni.navigateTo({ url: '/pages/plan/edit' })
    },
    editPlan(id) {
      uni.navigateTo({ url: `/pages/plan/edit?id=${id}` })
    },
    executePlan(item) {
      uni.navigateTo({
        url: `/pages/record/manual?planId=${item._id}&stockName=${item.stockName}&stockCode=${item.stockCode}&action=${item.action}&planPrice=${item.targetPrice}`
      })
    }
  }
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }
.date-filter { background: #fff; padding: 20rpx 30rpx; display: flex; align-items: center; justify-content: space-between; border-bottom: 1rpx solid #eee; }
.date-picker { display: flex; align-items: center; gap: 10rpx; }
.date-text { font-size: 28rpx; color: #333; font-weight: 500; }
.date-icon { font-size: 20rpx; color: #999; }
.filter-tabs { display: flex; gap: 16rpx; }
.tab { padding: 12rpx 24rpx; background: #f5f5f5; border-radius: 30rpx; font-size: 24rpx; color: #666; }
.tab.active { background: #e94560; color: #fff; }
.plan-list { padding: 20rpx; }
.plan-card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-header { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; }
.date-badge { background: #1a1a2e; border-radius: 12rpx; padding: 16rpx 20rpx; display: flex; flex-direction: column; align-items: center; min-width: 80rpx; }
.month { font-size: 20rpx; color: #888; }
.day { font-size: 36rpx; font-weight: bold; color: #fff; }
.stock-info { flex: 1; }
.stock-name { font-size: 32rpx; font-weight: bold; color: #333; display: block; }
.stock-code { font-size: 24rpx; color: #999; margin-top: 6rpx; display: block; }
.status-tag { padding: 8rpx 20rpx; border-radius: 30rpx; font-size: 22rpx; }
.status-tag.pending { background: #fff3e5; color: #ff9500; }
.status-tag.executed { background: #e5f5e5; color: #52c41a; }
.status-tag.cancelled { background: #f5f5f5; color: #999; }
.plan-content { margin-bottom: 20rpx; }
.plan-row { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.plan-row:last-child { border-bottom: none; }
.label { font-size: 26rpx; color: #666; }
.value { font-size: 28rpx; color: #333; font-weight: 500; }
.value.action.buy { color: #e94560; }
.value.action.sell { color: #52c41a; }
.value.stop { color: #e94560; }
.value.profit { color: #52c41a; }
.reason-box { background: #f8f8f8; border-radius: 12rpx; padding: 20rpx; margin-bottom: 20rpx; }
.reason-label { font-size: 24rpx; color: #999; margin-bottom: 8rpx; display: block; }
.reason-text { font-size: 26rpx; color: #333; line-height: 1.5; }
.card-footer { display: flex; gap: 20rpx; }
.btn { flex: 1; height: 72rpx; border-radius: 36rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; }
.btn.execute { background: #e94560; color: #fff; }
.btn.edit { background: #f5f5f5; color: #666; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 200rpx 60rpx; }
.empty-icon { font-size: 120rpx; margin-bottom: 30rpx; }
.empty-text { font-size: 32rpx; color: #333; margin-bottom: 16rpx; }
.empty-sub { font-size: 26rpx; color: #999; margin-bottom: 40rpx; }
.create-btn { padding: 24rpx 60rpx; background: #e94560; color: #fff; border-radius: 40rpx; font-size: 28rpx; }
.fab { position: fixed; right: 40rpx; bottom: 60rpx; width: 100rpx; height: 100rpx; background: #e94560; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4rpx 20rpx rgba(233, 69, 96, 0.4); }
.fab-icon { font-size: 60rpx; color: #fff; font-weight: bold; }
</style>