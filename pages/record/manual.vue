<template>
  <view class="container">
    <!-- 股票信息 -->
    <view class="section">
      <view class="section-title">股票信息</view>
      
      <view class="form-item">
        <text class="label">股票代码/名称</text>
        <input class="input" placeholder="输入代码或名称，如 000001 或 平安银行" v-model="stockCode" />
      </view>

      <view class="form-item">
        <text class="label">操作方向</text>
        <view class="radio-group">
          <view class="radio" :class="{ active: action === 'buy' }" @click="action = 'buy'">买入</view>
          <view class="radio" :class="{ active: action === 'sell' }" @click="action = 'sell'">卖出</view>
        </view>
      </view>

      <view class="form-row">
        <view class="form-item half">
          <text class="label">价格</text>
          <input class="input" type="digit" placeholder="0.00" v-model="price" />
        </view>
        <view class="form-item half">
          <text class="label">数量</text>
          <input class="input" type="number" placeholder="0" v-model="quantity" />
        </view>
      </view>

      <view class="form-item">
        <text class="label">交易日期</text>
        <picker mode="date" :value="tradeDate" @change="onDateChange">
          <view class="picker">{{tradeDate}}</view>
        </picker>
      </view>
    </view>

    <!-- 错误类型 -->
    <view class="section">
      <view class="section-title">犯了什么错？（可多选）</view>
      <view class="mistake-types">
        <view v-for="(item, index) in mistakeTypes" :key="item.code"
          class="type-tag" :class="{ selected: item.selected }"
          @click="toggleMistakeType(index)">
          {{item.name}}
        </view>
      </view>
    </view>

    <!-- 情绪记录 -->
    <view class="section">
      <view class="section-title">当时情绪</view>
      <view class="emotion-list">
        <view v-for="item in emotions" :key="item"
          class="emotion-item" :class="{ selected: emotion === item }"
          @click="emotion = item">
          {{item}}
        </view>
      </view>
    </view>

    <!-- 反思 -->
    <view class="section">
      <view class="section-title">一句话反思</view>
      <textarea class="textarea" placeholder="当时为什么这么做？现在回头看错在哪？"
        v-model="reflection" maxlength="200" />
      <view class="char-count">{{reflection.length}}/200</view>
    </view>

    <!-- 分享设置 -->
    <view class="section">
      <view class="share-option">
        <text>匿名分享到广场</text>
        <switch :checked="isPublic" @change="isPublic = $event.detail.value" color="#e94560" />
      </view>
      <view class="share-tip" v-if="isPublic">
        分享时会隐藏股票名称和具体金额，仅展示错误类型和反思
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="footer">
      <button class="submit-btn" @click="submit">记录错题</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      stockCode: '',
      action: 'buy',
      price: '',
      quantity: '',
      tradeDate: '',
      mistakeTypes: [
        { code: 'chase_high', name: '追高买入', selected: false },
        { code: 'panic_sell', name: '恐慌割肉', selected: false },
        { code: 'no_stop_loss', name: '该止损没止损', selected: false },
        { code: 'no_take_profit', name: '该止盈没止盈', selected: false },
        { code: 'heavy_position', name: '单票过重', selected: false },
        { code: 'full_position', name: '满仓梭哈', selected: false },
        { code: 'frequent_trade', name: '频繁交易', selected: false },
        { code: 'revenge_trade', name: '报复性交易', selected: false },
        { code: 'follow_news', name: '听信消息', selected: false },
        { code: 'follow_others', name: '跟风买入', selected: false }
      ],
      emotions: ['恐慌', '贪婪', '犹豫', '冲动', '自信', '后悔', '平静'],
      emotion: '',
      reflection: '',
      isPublic: false
    }
  },
  onLoad() {
    const today = new Date()
    this.tradeDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  },
  methods: {
    onDateChange(e) {
      this.tradeDate = e.detail.value
    },
    toggleMistakeType(index) {
      this.mistakeTypes[index].selected = !this.mistakeTypes[index].selected
    },
    submit() {
      if (!this.stockCode) {
        uni.showToast({ title: '请输入股票代码', icon: 'none' })
        return
      }
      if (!this.price || !this.quantity) {
        uni.showToast({ title: '请输入价格和数量', icon: 'none' })
        return
      }
      const selectedTypes = this.mistakeTypes.filter(t => t.selected)
      if (selectedTypes.length === 0) {
        uni.showToast({ title: '请选择错误类型', icon: 'none' })
        return
      }
      
      const data = {
        stockCode: this.stockCode,
        action: this.action,
        price: parseFloat(this.price),
        quantity: parseInt(this.quantity),
        tradeDate: this.tradeDate,
        mistakeTypes: selectedTypes.map(t => t.name),
        emotion: this.emotion,
        reflection: this.reflection,
        isPublic: this.isPublic
      }
      
      console.log('提交数据:', data)
      uni.showLoading({ title: '保存中...' })
      setTimeout(() => {
        uni.hideLoading()
        uni.showToast({ title: '记录成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      }, 1000)
    }
  }
}
</script>

<style scoped>
.container { padding: 20rpx 20rpx 140rpx; background: #f5f5f5; min-height: 100vh; }
.section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 24rpx; }
.form-item { margin-bottom: 24rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-row { display: flex; gap: 20rpx; }
.form-row .form-item { flex: 1; }
.label { display: block; font-size: 26rpx; color: #666; margin-bottom: 12rpx; }
.input { height: 80rpx; background: #f8f8f8; border-radius: 12rpx; padding: 0 24rpx; font-size: 28rpx; color: #333; }
.picker { height: 80rpx; background: #f8f8f8; border-radius: 12rpx; padding: 0 24rpx; font-size: 28rpx; color: #333; line-height: 80rpx; }
.radio-group { display: flex; gap: 20rpx; }
.radio { flex: 1; height: 80rpx; background: #f8f8f8; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; color: #666; }
.radio.active { background: #e94560; color: #fff; }
.mistake-types { display: flex; flex-wrap: wrap; gap: 16rpx; }
.type-tag { padding: 16rpx 28rpx; background: #f5f5f5; border-radius: 30rpx; font-size: 26rpx; color: #666; border: 2rpx solid transparent; }
.type-tag.selected { background: #ffe5e5; color: #e94560; border-color: #e94560; }
.emotion-list { display: flex; flex-wrap: wrap; gap: 20rpx; }
.emotion-item { padding: 20rpx 36rpx; background: #f5f5f5; border-radius: 12rpx; font-size: 28rpx; color: #666; }
.emotion-item.selected { background: #e94560; color: #fff; }
.textarea { width: 100%; height: 200rpx; background: #f8f8f8; border-radius: 12rpx; padding: 24rpx; font-size: 28rpx; color: #333; box-sizing: border-box; }
.char-count { text-align: right; font-size: 24rpx; color: #999; margin-top: 12rpx; }
.share-option { display: flex; justify-content: space-between; align-items: center; font-size: 28rpx; color: #333; }
.share-tip { font-size: 24rpx; color: #999; margin-top: 16rpx; line-height: 1.5; }
.footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 30rpx; background: #fff; border-top: 1rpx solid #eee; }
.submit-btn { width: 100%; height: 90rpx; background: #e94560; color: #fff; font-size: 32rpx; border-radius: 45rpx; display: flex; align-items: center; justify-content: center; border: none; }
.submit-btn::after { border: none; }
</style>
