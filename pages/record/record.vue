<template>
  <view class="container">
    <view class="section-title">选择记录方式</view>
    
    <view class="option-list">
      <view class="option-card" @click="goToManual">
        <view class="option-icon">✏️</view>
        <view class="option-content">
          <view class="option-title">手动录入</view>
          <view class="option-desc">手动输入股票信息和错误类型</view>
        </view>
        <text class="arrow">></text>
      </view>
      
      <view class="option-card" @click="goToOCR">
        <view class="option-icon">📷</view>
        <view class="option-content">
          <view class="option-title">截图识别</view>
          <view class="option-desc">上传交割单截图自动识别</view>
        </view>
        <text class="arrow">></text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    goToManual() {
      uni.navigateTo({ url: '/pages/record/manual' })
    },
    goToOCR() {
      uni.navigateTo({ url: '/pages/record/ocr' })
    }
  }
}
</script>

<style scoped>
.container { padding: 40rpx; background: #f5f5f5; min-height: 100vh; }
.section-title { font-size: 36rpx; font-weight: bold; color: #333; margin-bottom: 40rpx; }
.option-list { display: flex; flex-direction: column; gap: 30rpx; }
.option-card { background: #fff; border-radius: 20rpx; padding: 40rpx; display: flex; align-items: center; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05); }
.option-icon { font-size: 60rpx; margin-right: 30rpx; }
.option-content { flex: 1; }
.option-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 10rpx; }
.option-desc { font-size: 26rpx; color: #999; }
.arrow { font-size: 32rpx; color: #ccc; }
</style>
