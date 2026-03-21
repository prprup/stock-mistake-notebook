<template>
  <view class="container">
    <!-- 上传区域 -->
    <view class="upload-area" v-if="!previewImage && !result">
      <view class="upload-box" @click="chooseImage">
        <text class="upload-icon">📸</text>
        <text class="upload-text">上传交割单截图</text>
        <text class="upload-tip">支持 JPG、PNG 格式</text>
      </view>
    </view>

    <!-- 预览区域 -->
    <view class="preview-area" v-if="previewImage && !result">
      <image :src="previewImage" class="preview-image" mode="widthFix" />
      <view class="btn-group">
        <view class="btn btn-primary" @click="recognizeImage">
          <text>{{recognizing ? '识别中...' : '开始识别'}}</text>
        </view>
        <view class="btn btn-secondary" @click="resetUpload">
          <text>重新选择</text>
        </view>
      </view>
    </view>

    <!-- 识别中 -->
    <view class="recognizing" v-if="recognizing">
      <text class="loading-icon">⏳</text>
      <text>正在识别中，请稍候...</text>
    </view>

    <!-- 识别结果 -->
    <view class="result-area" v-if="result">
      <text class="section-title">识别结果</text>
      <view class="result-item" v-if="result.stockName">
        <text class="label">股票名称</text>
        <text class="value">{{result.stockName}}</text>
      </view>
      <view class="result-item" v-if="result.stockCode">
        <text class="label">股票代码</text>
        <text class="value">{{result.stockCode}}</text>
      </view>
      <view class="result-item" v-if="result.direction">
        <text class="label">买卖方向</text>
        <text class="value">{{result.direction === 'buy' ? '买入' : '卖出'}}</text>
      </view>
      <view class="result-item" v-if="result.price">
        <text class="label">价格</text>
        <text class="value">{{result.price}}</text>
      </view>
      <view class="result-item" v-if="result.quantity">
        <text class="label">数量</text>
        <text class="value">{{result.quantity}}股</text>
      </view>
      <view class="result-item" v-if="result.amount">
        <text class="label">金额</text>
        <text class="value">{{result.amount}}</text>
      </view>

      <view class="btn-group">
        <view class="btn btn-primary" @click="confirmAndEdit">
          <text>确认并补充详情</text>
        </view>
        <view class="btn btn-secondary" @click="resetAll">
          <text>重新识别</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      previewImage: '',
      result: null,
      recognizing: false,
      tempFilePath: ''
    }
  },
  methods: {
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.tempFilePath = res.tempFilePaths[0]
          this.previewImage = res.tempFilePaths[0]
        }
      })
    },

    async recognizeImage() {
      if (!this.tempFilePath) return
      this.recognizing = true

      try {
        // 上传图片到云存储
        const { fileID } = await uniCloud.uploadFile({
          cloudPath: `ocr/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`,
          filePath: this.tempFilePath
        })

        // 调用 OCR 云函数（需要自行实现 OCR 云函数）
        const { result } = await uniCloud.callFunction({
          name: 'ocrRecognize',
          data: { fileID }
        })

        if (result && result.code === 0) {
          this.result = result.data
        } else {
          uni.showToast({
            title: result?.message || '识别失败，请手动录入',
            icon: 'none',
            duration: 3000
          })
        }
      } catch (err) {
        console.error('OCR识别失败:', err)
        uni.showToast({
          title: '识别失败，请手动录入',
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.recognizing = false
      }
    },

    confirmAndEdit() {
      if (!this.result) return
      // 跳转到手动录入页面，携带识别数据
      const params = encodeURIComponent(JSON.stringify(this.result))
      uni.redirectTo({
        url: `/pages/record/manual?ocrData=${params}`
      })
    },

    resetUpload() {
      this.previewImage = ''
      this.tempFilePath = ''
    },

    resetAll() {
      this.previewImage = ''
      this.tempFilePath = ''
      this.result = null
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 上传区域 */
.upload-area {
  margin-top: 60rpx;
}

.upload-box {
  background: #fff;
  border-radius: 20rpx;
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx dashed #ddd;
}

.upload-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.upload-tip {
  font-size: 26rpx;
  color: #999;
}

/* 预览区域 */
.preview-area {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.preview-image {
  width: 100%;
  border-radius: 12rpx;
}

.recognizing {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  color: #667eea;
  font-size: 30rpx;
}

.loading-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

/* 识别结果 */
.result-area {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.result-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 28rpx;
  color: #666;
}

.value {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}

/* 按钮组 */
.btn-group {
  margin-top: 40rpx;
}

.btn {
  text-align: center;
  padding: 30rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  margin-bottom: 20rpx;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}
</style>
