<template>
  <view class="container">
    <view class="section-title">记录错题</view>
    
    <view class="option-list">
      <view class="option-card" @click="goToManual">
        <view class="option-icon-wrap">
          <text class="option-icon">✎</text>
        </view>
        <view class="option-content">
          <view class="option-title">手动录入</view>
          <view class="option-desc">手动输入股票信息和错误类型</view>
        </view>
        <text class="arrow">›</text>
      </view>
      
      <view class="option-card" @click="goToPlan">
        <view class="option-icon-wrap">
          <text class="option-icon">📝</text>
        </view>
        <view class="option-content">
          <view class="option-title">交易预案</view>
          <view class="option-desc">创建或执行交易预案</view>
        </view>
        <text class="arrow">›</text>
      </view>

      <!-- 截图识别功能待 OCR 云函数实现后开放 -->
      <!-- <view class="option-card" @click="goToOcr">
        <view class="option-icon-wrap ocr-icon">
          <text class="option-icon">📸</text>
        </view>
        <view class="option-content">
          <view class="option-title">截图识别</view>
          <view class="option-desc">上传交割单截图，自动识别录入</view>
        </view>
        <text class="arrow">›</text>
      </view> -->
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    goToManual() {
      uni.navigateTo({ url: '/pages/record/manual' })
    },
    goToPlan() {
      uni.navigateTo({ url: '/pages/plan/plan' })
    },
    goToOcr() {
      uni.navigateTo({ url: '/pages/record/ocr/ocr' })
    }
  }
}
</script>

<style scoped>
.container { 
  padding: 40rpx; 
  background: #F5F7FA; 
  min-height: 100vh; 
}
.section-title { 
  font-size: 40rpx; 
  font-weight: bold; 
  color: #1E3A8A; 
  margin-bottom: 40rpx; 
}
.option-list { 
  display: flex; 
  flex-direction: column; 
  gap: 24rpx; 
}
.option-card { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 40rpx; 
  display: flex; 
  align-items: center; 
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06); 
}
.option-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #3B82F6, #1E3A8A);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}
.ocr-icon {
  background: linear-gradient(135deg, #e94560, #c73e54);
}
.option-icon { 
  font-size: 36rpx; 
  color: #FFFFFF;
}
.option-content { 
  flex: 1; 
}
.option-title { 
  font-size: 32rpx; 
  font-weight: 600; 
  color: #111827; 
  margin-bottom: 8rpx; 
}
.option-desc { 
  font-size: 26rpx; 
  color: #9CA3AF; 
}
.arrow { 
  font-size: 32rpx; 
  color: #D1D5DB; 
  font-weight: 300;
}
</style>
