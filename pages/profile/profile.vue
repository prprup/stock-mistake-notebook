<template>
  <view class="container">
    <!-- 用户信息 -->
    <view class="user-card">
      <view class="avatar" :class="{ 'avatar-login': !isLogin }" @click="handleAvatarClick">
        <text v-if="!user.avatarUrl" class="avatar-placeholder">{{isLogin ? '👤' : '📷'}}</text>
        <image v-else :src="user.avatarUrl" class="avatar-img" mode="aspectFill" />
      </view>
      <view class="user-info">
        <view class="nickname-wrap">
          <text class="nickname">{{user.nickname || '微信用户'}}</text>
          <text class="badge" v-if="isLogin">LV.1</text>
        </view>
        <view v-if="isLogin">
          <text class="user-id">ID: {{user.id || '--'}}</text>
        </view>
        <view v-else class="login-area">
          <view class="login-btn-outline" @click="handleLogin">
            <text class="login-text">点击登录</text>
          </view>
          <text class="login-hint">登录后同步数据，永不丢失</text>
        </view>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-card">
      <view class="stat-item" @click="goToMistakes">
        <text class="stat-value" :class="{ 'stat-zero': stats.mistakes === 0 }">
          {{stats.mistakes}}
        </text>
        <text class="stat-unit">条</text>
        <text class="stat-label">错题记录</text>
      </view>
      <view class="stat-item">
        <text class="stat-value" :class="{ 'stat-zero': stats.streak === 0 }">
          {{stats.streak}}
        </text>
        <text class="stat-unit">天</text>
        <text class="stat-label">连续打卡</text>
      </view>
      <view class="stat-item">
        <text class="stat-value stat-zero">0</text>
        <text class="stat-unit">%</text>
        <text class="stat-label">胜率趋势</text>
      </view>
    </view>

    <!-- 功能列表 - 数据资产组 -->
    <view class="menu-section">
      <view class="section-title-wrap">
        <view class="section-accent"></view>
        <text class="menu-section-title">数据资产</text>
      </view>
      <view class="menu-list">
        <view class="menu-item" @click="goToAnalysis">
          <view class="menu-icon-wrap">
            <text class="menu-icon gray">⚡</text>
          </view>
          <text class="menu-text">统计分析</text>
          <text class="arrow">›</text>
        </view>
        
        <view class="menu-item" @click="exportData">
          <view class="menu-icon-wrap">
            <text class="menu-icon gray">☁</text>
          </view>
          <text class="menu-text">导出数据</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 功能列表 - 系统设置组 -->
    <view class="menu-section">
      <view class="section-title-wrap">
        <view class="section-accent"></view>
        <text class="menu-section-title">系统设置</text>
      </view>
      <view class="menu-list">
        <view class="menu-item" @click="clearCache">
          <view class="menu-icon-wrap">
            <text class="menu-icon gray">✧</text>
          </view>
          <text class="menu-text">清除缓存</text>
          <text class="arrow">›</text>
        </view>
        
        <view class="menu-item" @click="about">
          <view class="menu-icon-wrap">
            <text class="menu-icon gray">?</text>
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
import { checkLogin, login, getUserInfo, updateUserInfo } from '@/utils/auth.js'

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
        return
      }
      this.chooseAndUploadAvatar()
    },
    chooseAndUploadAvatar() {
      uni.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath
          this.uploadAvatar(tempFilePath)
        }
      })
    },
    async uploadAvatar(filePath) {
      uni.showLoading({ title: '上传中...' })
      
      const cloudPath = `avatar/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      
      try {
        const uploadRes = await uniCloud.uploadFile({
          filePath: filePath,
          cloudPath: cloudPath
        })
        
        const avatarUrl = uploadRes.fileID
        const updateRes = await updateUserInfo({ avatarUrl })
        
        if (updateRes.success) {
          this.user.avatarUrl = avatarUrl
          uni.showToast({ title: '头像更新成功', icon: 'success' })
        } else {
          uni.showToast({ title: '更新失败', icon: 'none' })
        }
      } catch (err) {
        uni.showToast({ title: '上传失败', icon: 'none' })
        console.error('头像上传失败:', err)
      } finally {
        uni.hideLoading()
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
  background: linear-gradient(135deg, #F0F7FF 0%, #FFFFFF 100%);
  padding: 40rpx; 
  display: flex; 
  align-items: center; 
  gap: 24rpx; 
  margin: 24rpx 30rpx 32rpx; 
  border-radius: 24rpx; 
  box-shadow: 0 8rpx 32rpx rgba(30, 58, 138, 0.08);
  border: 1rpx solid #E8EFFF;
}

/* 头像 */
.avatar { 
  width: 100rpx; 
  height: 100rpx; 
  background: #FFFFFF; 
  border-radius: 50rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  border: 2rpx solid #E2E8F0;
  overflow: hidden;
  flex-shrink: 0;
}
.avatar-login {
  border: 2rpx dashed #CBD5E1;
  background: #F8FAFC;
}
.avatar-placeholder {
  font-size: 40rpx;
  opacity: 0.5;
}
.avatar-img {
  width: 100%;
  height: 100%;
}

.user-info { 
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 昵称和徽章 */
.nickname-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.nickname { 
  font-size: 34rpx; 
  font-weight: 600; 
  color: #1F2937; 
}
.badge {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #fff;
  font-size: 18rpx;
  padding: 4rpx 10rpx;
  border-radius: 12rpx;
  font-weight: 500;
}

/* 用户ID */
.user-id { 
  font-size: 24rpx; 
  color: #9CA3AF; 
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}

/* 登录区域 */
.login-area {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

/* 登录按钮 - 描边样式 */
.login-btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #F59E0B;
  color: #F59E0B;
  background: transparent;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  align-self: flex-start;
}
.login-text {
  font-size: 24rpx;
  font-weight: 500;
}

/* 登录提示 */
.login-hint {
  font-size: 22rpx;
  color: #9CA3AF;
}

/* 统计数据卡 */
.stats-card { 
  background: #FFFFFF; 
  border-radius: 24rpx; 
  margin: 0 30rpx 32rpx; 
  padding: 32rpx; 
  display: flex;
  box-shadow: 0 8rpx 32rpx rgba(30, 58, 138, 0.06);
}
.stat-item { 
  flex: 1; 
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.stat-value { 
  font-size: 40rpx; 
  font-weight: 700; 
  color: #1E3A8A; 
  font-family: "DIN Alternate", "Roboto Mono", monospace;
  line-height: 1.2;
}
.stat-value.stat-zero {
  color: #CBD5E1;
  font-weight: 400;
}
.stat-unit {
  font-size: 20rpx;
  color: #9CA3AF;
  margin-top: 4rpx;
  margin-bottom: 8rpx;
}
.stat-label { 
  font-size: 24rpx; 
  color: #6B7280; 
}

/* 功能分组 */
.menu-section {
  margin: 0 30rpx 24rpx;
}

/* 分组标题 */
.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
  margin-top: 8rpx;
}
.section-accent {
  width: 4rpx;
  height: 28rpx;
  background: #1E3A8A;
  border-radius: 2rpx;
}
.menu-section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #374151;
}

/* 功能列表 */
.menu-list { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  overflow: hidden;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.05);
}
.menu-item { 
  display: flex; 
  align-items: center; 
  padding: 28rpx 32rpx;
  position: relative;
}
/* 分割线 - 左侧缩进 */
.menu-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 88rpx;
  right: 0;
  bottom: 0;
  height: 1rpx;
  background: #F3F4F6;
}

/* 图标 */
.menu-icon-wrap {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}
.menu-icon { 
  font-size: 28rpx;
  color: #1E3A8A;
}
.menu-icon.gray {
  color: #64748B;
  opacity: 0.8;
}

.menu-text { 
  flex: 1; 
  font-size: 30rpx; 
  color: #374151; 
  font-weight: 400; 
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
