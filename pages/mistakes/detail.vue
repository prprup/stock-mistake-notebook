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
      uni.showToast({ title: '编辑功能开发中', icon: 'none' })
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
.container { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }
.detail-card { background: #fff; border-radius: 20rpx; padding: 40rpx; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; padding-bottom: 30rpx; border-bottom: 1rpx solid #f0f0f0; }
.stock-info { display: flex; align-items: center; gap: 16rpx; }
.stock-name { font-size: 40rpx; font-weight: bold; color: #333; }
.stock-code { font-size: 26rpx; color: #999; }
.date { font-size: 26rpx; color: #999; }
.trade-detail { margin-bottom: 30rpx; }
.trade-row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.trade-row:last-child { border-bottom: none; }
.label { font-size: 28rpx; color: #666; }
.value { font-size: 32rpx; font-weight: bold; color: #333; }
.value.buy { color: #e94560; }
.value.sell { color: #52c41a; }
.value.total { color: #e94560; font-size: 36rpx; }
.section { margin-top: 30rpx; padding-top: 30rpx; border-top: 1rpx solid #f0f0f0; }
.section-title { font-size: 28rpx; color: #999; margin-bottom: 20rpx; }
.type-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.type-tag { background: #ffe5e5; color: #e94560; font-size: 26rpx; padding: 12rpx 24rpx; border-radius: 30rpx; }
.emotion-tag { display: inline-block; background: #f0f0f0; color: #666; font-size: 28rpx; padding: 16rpx 32rpx; border-radius: 12rpx; }
.reflection-text { font-size: 30rpx; color: #333; line-height: 1.8; }
.actions { display: flex; gap: 20rpx; margin-top: 40rpx; }
.btn-edit, .btn-delete { flex: 1; height: 90rpx; border-radius: 45rpx; font-size: 32rpx; display: flex; align-items: center; justify-content: center; }
.btn-edit { background: #f5f5f5; color: #333; }
.btn-delete { background: #ffe5e5; color: #e94560; }
</style>
