<template>
  <view class="container">
    <!-- 用户信息 -->
    <view class="user-card">
      <view class="avatar">👤</view>
      <view class="user-info">
        <text class="nickname">{{user.nickname || '未登录'}}</text>
        <text class="user-id">ID: {{user.id || '--'}}</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{stats.mistakes}}</text>
        <text class="stat-label">错题记录</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{stats.public}}</text>
        <text class="stat-label">公开分享</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{stats.likes}}</text>
        <text class="stat-label">获赞</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToAnalysis">
        <text class="menu-icon">📊</text>
        <text class="menu-text">统计分析</text>
        <text class="arrow">></text>
      </view>
      
      <view class="menu-item" @click="exportData">
        <text class="menu-icon">📥</text>
        <text class="menu-text">导出数据</text>
        <text class="arrow">></text>
      </view>
      
      <view class="menu-item" @click="clearCache">
        <text class="menu-icon">🗑️</text>
        <text class="menu-text">清除缓存</text>
        <text class="arrow">></text>
      </view>
      
      <view class="menu-item" @click="about">
        <text class="menu-icon">ℹ️</text>
        <text class="menu-text">关于</text>
        <text class="arrow">></text>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version">版本 1.0.0</view>
  </view>
</template>

<script>
import { getUserStats } from '@/utils/userApi.js'

export default {
  data() {
    return {
      user: {
        nickname: '',
        id: '',
        avatarUrl: ''
      },
      stats: {
        mistakes: 0,
        public: 0,
        likes: 0
      }
    }
  },
  onLoad() {
    this.loadUserData()
  },
  onShow() {
    this.loadUserData()
  },
  methods: {
    async loadUserData() {
      uni.showLoading({ title: '加载中...' })
      const res = await getUserStats()
      uni.hideLoading()

      if (res.success) {
        this.user = res.data.user || { nickname: '微信用户', id: '' }
        this.stats = res.data.stats || { mistakes: 0, public: 0, likes: 0 }
      } else {
        // 加载失败使用默认值
        this.user = { nickname: '微信用户', id: '' }
        this.stats = { mistakes: 0, public: 0, likes: 0 }
      }
    },
    goToAnalysis() {
      uni.navigateTo({ url: '/pages/analysis/analysis' })
    },
    exportData() {
      uni.showToast({ title: '导出功能开发中', icon: 'none' })
    },
    clearCache() {
      uni.showModal({
        title: '清除缓存',
        content: '确定要清除所有缓存数据吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({ title: '已清除', icon: 'success' })
          }
        }
      })
    },
    about() {
      uni.showModal({
        title: '关于股海生涯',
        content: 'A股投资者的错题本，记录错误，避免重复犯错。',
        showCancel: false
      })
    }
  }
}
</script>

<style scoped>
.container { background: #F5F7FA; min-height: 100vh; padding-bottom: 40rpx; }
.user-card { 
  background: #FFFFFF; 
  padding: 60rpx 40rpx; 
  display: flex; 
  align-items: center; 
  gap: 30rpx; 
  margin: 24rpx 30rpx 30rpx; 
  border-radius: 24rpx; 
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}
.avatar { 
  width: 120rpx; 
  height: 120rpx; 
  background: linear-gradient(135deg, #EFF6FF, #DBEAFE); 
  border-radius: 60rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 60rpx;
  border: 2rpx solid #DBEAFE;
}
.user-info { flex: 1; }
.nickname { 
  font-size: 40rpx; 
  font-weight: bold; 
  color: #111827; 
  display: block; 
}
.user-id { 
  font-size: 26rpx; 
  color: #6B7280; 
  margin-top: 10rpx; 
  display: block;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.stats-card { 
  background: #FFFFFF; 
  border-radius: 24rpx; 
  margin: 0 30rpx 30rpx; 
  padding: 40rpx; 
  display: flex;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}
.stat-item { flex: 1; text-align: center; }
.stat-value { 
  font-size: 40rpx; 
  font-weight: 700; 
  color: #1E3A8A; 
  display: block;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.stat-label { font-size: 24rpx; color: #6B7280; margin-top: 10rpx; display: block; }
.menu-list { 
  background: #FFFFFF; 
  border-radius: 24rpx; 
  margin: 0 30rpx; 
  overflow: hidden;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}
.menu-item { 
  display: flex; 
  align-items: center; 
  padding: 32rpx; 
  border-bottom: 1rpx solid #F3F4F6; 
}
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 40rpx; margin-right: 20rpx; }
.menu-text { flex: 1; font-size: 30rpx; color: #111827; font-weight: 500; }
.arrow { font-size: 28rpx; color: #D1D5DB; }
.version { text-align: center; font-size: 24rpx; color: #9CA3AF; margin-top: 60rpx; }
</style>
