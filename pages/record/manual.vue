<template>
  <view class="container">
    <view class="section">
      <view class="section-title">股票信息</view>
      <view class="form-item stock-search">
        <text class="label">股票代码/名称</text>
        <view class="search-box">
          <input class="input" placeholder="输入代码或名称搜索" v-model="stockSearchKey" @input="onStockSearch" @focus="onSearchFocus" />
          <text class="clear-btn" v-if="stockSearchKey" @click="clearSearch">×</text>
        </view>
        <view class="search-results" v-if="showSearchResults && searchResults.length > 0">
          <view class="result-item" v-for="(item, index) in searchResults" :key="index" @click="selectStock(item)">
            <view class="stock-info">
              <text class="stock-name">{{item.name}}</text>
              <text class="stock-code">{{item.symbol}}</text>
            </view>
            <text class="stock-ts">{{item.tsCode}}</text>
          </view>
        </view>
        <view class="search-results empty" v-if="showSearchResults && searchResults.length === 0 && stockSearchKey.length >= 2">
          <text>未找到相关股票</text>
        </view>
      </view>

      <view class="selected-stock" v-if="selectedStock.tsCode">
        <view class="selected-info">
          <text class="selected-name">{{selectedStock.name}}</text>
          <text class="selected-code">{{selectedStock.tsCode}}</text>
        </view>
        <text class="change-btn" @click="changeStock">更换</text>
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

    <view class="section">
      <view class="section-title">犯了什么错？（可多选）</view>
      <view class="mistake-types">
        <view v-for="(item, index) in mistakeTypes" :key="item.code" class="type-tag" :class="{ selected: item.selected }" @click="toggleMistakeType(index)">{{item.name}}</view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">当时情绪</view>
      <view class="emotion-list">
        <view v-for="item in emotions" :key="item" class="emotion-item" :class="{ selected: emotion === item }" @click="emotion = item">{{item}}</view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">一句话反思</view>
      <textarea class="textarea" placeholder="当时为什么这么做？现在回头看错在哪？" v-model="reflection" maxlength="200" />
      <view class="char-count">{{reflection.length}}/200</view>
    </view>

    <view class="footer">
      <button class="submit-btn" @click="submit">记录错题</button>
    </view>
  </view>
</template>

<script>
import { searchStock } from '@/utils/klineApi.js'
import { addMistake } from '@/utils/mistakeApi.js'

export default {
  data() {
    return {
      stockSearchKey: '',
      searchResults: [],
      showSearchResults: false,
      selectedStock: { name: '', tsCode: '', symbol: '' },
      action: 'buy',
      price: '',
      quantity: '',
      tradeDate: '',
      planId: '',
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
      searchTimer: null
    }
  },
  onLoad(options) {
    const today = new Date()
    this.tradeDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // 从预案跳转过来的预填充
    if (options.planId) {
      this.planId = options.planId
      this.selectedStock = {
        name: options.stockName || '',
        tsCode: options.stockCode || '',
        symbol: ''
      }
      this.stockSearchKey = options.stockName || ''
      this.action = options.action || 'buy'
      this.price = options.planPrice || ''
    }
  },
  methods: {
    onStockSearch(e) {
      const keyword = e.detail.value.trim()
      this.stockSearchKey = keyword
      if (this.searchTimer) clearTimeout(this.searchTimer)
      if (keyword.length < 2) {
        this.searchResults = []
        this.showSearchResults = false
        return
      }
      this.searchTimer = setTimeout(async () => {
        uni.showLoading({ title: '搜索中' })
        const result = await searchStock(keyword)
        uni.hideLoading()
        this.searchResults = result.success ? result.data : []
        this.showSearchResults = true
      }, 300)
    },
    onSearchFocus() {
      if (this.searchResults.length > 0) this.showSearchResults = true
    },
    clearSearch() {
      this.stockSearchKey = ''
      this.searchResults = []
      this.showSearchResults = false
    },
    selectStock(stock) {
      this.selectedStock = { name: stock.name, tsCode: stock.tsCode, symbol: stock.symbol }
      this.stockSearchKey = stock.name
      this.showSearchResults = false
    },
    changeStock() {
      this.selectedStock = { name: '', tsCode: '', symbol: '' }
      this.stockSearchKey = ''
    },
    onDateChange(e) { this.tradeDate = e.detail.value },
    toggleMistakeType(index) { this.mistakeTypes[index].selected = !this.mistakeTypes[index].selected },
    async submit() {
      if (!this.selectedStock.tsCode) {
        uni.showToast({ title: '请选择股票', icon: 'none' })
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
      
      uni.showLoading({ title: '保存中' })
      const result = await addMistake({
        stockName: this.selectedStock.name,
        stockCode: this.selectedStock.tsCode,
        mistakeTypes: selectedTypes.map(t => t.name),
        emotion: this.emotion,
        reflection: this.reflection,
        lossAmount: parseFloat(this.price) * parseInt(this.quantity),
        date: new Date(this.tradeDate),
        planId: this.planId || undefined
      })
      uni.hideLoading()
      
      if (result.success) {
        // 如果来自预案，更新预案状态为已执行
        if (this.planId) {
          const { updatePlan } = require('@/utils/planApi.js')
          await updatePlan(this.planId, { 
            status: 'executed',
            mistakeId: result.data._id
          })
        }
        uni.showToast({ title: '记录成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      } else {
        uni.showToast({ title: result.error || '保存失败', icon: 'none' })
      }
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

.stock-search { position: relative; }
.search-box { position: relative; }
.input { height: 80rpx; background: #f8f8f8; border-radius: 12rpx; padding: 0 60rpx 0 24rpx; font-size: 28rpx; color: #333; width: 100%; box-sizing: border-box; }
.clear-btn { position: absolute; right: 20rpx; top: 50%; transform: translateY(-50%); font-size: 40rpx; color: #999; width: 40rpx; height: 40rpx; display: flex; align-items: center; justify-content: center; }
.search-results { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border-radius: 12rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1); margin-top: 10rpx; z-index: 100; max-height: 400rpx; overflow-y: auto; }
.result-item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f0f0f0; }
.result-item:last-child { border-bottom: none; }
.stock-info { display: flex; flex-direction: column; }
.stock-name { font-size: 30rpx; color: #333; font-weight: 500; }
.stock-code { font-size: 24rpx; color: #999; margin-top: 6rpx; }
.stock-ts { font-size: 24rpx; color: #666; }
.search-results.empty { padding: 40rpx; text-align: center; color: #999; font-size: 28rpx; }

.selected-stock { display: flex; justify-content: space-between; align-items: center; background: #f8f8f8; border-radius: 12rpx; padding: 20rpx 24rpx; margin-bottom: 24rpx; }
.selected-info { display: flex; flex-direction: column; }
.selected-name { font-size: 32rpx; color: #333; font-weight: 500; }
.selected-code { font-size: 24rpx; color: #999; margin-top: 6rpx; }
.change-btn { font-size: 26rpx; color: #e94560; padding: 10rpx 20rpx; }

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
.footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 30rpx; background: #fff; border-top: 1rpx solid #eee; }
.submit-btn { width: 100%; height: 90rpx; background: #e94560; color: #fff; font-size: 32rpx; border-radius: 45rpx; display: flex; align-items: center; justify-content: center; border: none; }
.submit-btn::after { border: none; }
</style>