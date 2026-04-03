<template>
  <view class="container">
    <view class="hero-card">
      <view class="hero-top">
        <view class="hero-stock">
          <text class="stock-name">{{ mistake.stockName || '未命名标的' }}</text>
          <text class="stock-code">{{ mistake.stockCode || '--' }}</text>
        </view>
        <view class="hero-date-wrap">
          <text class="hero-date-label">交易日期</text>
          <text class="hero-date">{{ formatTradeDate(mistake.tradeDate) }}</text>
        </view>
      </view>

      <view class="hero-main">
        <view class="action-pill" :class="mistake.action">
          <text class="action-pill-text">{{ actionText(mistake.action) }}</text>
        </view>
        <text class="hero-title">交易错题复盘</text>
        <text class="hero-subtitle">先识别错误归因，再进入 K 线复盘继续校正执行纪律</text>
      </view>

      <view class="hero-metrics">
        <view class="metric-card focus">
          <text class="metric-label">成交金额</text>
          <text class="metric-value money">￥{{ totalAmount }}</text>
        </view>
        <view class="metric-grid">
          <view class="metric-card">
            <text class="metric-label">成交价格</text>
            <text class="metric-value">￥{{ formatPrice(mistake.price) }}</text>
          </view>
          <view class="metric-card">
            <text class="metric-label">成交数量</text>
            <text class="metric-value">{{ mistake.quantity || 0 }} 股</text>
          </view>
        </view>
      </view>
    </view>

    <view class="panel diagnosis-panel">
      <view class="panel-head">
        <text class="panel-kicker">DIAGNOSIS</text>
        <text class="panel-title">这笔交易错在哪</text>
      </view>

      <view class="types-wrap" v-if="mistake.mistakeTypes && mistake.mistakeTypes.length">
        <view
          class="type-chip"
          :class="{ primary: idx === 0 }"
          v-for="(type, idx) in mistake.mistakeTypes"
          :key="idx"
        >
          <text class="type-chip-text">{{ idx === 0 ? '主错误｜' + type : type }}</text>
        </view>
      </view>
      <view class="empty-block" v-else>
        <text class="empty-text">暂未填写错误类型</text>
      </view>

      <view class="emotion-card" v-if="mistake.emotion">
        <view class="emotion-head">
          <text class="emotion-label">交易情绪</text>
          <text class="emotion-badge">情绪已记录</text>
        </view>
        <text class="emotion-value">{{ mistake.emotion }}</text>
      </view>

      <view class="reflection-card" v-if="mistake.reflection">
        <view class="reflection-head">
          <text class="panel-title small">本次复盘结论</text>
          <text class="reflection-tip">核心问题通常不在选股，而在执行偏差</text>
        </view>
        <text class="reflection-text">{{ mistake.reflection }}</text>
      </view>
    </view>

    <view class="panel trade-panel">
      <view class="panel-head compact">
        <text class="panel-kicker">TRADE SNAPSHOT</text>
        <text class="panel-title">交易数据面板</text>
      </view>

      <view class="trade-grid">
        <view class="trade-stat">
          <text class="trade-stat-label">操作方向</text>
          <text class="trade-stat-value" :class="mistake.action">{{ actionText(mistake.action) }}</text>
        </view>
        <view class="trade-stat">
          <text class="trade-stat-label">成交价格</text>
          <text class="trade-stat-value">￥{{ formatPrice(mistake.price) }}</text>
        </view>
        <view class="trade-stat">
          <text class="trade-stat-label">成交数量</text>
          <text class="trade-stat-value">{{ mistake.quantity || 0 }} 股</text>
        </view>
        <view class="trade-stat accent">
          <text class="trade-stat-label">成交金额</text>
          <text class="trade-stat-value money">￥{{ totalAmount }}</text>
        </view>
      </view>
    </view>

    <view class="panel linked-panel" v-if="mistake.linkedPlan">
      <view class="panel-head compact">
        <text class="panel-kicker">PLAN LINK</text>
        <text class="panel-title">预案 → 执行 → 错题</text>
      </view>

      <view class="flow-track">
        <view class="flow-node done">
          <text class="flow-node-text">预案</text>
        </view>
        <view class="flow-line"></view>
        <view class="flow-node done">
          <text class="flow-node-text">执行</text>
        </view>
        <view class="flow-line active"></view>
        <view class="flow-node active">
          <text class="flow-node-text">错题</text>
        </view>
      </view>

      <view class="linked-summary">
        <view class="linked-row">
          <text class="linked-label">预案股票</text>
          <text class="linked-value">{{ mistake.linkedPlan.stockName }} {{ mistake.linkedPlan.stockCode }}</text>
        </view>
        <view class="linked-row">
          <text class="linked-label">预案状态</text>
          <text class="linked-value" :class="statusClass(mistake.linkedPlan.status)">{{ planStatusText(mistake.linkedPlan.status) }}</text>
        </view>
        <view class="linked-row" v-if="mistake.linkedPlan.targetPrice">
          <text class="linked-label">目标价</text>
          <text class="linked-value money">￥{{ formatPrice(mistake.linkedPlan.targetPrice) }}</text>
        </view>
      </view>

      <view class="linked-note">
        <text class="linked-note-text">该条错题已和原始交易预案建立闭环，可回看最初计划与实际执行偏差。</text>
      </view>

      <view class="linked-actions">
        <view class="ghost-action" @click="goToPlan(mistake.linkedPlan._id)">
          <text class="ghost-action-text">查看关联预案</text>
        </view>
      </view>
    </view>

    <view class="action-zone">
      <view class="primary-action" @click="goToKline">
        <text class="primary-action-title">进入 K 线复盘</text>
        <text class="primary-action-subtitle">结合错题挂点回看当天走势与执行偏差</text>
      </view>

      <view class="secondary-actions">
        <view class="secondary-action edit" @click="editMistake">
          <text class="secondary-action-text">编辑记录</text>
        </view>
        <view class="secondary-action delete" @click="deleteMistake">
          <text class="secondary-action-text">删除记录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getMistakeDetail, deleteMistake } from '@/utils/mistakeApi.js'

export default {
  data() {
    return {
      mistake: {}
    }
  },
  computed: {
    totalAmount() {
      const price = Number(this.mistake.price || 0)
      const quantity = Number(this.mistake.quantity || 0)
      return (price * quantity).toFixed(2)
    }
  },
  onLoad(options) {
    this.mistakeId = options.id
    this.loadDetail(options.id)
  },
  methods: {
    async loadDetail(id) {
      uni.showLoading({ title: '加载中...' })
      const res = await getMistakeDetail(id)
      uni.hideLoading()

      if (res.success) {
        const data = res.data
        this.mistake = {
          _id: data._id,
          stockName: data.stockName,
          stockCode: data.stockCode,
          tradeDate: data.date || data.createTime,
          action: data.action || 'buy',
          price: data.price || 0,
          quantity: data.quantity || 0,
          mistakeTypes: data.mistakeTypes || [],
          emotion: data.emotion || '',
          reflection: data.reflection || '',
          linkedPlan: data.linkedPlan || null
        }
      } else {
        uni.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    },
    actionText(action) {
      return action === 'buy' ? '买入' : '卖出'
    },
    formatPrice(price) {
      const value = Number(price || 0)
      return value.toFixed(2)
    },
    formatTradeDate(value) {
      if (!value) return '--'
      if (typeof value === 'string' && /^\d{8}$/.test(value)) {
        return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
      }
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
    planStatusText(status) {
      return status === 'executed' ? '已执行' : (status === 'pending' ? '待执行' : '已取消')
    },
    statusClass(status) {
      if (status === 'executed') return 'is-success'
      if (status === 'pending') return 'is-warn'
      return 'is-muted'
    },
    editMistake() {
      uni.navigateTo({ url: `/pages/mistakes/edit?id=${this.mistakeId}` })
    },
    goToPlan(id) {
      if (!id) return
      uni.navigateTo({ url: `/pages/plan/detail?id=${id}` })
    },
    goToKline() {
      if (!this.mistake.stockCode) return
      const params = new URLSearchParams()
      params.append('code', this.mistake.stockCode)
      params.append('tsCode', this.mistake.stockCode)
      params.append('name', this.mistake.stockName || '')
      uni.navigateTo({ url: `/pages/analysis/kline?${params.toString()}` })
    },
    async deleteMistake() {
      uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，是否继续？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '删除中...' })
            const result = await deleteMistake(this.mistakeId)
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
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: 44rpx;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 28%),
    linear-gradient(180deg, #06111f 0%, #0a1528 240rpx, #eef3f9 240rpx, #eef3f9 100%);
}

.hero-card {
  position: relative;
  overflow: hidden;
  padding: 34rpx;
  border-radius: 32rpx;
  background: linear-gradient(145deg, #0b1830 0%, #10274c 58%, #143a74 100%);
  box-shadow: 0 18rpx 48rpx rgba(3, 10, 24, 0.34);
}

.hero-card::after {
  content: '';
  position: absolute;
  top: -120rpx;
  right: -60rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(125, 211, 252, 0.24) 0%, rgba(125, 211, 252, 0) 72%);
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24rpx;
  position: relative;
  z-index: 1;
}

.hero-stock {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.stock-name {
  color: #f8fbff;
  font-size: 46rpx;
  font-weight: 700;
  line-height: 1.15;
}

.stock-code {
  color: rgba(219, 234, 254, 0.76);
  font-size: 24rpx;
  letter-spacing: 2rpx;
  font-family: 'DIN Alternate', 'Roboto Mono', monospace;
}

.hero-date-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
}

.hero-date-label {
  font-size: 20rpx;
  color: rgba(191, 219, 254, 0.72);
}

.hero-date {
  font-size: 24rpx;
  color: #f8fbff;
  font-family: 'DIN Alternate', 'Roboto Mono', monospace;
}

.hero-main {
  position: relative;
  z-index: 1;
  margin-top: 34rpx;
}

.action-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 128rpx;
  height: 52rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: rgba(15, 23, 42, 0.36);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
}

.action-pill.buy {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(248, 113, 113, 0.32);
}

.action-pill.sell {
  background: rgba(148, 163, 184, 0.16);
  border-color: rgba(203, 213, 225, 0.28);
}

.action-pill-text {
  color: #f8fbff;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.hero-title {
  display: block;
  margin-top: 24rpx;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 600;
}

.hero-subtitle {
  display: block;
  margin-top: 12rpx;
  color: rgba(219, 234, 254, 0.78);
  font-size: 24rpx;
  line-height: 1.7;
}

.hero-metrics {
  position: relative;
  z-index: 1;
  margin-top: 34rpx;
}

.metric-card {
  padding: 26rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(191, 219, 254, 0.14);
  backdrop-filter: blur(12rpx);
}

.metric-card.focus {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(59, 130, 246, 0.1));
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-top: 20rpx;
}

.metric-label {
  font-size: 22rpx;
  color: rgba(219, 234, 254, 0.72);
}

.metric-value {
  display: block;
  margin-top: 14rpx;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
}

.metric-value.money {
  font-size: 44rpx;
  letter-spacing: 1rpx;
  font-family: 'DIN Alternate', 'Roboto Mono', monospace;
}

.panel {
  margin-top: 24rpx;
  padding: 30rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.06);
}

.panel-head {
  margin-bottom: 24rpx;
}

.panel-head.compact {
  margin-bottom: 20rpx;
}

.panel-kicker {
  display: block;
  color: #3b82f6;
  font-size: 20rpx;
  letter-spacing: 3rpx;
  font-weight: 700;
}

.panel-title {
  display: block;
  margin-top: 10rpx;
  color: #0f172a;
  font-size: 34rpx;
  font-weight: 700;
}

.panel-title.small {
  font-size: 30rpx;
}

.types-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.type-chip {
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  border: 1rpx solid rgba(59, 130, 246, 0.14);
}

.type-chip.primary {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  box-shadow: 0 8rpx 20rpx rgba(59, 130, 246, 0.14);
}

.type-chip-text {
  color: #18407a;
  font-size: 25rpx;
  font-weight: 600;
}

.empty-block {
  padding: 24rpx;
  border-radius: 20rpx;
  background: #f8fafc;
  border: 1rpx dashed #cbd5e1;
}

.empty-text {
  font-size: 26rpx;
  color: #64748b;
}

.emotion-card {
  margin-top: 22rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1rpx solid rgba(249, 115, 22, 0.14);
}

.emotion-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.emotion-label {
  color: #9a3412;
  font-size: 24rpx;
  font-weight: 600;
}

.emotion-badge {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.6);
  color: #c2410c;
  font-size: 20rpx;
}

.emotion-value {
  display: block;
  margin-top: 16rpx;
  color: #7c2d12;
  font-size: 34rpx;
  font-weight: 700;
}

.reflection-card {
  margin-top: 22rpx;
  padding: 26rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
  border: 1rpx solid rgba(37, 99, 235, 0.08);
}

.reflection-head {
  margin-bottom: 16rpx;
}

.reflection-tip {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
}

.reflection-text {
  color: #1e293b;
  font-size: 29rpx;
  line-height: 1.86;
}

.trade-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.trade-stat {
  padding: 24rpx;
  border-radius: 22rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
}

.trade-stat.accent {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: rgba(59, 130, 246, 0.16);
}

.trade-stat-label {
  display: block;
  color: #64748b;
  font-size: 22rpx;
}

.trade-stat-value {
  display: block;
  margin-top: 12rpx;
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 700;
}

.trade-stat-value.money {
  font-family: 'DIN Alternate', 'Roboto Mono', monospace;
}

.trade-stat-value.buy {
  color: #dc2626;
}

.trade-stat-value.sell {
  color: #475569;
}

.flow-track {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.flow-node {
  min-width: 102rpx;
  height: 54rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
}

.flow-node.done {
  background: #dbeafe;
}

.flow-node.active {
  background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
  box-shadow: 0 10rpx 24rpx rgba(59, 130, 246, 0.24);
}

.flow-node-text {
  color: #0f172a;
  font-size: 22rpx;
  font-weight: 600;
}

.flow-node.active .flow-node-text {
  color: #ffffff;
}

.flow-line {
  flex: 1;
  height: 4rpx;
  background: #cbd5e1;
}

.flow-line.active {
  background: linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%);
}

.linked-summary {
  padding: 24rpx;
  border-radius: 22rpx;
  background: #f8fafc;
}

.linked-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #e2e8f0;
}

.linked-row:last-child {
  border-bottom: none;
}

.linked-label {
  color: #64748b;
  font-size: 25rpx;
}

.linked-value {
  flex: 1;
  text-align: right;
  color: #0f172a;
  font-size: 27rpx;
  font-weight: 600;
}

.linked-value.money {
  font-family: 'DIN Alternate', 'Roboto Mono', monospace;
}

.linked-value.is-success {
  color: #059669;
}

.linked-value.is-warn {
  color: #d97706;
}

.linked-value.is-muted {
  color: #64748b;
}

.linked-note {
  margin-top: 18rpx;
  padding: 20rpx 22rpx;
  border-radius: 18rpx;
  background: #eff6ff;
}

.linked-note-text {
  color: #1e3a8a;
  font-size: 24rpx;
  line-height: 1.72;
}

.linked-actions {
  margin-top: 18rpx;
}

.ghost-action {
  height: 88rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
}

.ghost-action-text {
  color: #f8fafc;
  font-size: 28rpx;
  font-weight: 600;
}

.action-zone {
  margin-top: 28rpx;
}

.primary-action {
  padding: 28rpx 30rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #60a5fa 100%);
  box-shadow: 0 16rpx 34rpx rgba(37, 99, 235, 0.26);
}

.primary-action-title {
  display: block;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
}

.primary-action-subtitle {
  display: block;
  margin-top: 10rpx;
  color: rgba(239, 246, 255, 0.9);
  font-size: 24rpx;
  line-height: 1.7;
}

.secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 18rpx;
}

.secondary-action {
  height: 90rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid #dbe4ef;
}

.secondary-action.edit {
  color: #1e293b;
}

.secondary-action.delete {
  background: #fff5f5;
  border-color: #fecaca;
}

.secondary-action.delete .secondary-action-text {
  color: #dc2626;
}

.secondary-action-text {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
