<template>
  <view class="container">
    <view class="detail-card">
      <view class="header">
        <view class="stock-info">
          <text class="stock-name">{{mistake.stockName}}</text>
          <text class="stock-code">{{mistake.stockCode}}</text>
        </view>
        <text class="date">{{mistake.tradeDate}}</text>
      </view>

      <view class="trade-detail">
        <view class="trade-row">
          <text class="label">操作</text>
          <text class="value" :class="mistake.action">{{mistake.action === 'buy' ? '买入' : '卖出'}}</text>
        </view>
        <view class="trade-row">
          <text class="label">价格</text>
          <text class="value">￥{{mistake.price}}</text>
        </view>
        <view class="trade-row">
          <text class="label">数量</text>
          <text class="value">{{mistake.quantity}} 股</text>
        </view>
        <view class="trade-row">
          <text class="label">金额</text>
          <text class="value total">￥{{(mistake.price * mistake.quantity).toFixed(2)}}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">错误类型</view>
        <view class="type-list">
          <text class="type-tag" v-for="(type, idx) in mistake.mistakeTypes" :key="idx">{{type}}</text>
        </view>
      </view>

      <view class="section" v-if="mistake.emotion">
        <view class="section-title">当时情绪</view>
        <view class="emotion-tag">{{mistake.emotion}}</view>
      </view>

      <view class="section" v-if="mistake.reflection">
        <view class="section-title">反思</view>
        <view class="reflection-text">{{mistake.reflection}}</view>
      </view>
    </view>

    <view class="actions">
      <button class="btn-edit" @click="editMistake">编辑</button>
      <button class="btn-delete" @click="deleteMistake">删除</button>
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
        // 字段映射，适配页面显示
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
          reflection: data.reflection || ''
        }
      } else {
        uni.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    },
    editMistake() {
      uni.navigateTo({ url: `/pages/mistakes/edit?id=${this.mistakeId}` })
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
.container { padding: 24rpx; background: #F5F7FA; min-height: 100vh; }
.detail-card { 
  background: #FFFFFF; 
  border-radius: 24rpx; 
  padding: 40rpx;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}
.header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 32rpx; 
  padding-bottom: 32rpx; 
  border-bottom: 1rpx solid #E5E7EB; 
}
.stock-info { display: flex; align-items: center; gap: 16rpx; }
.stock-name { font-size: 40rpx; font-weight: bold; color: #111827; }
.stock-code { font-size: 26rpx; color: #9CA3AF; }
.date { font-size: 26rpx; color: #9CA3AF; }
.trade-detail { margin-bottom: 32rpx; }
.trade-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 24rpx 0; 
  border-bottom: 1rpx solid #F3F4F6; 
}
.trade-row:last-child { border-bottom: none; }
.label { font-size: 28rpx; color: #6B7280; }
.value { font-size: 32rpx; font-weight: bold; color: #111827; }
.value.buy { color: #1E3A8A; }
.value.sell { color: #6B7280; }
.value.total { 
  color: #1E3A8A; 
  font-size: 36rpx; 
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.section { margin-top: 32rpx; padding-top: 32rpx; border-top: 1rpx solid #E5E7EB; }
.section-title { font-size: 28rpx; color: #6B7280; margin-bottom: 20rpx; font-weight: 500; }
.type-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.type-tag { 
  background: #EFF6FF; 
  color: #1E3A8A; 
  font-size: 26rpx; 
  padding: 12rpx 24rpx; 
  border-radius: 30rpx;
  font-weight: 500;
}
.emotion-tag { 
  display: inline-block; 
  background: #F3F4F6; 
  color: #6B7280; 
  font-size: 28rpx; 
  padding: 16rpx 32rpx; 
  border-radius: 12rpx; 
}
.reflection-text { font-size: 30rpx; color: #374151; line-height: 1.8; }
.actions { display: flex; gap: 24rpx; margin-top: 40rpx; }
.btn-edit, .btn-delete { 
  flex: 1; 
  height: 96rpx; 
  border-radius: 48rpx; 
  font-size: 32rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 500;
}
.btn-edit { background: #F3F4F6; color: #374151; }
.btn-delete { background: #FEE2E2; color: #DC2626; }
</style>
