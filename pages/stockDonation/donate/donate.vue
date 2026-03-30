<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input" @click="showSearch = true">
        <text class="search-icon">🔍</text>
        <text class="search-placeholder" v-if="!selectedStock">搜索A股股票</text>
        <text class="search-value" v-else>{{selectedStock.name}} ({{selectedStock.code}})</text>
      </view>
    </view>

    <!-- 搜索弹窗 -->
    <view class="search-modal" v-if="showSearch" @click.self="showSearch = false">
      <view class="search-content">
        <view class="search-header">
          <input class="search-field" v-model="searchKeyword" placeholder="输入股票代码或名称" @input="onSearch" focus />
          <text class="search-cancel" @click="showSearch = false">取消</text>
        </view>
        <view class="search-results">
          <view class="stock-item" v-for="(stock, index) in stockList" :key="index" @click="selectStock(stock)">
            <view class="stock-info">
              <text class="stock-name">{{stock.name}}</text>
              <text class="stock-code">{{stock.code}} · {{stock.market}}</text>
            </view>
          </view>
          <view class="search-empty" v-if="searchKeyword && stockList.length === 0 && !searching">
            <text>未找到相关股票</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 打赏金额选择 -->
    <view class="amount-section" v-if="selectedStock">
      <view class="section-title">打赏积分</view>
      <view class="amount-grid">
        <view class="amount-item" v-for="amount in amountOptions" :key="amount"
          :class="{ active: selectedAmount === amount }" @click="selectedAmount = amount">
          <text class="amount-num">{{amount}}</text>
          <text class="amount-label">积分</text>
        </view>
      </view>
    </view>

    <!-- 打赏留言 -->
    <view class="message-section" v-if="selectedStock">
      <view class="section-title">打赏留言（选填）</view>
      <textarea class="message-input" v-model="message" placeholder="说点什么..." maxlength="100" />
    </view>

    <!-- 当前积分 -->
    <view class="points-info" v-if="selectedStock">
      <text>当前积分：<text class="points-num">{{userPoints}}</text></text>
    </view>

    <!-- 底部按钮 -->
    <view class="footer" v-if="selectedStock">
      <button class="footer-btn" @click="submitDonate" :disabled="submitting">
        {{submitting ? '打赏中...' : '确认打赏'}}
      </button>
    </view>
  </view>
</template>

<script>
import { searchStocks, donateToStock } from '@/utils/donationApi.js'
import { getPoints } from '@/utils/pointsApi.js'

export default {
  data() {
    return {
      showSearch: false,
      searchKeyword: '',
      stockList: [],
      searching: false,
      selectedStock: null,
      selectedAmount: 10,
      amountOptions: [5, 10, 20, 50, 100],
      message: '',
      userPoints: 0,
      submitting: false
    }
  },
  onLoad() {
    this.loadUserPoints()
  },
  methods: {
    async loadUserPoints() {
      const res = await getPoints()
      if (res.code === 0) {
        this.userPoints = res.data.points || 0
      }
    },

    async onSearch() {
      if (!this.searchKeyword.trim()) {
        this.stockList = []
        return
      }
      this.searching = true
      try {
        const res = await searchStocks(this.searchKeyword.trim())
        if (res.code === 0) {
          this.stockList = res.data || []
        }
      } catch (err) {
        console.error('搜索失败:', err)
      } finally {
        this.searching = false
      }
    },

    selectStock(stock) {
      this.selectedStock = stock
      this.showSearch = false
    },

    async submitDonate() {
      if (!this.selectedStock) {
        uni.showToast({ title: '请选择股票', icon: 'none' })
        return
      }
      if (this.selectedAmount > this.userPoints) {
        uni.showToast({ title: '积分不足', icon: 'none' })
        return
      }

      this.submitting = true
      try {
        const res = await donateToStock({
          stockCode: this.selectedStock.code,
          stockName: this.selectedStock.name,
          stockMarket: this.selectedStock.market,
          points: this.selectedAmount,
          message: this.message
        })

        if (res.code === 0) {
          uni.showToast({ title: '打赏成功', icon: 'success' })
          this.userPoints = res.data.remainingPoints ?? res.data.points ?? this.userPoints
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({ title: res.message || '打赏失败', icon: 'none' })
        }
      } catch (err) {
        console.error('打赏失败:', err)
        uni.showToast({ title: '打赏失败', icon: 'none' })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 140rpx;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 30rpx;
}

.search-input {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.search-placeholder {
  font-size: 28rpx;
  color: #999;
}

.search-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 搜索弹窗 */
.search-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
}

.search-content {
  background: #fff;
  height: 80vh;
  border-radius: 0 0 24rpx 24rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-field {
  flex: 1;
  font-size: 28rpx;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.search-cancel {
  font-size: 28rpx;
  color: #667eea;
  margin-left: 20rpx;
  white-space: nowrap;
}

.search-results {
  flex: 1;
  overflow-y: auto;
}

.stock-item {
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.stock-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.stock-code {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.search-empty {
  text-align: center;
  padding: 60rpx;
  color: #999;
  font-size: 28rpx;
}

/* 金额选择 */
.amount-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.amount-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.amount-item {
  width: calc(33.33% - 14rpx);
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
  border: 2rpx solid transparent;
}

.amount-item.active {
  border-color: #667eea;
  background: #f0f0ff;
}

.amount-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.amount-item.active .amount-num {
  color: #667eea;
}

.amount-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 留言 */
.message-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.message-input {
  width: 100%;
  height: 160rpx;
  font-size: 28rpx;
  padding: 16rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  box-sizing: border-box;
}

/* 积分信息 */
.points-info {
  text-align: center;
  padding: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.points-num {
  color: #e94560;
  font-weight: bold;
  font-size: 36rpx;
}

/* 底部按钮 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
}

.footer-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-align: center;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  border: none;
  line-height: 1.5;
}

.footer-btn[disabled] {
  opacity: 0.6;
}
</style>
