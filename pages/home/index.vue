<template>
  <view class="container">
    <!-- 头部统计卡片 -->
    <view class="header-card">
      <view class="stat-row">
        <view class="stat-item">
          <text class="stat-num">{{monthMistakes}}</text>
          <text class="stat-label">本月错题</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{totalMistakes}}</text>
          <text class="stat-label">累计错题</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{streakDays}}</text>
          <text class="stat-label">连续记录</text>
        </view>
      </view>
    </view>

    <!-- 今日提醒 -->
    <view class="section" v-if="todayTip">
      <view class="tip-card">
        <text class="tip-icon">💡</text>
        <text class="tip-text">{{todayTip}}</text>
      </view>
    </view>

    <!-- 最常犯的错误 -->
    <view class="section">
      <view class="section-title">你的头号敌人</view>
      <view class="enemy-card" v-if="topMistake">
        <view class="enemy-rank">TOP 1</view>
        <view class="enemy-name">{{topMistake.name}}</view>
        <view class="enemy-count">本月犯了 {{topMistake.count}} 次</view>
        <view class="enemy-desc">{{topMistake.description}}</view>
      </view>
      <view class="empty-card" v-else>
        <text>还没有记录，快去记一笔吧</text>
      </view>
    </view>

    <!-- 快速入口 -->
    <view class="section">
      <view class="section-title">快速记录</view>
      <view class="quick-actions">
        <view class="action-btn" @click="goToManual">
          <text class="action-icon">✏️</text>
          <text class="action-text">手动录入</text>
        </view>
        <view class="action-btn" @click="goToOCR">
          <text class="action-icon">📷</text>
          <text class="action-text">截图识别</text>
        </view>
        <view class="action-btn" @click="goToPlan">
          <text class="action-icon">📝</text>
          <text class="action-text">交易预案</text>
        </view>
      </view>
    </view>

    <!-- 最近错题 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最近错题</text>
        <text class="more" @click="goToMistakes">查看全部 ></text>
      </view>
      <view class="mistake-list">
        <view class="mistake-item" v-for="item in recentMistakes" :key="item._id" @click="goToDetail(item._id)">
          <view class="mistake-header">
            <text class="stock-name">{{item.stockName}}</text>
            <text class="mistake-date">{{item.formattedDate}}</text>
          </view>
          <view class="mistake-types">
            <text class="type-tag" v-for="(type, index) in item.mistakeTypes" :key="index">{{type}}</text>
          </view>
          <view class="mistake-reflection" v-if="item.reflection">
            {{item.reflection}}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { login, checkLogin, getUserInfo } from '@/utils/auth.js'
import { getHomeStats } from '@/utils/homeApi.js'

export default {
  data() {
    return {
      monthMistakes: 0,
      totalMistakes: 0,
      streakDays: 0,
      todayTip: '',
      topMistake: null,
      recentMistakes: [],
      isLogin: false,
      userInfo: null
    }
  },
  onLoad() {
    this.checkLoginStatus()
    this.loadData()
  },
  onShow() {
    this.loadData()
  },
  methods: {
    async checkLoginStatus() {
      if (checkLogin()) {
        this.isLogin = true
        this.userInfo = getUserInfo()
      } else {
        // 未登录，自动调用登录
        const result = await login()
        if (result.success) {
          this.isLogin = true
          this.userInfo = result.data
        }
      }
    },
    async loadData() {
      uni.showLoading({ title: '加载中' })
      
      const result = await getHomeStats()
      
      uni.hideLoading()
      
      if (result.success) {
        const data = result.data
        this.monthMistakes = data.monthMistakes
        this.totalMistakes = data.totalMistakes
        this.streakDays = data.streakDays
        this.todayTip = data.todayTip
        this.topMistake = data.topMistake
        this.recentMistakes = data.recentMistakes
      } else {
        uni.showToast({ title: result.error || '加载失败', icon: 'none' })
      }
    },
    goToManual() {
      uni.navigateTo({ url: '/pages/record/manual' })
    },
    goToOCR() {
      uni.navigateTo({ url: '/pages/record/ocr' })
    },
    goToPlan() {
      uni.navigateTo({ url: '/pages/plan/plan' })
    },
    goToMistakes() {
      uni.switchTab({ url: '/pages/mistakes/mistakes' })
    },
    goToDetail(id) {
      uni.navigateTo({ url: `/pages/mistakes/detail?id=${id}` })
    }
  }
}
</script>

<style scoped>
.container { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }
.header-card { background: #fff; border-radius: 20rpx; padding: 40rpx 30rpx; margin-bottom: 30rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.stat-row { display: flex; justify-content: space-around; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 56rpx; font-weight: bold; color: #e94560; }
.stat-label { font-size: 24rpx; color: #666; margin-top: 10rpx; }
.tip-card { background: #fff; border-radius: 16rpx; padding: 30rpx; display: flex; align-items: center; margin-bottom: 30rpx; border-left: 8rpx solid #e94560; }
.tip-icon { font-size: 40rpx; margin-right: 20rpx; }
.tip-text { font-size: 28rpx; color: #333; flex: 1; }
.section { margin-bottom: 30rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.more { font-size: 26rpx; color: #e94560; }
.enemy-card { background: #fff; border-radius: 16rpx; padding: 40rpx; text-align: center; position: relative; overflow: hidden; }
.enemy-rank { position: absolute; top: 20rpx; right: 20rpx; background: #e94560; color: #fff; font-size: 24rpx; padding: 8rpx 20rpx; border-radius: 30rpx; }
.enemy-name { font-size: 48rpx; font-weight: bold; color: #333; margin: 20rpx 0; }
.enemy-count { font-size: 28rpx; color: #e94560; margin-bottom: 20rpx; }
.enemy-desc { font-size: 26rpx; color: #666; line-height: 1.6; }
.empty-card { background: #fff; border-radius: 16rpx; padding: 60rpx; text-align: center; color: #999; font-size: 28rpx; }
.quick-actions { display: flex; gap: 16rpx; }
.action-btn { flex: 1; background: #fff; border-radius: 16rpx; padding: 30rpx; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05); }
.action-icon { font-size: 48rpx; margin-bottom: 12rpx; }
.action-text { font-size: 26rpx; color: #333; }
.mistake-list { background: #fff; border-radius: 16rpx; overflow: hidden; }
.mistake-item { padding: 30rpx; border-bottom: 1rpx solid #f0f0f0; }
.mistake-item:last-child { border-bottom: none; }
.mistake-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.stock-name { font-size: 32rpx; font-weight: bold; color: #333; }
.mistake-date { font-size: 24rpx; color: #999; }
.mistake-types { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 16rpx; }
.type-tag { background: #ffe5e5; color: #e94560; font-size: 22rpx; padding: 8rpx 16rpx; border-radius: 8rpx; }
.mistake-reflection { font-size: 26rpx; color: #666; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
</style>
