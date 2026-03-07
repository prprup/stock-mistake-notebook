<template>
  <view class="container">
    <view class="plan-card" v-if="plan">
      <view class="card-header">
        <view class="date-badge">
          <text class="month">{{formatMonth(plan.date)}}</text>
          <text class="day">{{formatDay(plan.date)}}</text>
        </view>
        <view class="stock-info">
          <text class="stock-name">{{plan.stockName}}</text>
          <text class="stock-code">{{plan.stockCode}}</text>
        </view>
        <view class="status-tag" :class="plan.status">{{statusText(plan.status)}}</view>
      </view>

      <view class="plan-content">
        <view class="content-row">
          <text class="row-label">操作方向</text>
          <text class="row-value action" :class="plan.action">{{plan.action === 'buy' ? '买入' : '卖出'}}</text>
        </view>
        <view class="content-row">
          <text class="row-label">目标价位</text>
          <text class="row-value">¥{{plan.targetPrice}}</text>
        </view>
        <view class="content-row" v-if="plan.stopLoss">
          <text class="row-label">止损价位</text>
          <text class="row-value stop">¥{{plan.stopLoss}}</text>
        </view>
        <view class="content-row" v-if="plan.takeProfit">
          <text class="row-label">止盈价位</text>
          <text class="row-value profit">¥{{plan.takeProfit}}</text>
        </view>
        <view class="content-row" v-if="plan.position">
          <text class="row-label">计划仓位</text>
          <text class="row-value">{{plan.position}}%</text>
        </view>
        <view class="content-row" v-if="plan.triggerCondition">
          <text class="row-label">触发条件</text>
          <text class="row-value">{{plan.triggerCondition}}</text>
        </view>
      </view>

      <view class="reason-section" v-if="plan.reason">
        <view class="section-title">交易理由</view>
        <text class="reason-text">{{plan.reason}}</text>
      </view>

      <view class="meta-section">
        <view class="meta-item">
          <text class="meta-label">创建时间</text>
          <text class="meta-value">{{formatTime(plan.createTime)}}</text>
        </view>
        <view class="meta-item" v-if="plan.executeTime">
          <text class="meta-label">执行时间</text>
          <text class="meta-value">{{formatTime(plan.executeTime)}}</text>
        </view>
      </view>
    </view>

    <view class="action-bar" v-if="plan && plan.status === 'pending'">
      <view class="action-btn execute" @click="executePlan">执行预案</view>
      <view class="action-btn edit" @click="editPlan">编辑</view>
      <view class="action-btn cancel" @click="cancelPlan">取消</view>
    </view>

    <view class="action-bar" v-if="plan && plan.status !== 'pending'">
      <view class="action-btn delete" @click="deletePlan">删除</view>
    </view>
  </view>
</template>

<script>
import { getPlanDetail, updatePlan, deletePlan } from '@/utils/planApi.js'

export default {
  data() {
    return {
      planId: '',
      plan: null
    }
  },
  onLoad(options) {
    if (options.id) {
      this.planId = options.id
      this.loadPlanDetail()
    }
  },
  methods: {
    async loadPlanDetail() {
      uni.showLoading({ title: '加载中' })
      const result = await getPlanDetail(this.planId)
      uni.hideLoading()

      if (result.success) {
        this.plan = result.data
      } else {
        uni.showToast({ title: result.error || '加载失败', icon: 'none' })
      }
    },
    formatMonth(dateStr) {
      if (!dateStr) return '--'
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '--'
      return `${date.getMonth() + 1}月`
    },
    formatDay(dateStr) {
      if (!dateStr) return '--'
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '--'
      return String(date.getDate()).padStart(2, '0')
    },
    statusText(status) {
      const map = { pending: '待执行', executed: '已执行', cancelled: '已取消' }
      return map[status] || status
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    executePlan() {
      uni.navigateTo({
        url: `/pages/record/manual?planId=${this.plan._id}&stockName=${this.plan.stockName}&stockCode=${this.plan.stockCode}&action=${this.plan.action}&planPrice=${this.plan.targetPrice}`
      })
    },
    editPlan() {
      uni.navigateTo({ url: `/pages/plan/edit?id=${this.planId}` })
    },
    cancelPlan() {
      uni.showModal({
        title: '确认取消',
        content: '取消后该预案将不再显示在待执行列表中',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中' })
            const result = await updatePlan(this.planId, { status: 'cancelled' })
            uni.hideLoading()
            if (result.success) {
              uni.showToast({ title: '已取消', icon: 'success' })
              this.loadPlanDetail()
            } else {
              uni.showToast({ title: result.error || '操作失败', icon: 'none' })
            }
          }
        }
      })
    },
    deletePlan() {
      uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，是否继续？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '删除中' })
            const result = await deletePlan(this.planId)
            uni.hideLoading()
            if (result.success) {
              uni.showToast({ title: '已删除', icon: 'success' })
              setTimeout(() => uni.navigateBack(), 1500)
            } else {
              uni.showToast({ title: result.error || '删除失败', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container { 
  background: #F5F7FA; 
  min-height: 100vh; 
  padding: 24rpx; 
  padding-bottom: 160rpx; 
}
.plan-card { 
  background: #FFFFFF; 
  border-radius: 24rpx; 
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}
.card-header { display: flex; align-items: center; gap: 20rpx; margin-bottom: 32rpx; }
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
.plan-content { margin-bottom: 32rpx; }
.content-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 24rpx 0; 
  border-bottom: 1rpx solid #F3F4F6; 
}
.content-row:last-child { border-bottom: none; }
.row-label { font-size: 28rpx; color: #6B7280; }
.row-value { 
  font-size: 30rpx; 
  color: #111827; 
  font-weight: 500;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.row-value.action.buy { color: #1E3A8A; }
.row-value.action.sell { color: #6B7280; }
.row-value.stop { color: #DC2626; }
.row-value.profit { color: #059669; }
.reason-section { 
  background: #F5F7FA; 
  border-radius: 16rpx; 
  padding: 28rpx; 
  margin-bottom: 32rpx; 
}
.section-title { 
  font-size: 28rpx; 
  font-weight: bold; 
  color: #1E3A8A; 
  margin-bottom: 16rpx; 
}
.reason-text { font-size: 28rpx; color: #374151; line-height: 1.6; }
.meta-section { padding-top: 24rpx; border-top: 1rpx solid #E5E7EB; }
.meta-item { display: flex; justify-content: space-between; padding: 12rpx 0; }
.meta-label { font-size: 26rpx; color: #9CA3AF; }
.meta-value { font-size: 26rpx; color: #6B7280; }
.action-bar { 
  position: fixed; 
  bottom: 0; 
  left: 0; 
  right: 0; 
  padding: 24rpx 30rpx; 
  background: #FFFFFF; 
  border-top: 1rpx solid #E5E7EB; 
  display: flex; 
  gap: 20rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.04);
}
.action-btn { 
  flex: 1; 
  height: 88rpx; 
  border-radius: 44rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 28rpx;
  font-weight: 500;
}
.action-btn.execute { 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(30, 58, 138, 0.2);
}
.action-btn.edit { background: #F3F4F6; color: #374151; }
.action-btn.cancel { background: #FFFFFF; color: #6B7280; border: 2rpx solid #E5E7EB; }
.action-btn.delete { background: #FFFFFF; color: #DC2626; border: 2rpx solid #DC2626; }
</style>
