
<template>
  <view class="container">
    <!-- 用户信息 -->
    <view class="user-card">
      <view class="avatar" :class="{ 'avatar-login': !isLogin }" @click="handleAvatarClick">
        <text v-if="!user.avatarUrl">👤</text>
        <image v-else :src="user.avatarUrl" class="avatar-img" mode="aspectFill" />
      </view>
      <view class="user-info">
        <view class="nickname-wrap">
          <text class="nickname">{{user.nickname || '微信用户'}}</text>
          <text class="badge" v-if="isLogin">LV.1</text>
        </view>
        <text class="user-id" v-if="isLogin">ID: {{user.id || '--'}}</text>
        <view class="login-btn" v-else @click="handleLogin">
          <text class="login-text">点击登录</text>
          <text class="login-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-card">
      <view class="stat-item" @click="goToMistakes">
        <text class="stat-value" :class="{ 'stat-zero': stats.mistakes === 0 }">
          {{stats.mistakes > 0 ? stats.mistakes : '--'}}
        </text>
        <text class="stat-label">错题记录</text>
      </view>
      <view class="stat-item">
        <text class="stat-value" :class="{ 'stat-zero': stats.streak === 0 }">
          {{stats.streak > 0 ? stats.streak : '--'}}
        </text>
        <text class="stat-label">连续打卡</text>
        <text class="stat-unit">天</text>
      </view>
      <view class="stat-item">
        <text class="stat-value stat-zero">--</text>
        <text class="stat-label">胜率趋势</text>
        <text class="stat-unit">%</text>
      </view>
    </view>

    <!-- 功能列表 - 数据资产组 -->
    <view class="menu-section">
      <text class="menu-section-title">数据资产</text>
      <view class="menu-list">
        <view class="menu-item primary" @click="goToAnalysis">
          <view class="menu-icon-wrap">
            <text class="menu-icon">📈</text>
          </view>
          <text class="menu-text">统计分析</text>
          <text class="arrow">›</text>
        </view>
        
        <view class="menu-item" @click="exportData">
          <view class="menu-icon-wrap">
            <text class="menu-icon">☁️</text>
          </view>
          <text class="menu-text">导出数据</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 功能列表 - 系统设置组 -->
    <view class="menu-section">
      <text class="menu-section-title">系统设置</text>
      <view class="menu-list">
        <view class="menu-item" @click="clearCache">
          <view class="menu-icon-wrap">
            <text class="menu-icon">🧹</text>
          </view>
          <text class="menu-text">清除缓存</text>
          <text class="arrow">›</text>
        </view>
        
        <view class="menu-item" @click="about">
          <view class="menu-icon-wrap">
            <text class="menu-icon">❓</text>
          </view>
          <text class="menu-text">关于</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version">版本 1.0.0</view>
  </view>
</template>

<script>
import { getUserStats } from '@/utils/userApi.js'
import { checkLogin, login, getUserInfo } from '@/utils/auth.js'

export default {
  data() {
    return {
      isLogin: false,
      user: {
        nickname: '',
        id: '',
        avatarUrl: ''
      },
      stats: {
        mistakes: 0,
        streak: 0
      }
    }
  },
  onLoad() {
    this.checkLoginStatus()
    this.loadUserData()
  },
  onShow() {
    this.checkLoginStatus()
    this.loadUserData()
  },
  methods: {
    checkLoginStatus() {
      this.isLogin = checkLogin()
      if (this.isLogin) {
        const userInfo = getUserInfo()
        if (userInfo) {
          this.user = userInfo
        }
      }
    },
    async loadUserData() {
      uni.showLoading({ title: '加载中...' })
      const res = await getUserStats()
      uni.hideLoading()

      if (res.success) {
        this.user = res.data.user || { nickname: '微信用户', id: '', avatarUrl: '' }
        this.stats = res.data.stats || { mistakes: 0, streak: 0 }
      } else {
        // 加载失败使用默认值
        this.user = { nickname: '微信用户', id: '', avatarUrl: '' }
        this.stats = { mistakes: 0, streak: 0 }
      }
    },
    async handleLogin() {
      const result = await login()
      if (result.success) {
        this.isLogin = true
        this.user = result.data
        uni.showToast({ title: '登录成功', icon: 'success' })
        this.loadUserData()
      } else {
        uni.showToast({ title: '登录失败', icon: 'none' })
      }
    },
    handleAvatarClick() {
      if (!this.isLogin) {
        this.handleLogin()
      }
    },
    goToAnalysis() {
      uni.navigateTo({ url: '/pages/analysis/analysis' })
    },
    goToMistakes() {
      uni.switchTab({ url: '/pages/mistakes/mistakes' })
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

/* 用户信息卡 - 渐变背景 */
.user-card { 
  background: linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%);
  padding: 48rpx 40rpx; 
  display: flex; 
  align-items: center; 
  gap: 30rpx; 
  margin: 24rpx 30rpx 24rpx; 
  border-radius: 20rpx; 
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
  border: 1rpx solid #E0E7FF;
}

/* 头像 */
.avatar { 
  width: 120rpx; 
  height: 120rpx; 
  background: linear-gradient(135deg, #DBEAFE, #EFF6FF); 
  border-radius: 60rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 60rpx;
  border: 2rpx solid #DBEAFE;
  overflow: hidden;
}
.avatar-login {
  border: 2rpx dashed #CBD5E1;
  background: #F8FAFC;
}
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 60rpx;
}

.user-info { flex: 1; }

/* 昵称和徽章 */
.nickname-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.nickname { 
  font-size: 36rpx; 
  font-weight: bold; 
  color: #111827; 
}
.badge {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-weight: 500;
}

/* 用户ID */
.user-id { 
  font-size: 26rpx; 
  color: #6B7280; 
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}

/* 登录按钮 */
.login-btn {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  margin-top: 8rpx;
}
.login-text {
  font-size: 24rpx;
  font-weight: 500;
}
.login-arrow {
  font-size: 28rpx;
  font-weight: bold;
}

/* 统计数据卡 */
.stats-card { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  margin: 0 30rpx 24rpx; 
  padding: 40rpx 32rpx; 
  display: flex;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}
.stat-item { 
  flex: 1; 
  text-align: center;
  position: relative;
}
.stat-value { 
  font-size: 40rpx; 
  font-weight: 700; 
  color: #1E3A8A; 
  display: block;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
  margin-bottom: 8rpx;
}
.stat-value.stat-zero {
  color: #CBD5E1;
  font-weight: 300;
}
.stat-label { 
  font-size: 24rpx; 
  color: #6B7280; 
  display: block;
}
.stat-unit {
  font-size: 20rpx;
  color: #9CA3AF;
  position: absolute;
  right: 20rpx;
  top: 8rpx;
}

/* 功能分组 */
.menu-section {
  margin: 0 30rpx 24rpx;
}
.menu-section-title {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 16rpx;
  padding-left: 16rpx;
}

/* 功能列表 */
.menu-list { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  overflow: hidden;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}
.menu-item { 
  display: flex; 
  align-items: center; 
  padding: 32rpx; 
  position: relative;
}
.menu-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 96rpx;
  right: 0;
  bottom: 0;
  height: 1rpx;
  background: #F3F4F6;
}

/* 图标 */
.menu-icon-wrap {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}
.menu-icon { 
  font-size: 32rpx; 
  opacity: 0.7;
}
.menu-item.primary .menu-icon {
  opacity: 1;
}

.menu-text { 
  flex: 1; 
  font-size: 30rpx; 
  color: #111827; 
  font-weight: 500; 
}
.menu-item.primary .menu-text {
  color: #1E3A8A;
}

.arrow { 
  font-size: 32rpx; 
  color: #D1D5DB;
  font-weight: 300;
}

/* 版本信息 */
.version { 
  text-align: center; 
  font-size: 24rpx; 
  color: #9CA3AF; 
  margin-top: 48rpx; 
}
</style>
