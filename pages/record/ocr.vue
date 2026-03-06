<template>
  <view class="container">
    <view class="upload-area" @click="chooseImage" v-if="!imageUrl">
      <view class="upload-icon">📷</view>
      <view class="upload-text">点击上传交割单截图</view>
      <view class="upload-tip">支持识别股票代码、价格、数量等信息</view>
    </view>
    
    <view class="preview-area" v-else>
      <image :src="imageUrl" mode="widthFix" class="preview-image" />
      <view class="preview-actions">
        <button class="btn-secondary" @click="rechoose">重新选择</button>
        <button class="btn-primary" @click="startOCR">开始识别</button>
      </view>
    </view>
    
    <view class="result-section" v-if="ocrResult">
      <view class="section-title">识别结果</view>
      <view class="result-item">
        <text class="label">股票代码</text>
        <input class="input" v-model="ocrResult.stockCode" />
      </view>
      <view class="result-item">
        <text class="label">股票名称</text>
        <input class="input" v-model="ocrResult.stockName" />
      </view>
      <view class="result-row">
        <view class="result-item half">
          <text class="label">价格</text>
          <input class="input" v-model="ocrResult.price" />
        </view>
        <view class="result-item half">
          <text class="label">数量</text>
          <input class="input" v-model="ocrResult.quantity" />
        </view>
      </view>
      <button class="btn-confirm" @click="confirmResult">确认并继续</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      imageUrl: '',
      ocrResult: null
    }
  },
  methods: {
    chooseImage() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          this.imageUrl = res.tempFilePaths[0]
        }
      })
    },
    rechoose() {
      this.imageUrl = ''
      this.ocrResult = null
    },
    startOCR() {
      uni.showLoading({ title: '识别中...' })
      setTimeout(() => {
        uni.hideLoading()
        this.ocrResult = {
          stockCode: '000001',
          stockName: '平安银行',
          price: '12.50',
          quantity: '1000'
        }
      }, 2000)
    },
    confirmResult() {
      uni.navigateTo({
        url: `/pages/record/manual?data=${encodeURIComponent(JSON.stringify(this.ocrResult))}`
      })
    }
  }
}
</script>

<style scoped>
.container { padding: 40rpx; background: #F5F7FA; min-height: 100vh; }
.upload-area { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 100rpx 60rpx; 
  text-align: center; 
  border: 4rpx dashed #E5E7EB;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.upload-icon { font-size: 80rpx; margin-bottom: 30rpx; }
.upload-text { font-size: 32rpx; color: #111827; margin-bottom: 16rpx; font-weight: 500; }
.upload-tip { font-size: 26rpx; color: #9CA3AF; }
.preview-area { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.preview-image { width: 100%; border-radius: 12rpx; }
.preview-actions { display: flex; gap: 20rpx; margin-top: 30rpx; }
.btn-secondary, .btn-primary { 
  flex: 1; 
  height: 88rpx; 
  border-radius: 44rpx; 
  font-size: 28rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 500;
}
.btn-secondary { background: #F3F4F6; color: #6B7280; }
.btn-primary { 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(30, 58, 138, 0.2);
}
.result-section { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 32rpx; 
  margin-top: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.section-title { 
  font-size: 32rpx; 
  font-weight: bold; 
  color: #1E3A8A; 
  margin-bottom: 30rpx; 
}
.result-item { margin-bottom: 24rpx; }
.result-row { display: flex; gap: 20rpx; }
.result-row .result-item { flex: 1; }
.label { display: block; font-size: 26rpx; color: #6B7280; margin-bottom: 12rpx; }
.input { 
  height: 88rpx; 
  background: #F5F7FA; 
  border-radius: 12rpx; 
  padding: 0 24rpx; 
  font-size: 28rpx; 
  color: #111827;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.btn-confirm { 
  width: 100%; 
  height: 96rpx; 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  color: #fff; 
  font-size: 32rpx; 
  border-radius: 48rpx; 
  margin-top: 30rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(30, 58, 138, 0.2);
}
</style>
