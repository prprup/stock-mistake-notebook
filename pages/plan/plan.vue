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
    // formatMonth添加空值校验
    formatMonth(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
      return `${date.getMonth() + 1}月`
    },
    // formatDay添加空值校验
    formatDay(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
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
    // executePlan方法使用URLSearchParams编码参数
    executePlan(item) {
      const params = new URLSearchParams()
      params.append('planId', item._id)
      params.append('stockName', item.stockName)
      params.append('stockCode', item.stockCode)
      params.append('action', item.action)
      params.append('planPrice', item.targetPrice)
      
      uni.navigateTo({
        url: `/pages/record/manual?${params.toString()}`
      })
    }
  }
}
</script>

<style scoped>
.container { background: #F5F7FA; min-height: 100vh; padding-bottom: 40rpx; }
.date-filter { 
  background: #FFFFFF; 
  padding: 24rpx 30rpx; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  box-shadow: 0 2rpx 12rpx rgba(30, 58, 138, 0.04);
}
.date-picker { display: flex; align-items: center; gap: 10rpx; }
.date-text { font-size: 28rpx; color: #111827; font-weight: 500; }
.date-icon { font-size: 20rpx; color: #9CA3AF; }
.filter-tabs { display: flex; gap: 16rpx; }
.tab { 
  padding: 12rpx 24rpx; 
  background: #F3F4F6; 
  border-radius: 30rpx; 
  font-size: 24rpx; 
  color: #6B7280; 
  transition: all 0.2s;
}
.tab.active { 
  background: #1E3A8A; 
  color: #fff;
  font-weight: 500;
}
.plan-list { padding: 24rpx; }
.plan-card { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 32rpx; 
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.card-header { display: flex; align-items: center; gap: 20rpx; margin-bottom: 28rpx; }
.date-badge { 
  background: #F5F7FA; 
  border-radius: 12rpx; 
  padding: 16rpx 20rpx; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  min-width: 80rpx; 
  border: 1rpx solid #E5E7EB; 
}
.month { font-size: 20rpx; color: #6B7280; }
.day { 
  font-size: 36rpx; 
  font-weight: bold; 
  color: #1E3A8A;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.stock-info { flex: 1; }
.stock-name { font-size: 32rpx; font-weight: bold; color: #111827; display: block; }
.stock-code { font-size: 24rpx; color: #9CA3AF; margin-top: 6rpx; display: block; }
.status-tag { padding: 8rpx 20rpx; border-radius: 30rpx; font-size: 22rpx; font-weight: 500; }
.status-tag.pending { background: #FEF3C7; color: #D97706; }
.status-tag.executed { background: #D1FAE5; color: #059669; }
.status-tag.cancelled { background: #F3F4F6; color: #9CA3AF; }
.plan-content { margin-bottom: 24rpx; }
.plan-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 16rpx 0; 
  border-bottom: 1rpx solid #F3F4F6; 
}
.plan-row:last-child { border-bottom: none; }
.label { font-size: 26rpx; color: #6B7280; }
.value { 
  font-size: 28rpx; 
  color: #111827; 
  font-weight: 500;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.value.action.buy { color: #1E3A8A; }
.value.action.sell { color: #6B7280; }
.value.stop { color: #DC2626; }
.value.profit { color: #059669; }
.reason-box { 
  background: #F5F7FA; 
  border-radius: 12rpx; 
  padding: 24rpx; 
  margin-bottom: 24rpx; 
}
.reason-label { font-size: 24rpx; color: #9CA3AF; margin-bottom: 8rpx; display: block; }
.reason-text { font-size: 26rpx; color: #374151; line-height: 1.5; }
.card-footer { display: flex; gap: 20rpx; }
.btn { 
  flex: 1; 
  height: 76rpx; 
  border-radius: 38rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 28rpx;
  font-weight: 500;
}
.btn.execute { 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(30, 58, 138, 0.2);
}
.btn.edit { background: #F3F4F6; color: #374151; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 200rpx 60rpx; }
.empty-icon { font-size: 120rpx; margin-bottom: 30rpx; }
.empty-text { font-size: 32rpx; color: #111827; margin-bottom: 16rpx; }
.empty-sub { font-size: 26rpx; color: #9CA3AF; margin-bottom: 40rpx; }
.create-btn { 
  padding: 24rpx 60rpx; 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  color: #fff; 
  border-radius: 40rpx; 
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(30, 58, 138, 0.2);
}
.fab { 
  position: fixed; 
  right: 40rpx; 
  bottom: 60rpx; 
  width: 100rpx; 
  height: 100rpx; 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.3); 
}
.fab-icon { font-size: 60rpx; color: #fff; font-weight: bold; }
</style>
