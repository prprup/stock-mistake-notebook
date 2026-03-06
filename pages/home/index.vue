<template>
  <view class="container">
    <!-- 头部统计卡片 -->
    <view class="header-card">
      <view class="stat-row">
        <view class="stat-item">
          <text class="stat-num" :class="{ 'stat-empty': monthMistakes === 0 }">{{monthMistakes}}</text>
          <text class="stat-label">本月错题</text>
        </view>
        <view class="stat-item">
          <text class="stat-num" :class="{ 'stat-empty': totalMistakes === 0 }">{{totalMistakes}}</text>
          <text class="stat-label">累计错题</text>
        </view>
        <view class="stat-item">
          <text class="stat-num" :class="{ 'stat-empty': streakDays === 0 }">{{streakDays}}</text>
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
      <!-- 空状态 - 带插画和行动按钮 -->
      <view class="enemy-empty-card" v-else>
        <view class="empty-illustration">
          <view class="monster-icon">👾</view>
          <view class="shadow-line"></view>
        </view>
        <text class="empty-title">暂无头号敌人</text>
        <text class="empty-desc">快去记一笔，揪出亏损元凶</text>
        
        <view class="empty-action-btn" @click="goToManual">
          <text class="btn-icon">+</text>
          <text class="btn-text">记录第一笔交易</text>
        </view>
      </view>
    </view>

    <!-- 快速入口 -->
    <view class="section">
      <view class="section-title">快速记录</view>
      <view class="quick-actions">
        <view class="action-btn" @click="goToManual">
          <view class="action-icon-wrap">
            <text class="action-icon">✎</text>
          </view>
          <text class="action-text">手动录入</text>
        </view>
        <view class="action-btn" @click="goToOCR">
          <view class="action-icon-wrap">
            <text class="action-icon">📷</text>
          </view>
          <text class="action-text">截图识别</text>
        </view>
        <view class="action-btn" @click="goToPlan">
          <view class="action-icon-wrap">
            <text class="action-icon">📝</text>
          </view>
          <text class="action-text">交易预案</text>
        </view>
      </view>
    </view>

    <!-- 最近错题 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最近错题</text>
        <text class="more" @click="goToMistakes" v-if="recentMistakes.length > 0">查看全部 ></text>
      </view>
      
      <!-- 有数据时显示列表 -->
      <view class="mistake-list" v-if="recentMistakes.length > 0">
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
      
      <!-- 空状态 - 占位卡片 -->
      <view class="mistake-empty-placeholder" v-else @click="goToMistakes">
        <view class="placeholder-card">
          <view class="placeholder-lines">
            <view class="placeholder-line short"></view>
            <view class="placeholder-line long"></view>
          </view>
          <text class="placeholder-text">第一笔错题将显示在这里</text>
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
.container { padding: 24rpx; background: #F5F7FA; min-height: 100vh; }

/* 头部统计卡片 */
.header-card { 
  background: #FFFFFF; 
  border-radius: 24rpx; 
  padding: 48rpx 32rpx; 
  margin-bottom: 32rpx; 
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06); 
}
.stat-row { display: flex; justify-content: space-around; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-num { 
  font-size: 56rpx; 
  font-weight: 700; 
  color: #1E3A8A; 
  font-family: "DIN Alternate", "Roboto Mono", monospace;
  transition: color 0.3s;
}
/* 无数据时显示灰色 */
.stat-num.stat-empty {
  color: #9CA3AF;
  opacity: 0.6;
}
.stat-label { font-size: 24rpx; color: #6B7280; margin-top: 12rpx; }

/* 今日提醒 */
.tip-card { 
  background: #FFFFFF; 
  border-radius: 16rpx; 
  padding: 30rpx; 
  display: flex; 
  align-items: center; 
  margin-bottom: 32rpx; 
  box-shadow: 0 2rpx 16rpx rgba(30, 58, 138, 0.04);
  border-left: 8rpx solid #3B82F6; 
}
.tip-icon { font-size: 40rpx; margin-right: 20rpx; }
.tip-text { font-size: 28rpx; color: #374151; flex: 1; }

/* 区块样式 */
.section { margin-bottom: 32rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { 
  font-size: 32rpx; 
  font-weight: bold; 
  color: #1E3A8A; 
  margin-bottom: 20rpx; 
}
.more { font-size: 26rpx; color: #3B82F6; }

/* 头号敌人 - 有数据时 */
.enemy-card { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 48rpx; 
  text-align: center; 
  position: relative; 
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.enemy-rank { 
  position: absolute; 
  top: 24rpx; 
  right: 24rpx; 
  background: linear-gradient(135deg, #1E3A8A, #3B82F6); 
  color: #fff; 
  font-size: 22rpx; 
  padding: 8rpx 20rpx; 
  border-radius: 30rpx; 
  font-weight: 600;
}
.enemy-name { font-size: 48rpx; font-weight: bold; color: #111827; margin: 20rpx 0; }
.enemy-count { font-size: 28rpx; color: #DC2626; margin-bottom: 20rpx; font-weight: 600; }
.enemy-desc { font-size: 26rpx; color: #6B7280; line-height: 1.6; }

/* 头号敌人 - 空状态（带渐变背景） */
.enemy-empty-card { 
  background: linear-gradient(135deg, #F0F4FF, #F5F7FA); 
  border-radius: 24rpx; 
  padding: 60rpx 48rpx; 
  text-align: center;
  border: 1rpx solid #E0E7FF;
  position: relative;
  overflow: hidden;
}
.empty-illustration {
  position: relative;
  margin-bottom: 32rpx;
}
.monster-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
  opacity: 0.8;
}
.shadow-line {
  width: 60rpx;
  height: 8rpx;
  background: linear-gradient(90deg, transparent, #CBD5E1, transparent);
  border-radius: 4rpx;
  margin: 0 auto;
}
.empty-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1E3A8A;
  display: block;
  margin-bottom: 12rpx;
}
.empty-desc {
  font-size: 26rpx;
  color: #6B7280;
  display: block;
  margin-bottom: 32rpx;
}
/* 琥珀色行动按钮 */
.empty-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #fff;
  padding: 24rpx 48rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(245, 158, 11, 0.3);
  transition: transform 0.1s;
}
.empty-action-btn:active {
  transform: scale(0.98);
}
.btn-icon {
  font-size: 32rpx;
  font-weight: bold;
}
.btn-text {
  font-size: 28rpx;
}

/* 快速记录 */
.quick-actions { display: flex; gap: 20rpx; }
.action-btn { 
  flex: 1; 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  border-radius: 16rpx; 
  padding: 32rpx 20rpx; 
  display: flex; 
  flex-direction: column; 
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(30, 58, 138, 0.15);
  transition: transform 0.1s;
}
.action-btn:active { transform: scale(0.95); }
/* 图标白色圆形背景 */
.action-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}
.action-icon { 
  font-size: 32rpx; 
  color: #FFFFFF;
}
.action-text { font-size: 26rpx; color: #FFFFFF; font-weight: 500; }

/* 最近错题列表 - 有数据 */
.mistake-list { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.mistake-item { padding: 32rpx; border-bottom: 1rpx solid #F3F4F6; }
.mistake-item:last-child { border-bottom: none; }
.mistake-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.stock-name { font-size: 32rpx; font-weight: bold; color: #111827; }
.mistake-date { font-size: 24rpx; color: #9CA3AF; }
.mistake-types { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 16rpx; }
.type-tag { 
  background: #EFF6FF; 
  color: #1E3A8A; 
  font-size: 22rpx; 
  padding: 8rpx 16rpx; 
  border-radius: 8rpx;
  font-weight: 500;
}
.mistake-reflection { font-size: 26rpx; color: #6B7280; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

/* 最近错题 - 空状态占位卡片 */
.mistake-empty-placeholder {
  padding: 0;
}
.placeholder-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 48rpx;
  border: 2rpx dashed #E5E7EB;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.placeholder-lines {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
  width: 100%;
  max-width: 300rpx;
}
.placeholder-line {
  height: 16rpx;
  background: #F3F4F6;
  border-radius: 8rpx;
}
.placeholder-line.short {
  width: 40%;
}
.placeholder-line.long {
  width: 70%;
}
.placeholder-text {
  font-size: 26rpx;
  color: #9CA3AF;
}
</style>
