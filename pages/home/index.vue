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
.container { padding: 20rpx; background: #F5F7FA; min-height: 100vh; }

/* 头部统计卡片 - 卡片式设计 */
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

/* 头号敌人卡片 */
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
.empty-card { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 80rpx; 
  text-align: center; 
  color: #9CA3AF; 
  font-size: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}

/* 快速记录 */
.quick-actions { display: flex; gap: 20rpx; }
.action-btn { 
  flex: 1; 
  background: linear-gradient(135deg, #3B82F6, #1E3A8A); 
  border-radius: 16rpx; 
  padding: 36rpx 24rpx; 
  display: flex; 
  flex-direction: column; 
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(30, 58, 138, 0.15);
  transition: transform 0.1s;
}
.action-btn:active { transform: scale(0.95); }
.action-icon { font-size: 44rpx; margin-bottom: 12rpx; }
.action-text { font-size: 26rpx; color: #FFFFFF; font-weight: 500; }

/* 最近错题列表 */
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
</style>
