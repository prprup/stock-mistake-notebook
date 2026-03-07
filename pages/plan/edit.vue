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

      <view class="form-item">
        <text class="label">预案日期</text>
        <picker mode="date" :value="planDate" @change="onDateChange">
          <view class="picker">{{planDate}}</view>
        </picker>
      </view>
    </view>

    <view class="section">
      <view class="section-title">交易计划</view>
      
      <view class="form-item">
        <text class="label">目标价位 *</text>
        <input class="input" type="digit" placeholder="0.00" v-model="targetPrice" />
      </view>

      <view class="form-row">
        <view class="form-item half">
          <text class="label">止损价位</text>
          <input class="input" type="digit" placeholder="0.00" v-model="stopLoss" />
        </view>
        <view class="form-item half">
          <text class="label">止盈价位</text>
          <input class="input" type="digit" placeholder="0.00" v-model="takeProfit" />
        </view>
      </view>

      <view class="form-item">
        <text class="label">计划仓位 (%)</text>
        <slider class="position-slider" :value="position" @change="onPositionChange" min="0" max="100" show-value />
      </view>

      <view class="form-item">
        <text class="label">触发条件</text>
        <input class="input" placeholder="如：开盘跌破5日线" v-model="triggerCondition" />
      </view>
    </view>

    <view class="section">
      <view class="section-title">交易理由</view>
      <textarea class="textarea" placeholder="为什么计划这笔交易？基于什么分析？" v-model="reason" maxlength="300" />
      <view class="char-count">{{reason.length}}/300</view>
    </view>

    <view class="footer">
      <button class="submit-btn" @click="submit">{{isEdit ? '保存修改' : '创建预案'}}</button>
    </view>
  </view>
</template>

<script>
import { searchStock } from '@/utils/klineApi.js'
import { addPlan, getPlanDetail, updatePlan } from '@/utils/planApi.js'

export default {
  data() {
    return {
      planId: '',
      isEdit: false,
      stockSearchKey: '',
      searchResults: [],
      showSearchResults: false,
      selectedStock: { name: '', tsCode: '', symbol: '' },
      action: 'buy',
      planDate: '',
      targetPrice: '',
      stopLoss: '',
      takeProfit: '',
      position: 0,
      triggerCondition: '',
      reason: '',
      searchTimer: null
    }
  },
  onLoad(options) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    this.planDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
    
    if (options.id) {
      this.planId = options.id
      this.isEdit = true
      this.loadPlanDetail()
    }
  },
  onUnload() {
    // 清除搜索定时器，防止内存泄漏
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
      this.searchTimer = null
    }
  },
  methods: {
    async loadPlanDetail() {
      uni.showLoading({ title: '加载中' })
      const result = await getPlanDetail(this.planId)
      uni.hideLoading()
      
      if (result.success) {
        const data = result.data
        this.selectedStock = { name: data.stockName, tsCode: data.stockCode, symbol: '' }
        this.stockSearchKey = data.stockName
        this.action = data.action
        this.planDate = data.date
        this.targetPrice = String(data.targetPrice || '')
        this.stopLoss = String(data.stopLoss || '')
        this.takeProfit = String(data.takeProfit || '')
        this.position = data.position || 0
        this.triggerCondition = data.triggerCondition || ''
        this.reason = data.reason || ''
      } else {
        uni.showToast({ title: result.error || '加载失败', icon: 'none' })
      }
    },
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
    onDateChange(e) {
      this.planDate = e.detail.value
    },
    onPositionChange(e) {
      this.position = e.detail.value
    },
    async submit() {
      if (!this.selectedStock.tsCode) {
        uni.showToast({ title: '请选择股票', icon: 'none' })
        return
      }
      if (!this.targetPrice) {
        uni.showToast({ title: '请输入目标价位', icon: 'none' })
        return
      }
      
      const data = {
        stockName: this.selectedStock.name,
        stockCode: this.selectedStock.tsCode,
        action: this.action,
        date: this.planDate,
        targetPrice: parseFloat(this.targetPrice),
        stopLoss: this.stopLoss ? parseFloat(this.stopLoss) : null,
        takeProfit: this.takeProfit ? parseFloat(this.takeProfit) : null,
        position: this.position,
        triggerCondition: this.triggerCondition,
        reason: this.reason
      }
      
      uni.showLoading({ title: this.isEdit ? '保存中' : '创建中' })
      const result = this.isEdit ? await updatePlan(this.planId, data) : await addPlan(data)
      uni.hideLoading()
      
      if (result.success) {
        uni.showToast({ title: this.isEdit ? '保存成功' : '创建成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      } else {
        uni.showToast({ title: result.error || '操作失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.container { padding: 24rpx 24rpx 160rpx; background: #F5F7FA; min-height: 100vh; }
.section { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 32rpx; 
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.section-title { 
  font-size: 30rpx; 
  font-weight: bold; 
  color: #1E3A8A; 
  margin-bottom: 28rpx; 
}
.form-item { margin-bottom: 28rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-row { display: flex; gap: 20rpx; }
.form-row .form-item { flex: 1; }
.label { display: block; font-size: 26rpx; color: #6B7280; margin-bottom: 12rpx; }

.stock-search { position: relative; }
.search-box { position: relative; }
.input { 
  height: 88rpx; 
  background: #F5F7FA; 
  border-radius: 12rpx; 
  padding: 0 60rpx 0 24rpx; 
  font-size: 28rpx; 
  color: #111827; 
  width: 100%; 
  box-sizing: border-box;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.clear-btn { 
  position: absolute; 
  right: 20rpx; 
  top: 50%; 
  transform: translateY(-50%); 
  font-size: 40rpx; 
  color: #9CA3AF; 
  width: 40rpx; 
  height: 40rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
.search-results { 
  position: absolute; 
  top: 100%; 
  left: 0; 
  right: 0; 
  background: #FFFFFF; 
  border-radius: 12rpx; 
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1); 
  margin-top: 10rpx; 
  z-index: 100; 
  max-height: 400rpx; 
  overflow-y: auto;
  border: 1rpx solid #E5E7EB;
}
.result-item { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 24rpx; 
  border-bottom: 1rpx solid #F3F4F6; 
}
.result-item:last-child { border-bottom: none; }
.stock-info { display: flex; flex-direction: column; }
.stock-name { font-size: 30rpx; color: #111827; font-weight: 500; }
.stock-code { font-size: 24rpx; color: #9CA3AF; margin-top: 6rpx; }
.stock-ts { 
  font-size: 24rpx; 
  color: #6B7280;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.search-results.empty { padding: 40rpx; text-align: center; color: #9CA3AF; font-size: 28rpx; }

.selected-stock { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background: #EFF6FF; 
  border-radius: 12rpx; 
  padding: 24rpx; 
  margin-bottom: 24rpx;
  border: 1rpx solid #DBEAFE;
}
.selected-info { display: flex; flex-direction: column; }
.selected-name { font-size: 32rpx; color: #111827; font-weight: 500; }
.selected-code { 
  font-size: 24rpx; 
  color: #1E3A8A; 
  margin-top: 6rpx;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.change-btn { 
  font-size: 26rpx; 
  color: #3B82F6; 
  padding: 10rpx 20rpx;
  font-weight: 500;
}

.picker { 
  height: 88rpx; 
  background: #F5F7FA; 
  border-radius: 12rpx; 
  padding: 0 24rpx; 
  font-size: 28rpx; 
  color: #111827; 
  line-height: 88rpx; 
}
.radio-group { display: flex; gap: 20rpx; }
.radio { 
  flex: 1; 
  height: 88rpx; 
  background: #F5F7FA; 
  border-radius: 12rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 28rpx; 
  color: #6B7280; 
  transition: all 0.2s;
}
.radio.active { 
  background: #1E3A8A; 
  color: #fff;
  font-weight: 500;
}

.position-slider { margin: 20rpx 0; }

.textarea { 
  width: 100%; 
  height: 200rpx; 
  background: #F5F7FA; 
  border-radius: 12rpx; 
  padding: 24rpx; 
  font-size: 28rpx; 
  color: #111827; 
  box-sizing: border-box; 
}
.char-count { text-align: right; font-size: 24rpx; color: #9CA3AF; margin-top: 12rpx; }
.footer { 
  position: fixed; 
  bottom: 0; 
  left: 0; 
  right: 0; 
  padding: 24rpx 30rpx; 
  background: #FFFFFF;
  border-top: 1rpx solid #E5E7EB;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.04);
}
.submit-btn { 
  width: 100%; 
  height: 96rpx; 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  color: #fff; 
  font-size: 32rpx; 
  border-radius: 48rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  border: none;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(30, 58, 138, 0.2);
}
.submit-btn::after { border: none; }
</style>
