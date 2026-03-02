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
export default {
  data() {
    return {
      user: {
        nickname: '散户小王',
        id: '123456'
      },
      stats: {
        mistakes: 47,
        public: 12,
        likes: 89
      }
    }
  },
  methods: {
    goToAnalysis() {
      uni.switchTab({ url: '/pages/analysis/analysis' })
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
        title: '关于错题本',
        content: 'A股投资者的错题本，记录错误，避免重复犯错。',
        showCancel: false
      })
    }
  }
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }
.user-card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 60rpx 40rpx; display: flex; align-items: center; gap: 30rpx; }
.avatar { width: 120rpx; height: 120rpx; background: rgba(255,255,255,0.1); border-radius: 60rpx; display: flex; align-items: center; justify-content: center; font-size: 60rpx; }
.user-info { flex: 1; }
.nickname { font-size: 40rpx; font-weight: bold; color: #fff; display: block; }
.user-id { font-size: 26rpx; color: rgba(255,255,255,0.6); margin-top: 10rpx; display: block; }
.stats-card { background: #fff; border-radius: 20rpx; margin: -30rpx 30rpx 30rpx; padding: 40rpx; display: flex; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05); }
.stat-item { flex: 1; text-align: center; }
.stat-value { font-size: 40rpx; font-weight: bold; color: #e94560; display: block; }
.stat-label { font-size: 24rpx; color: #999; margin-top: 10rpx; display: block; }
.menu-list { background: #fff; border-radius: 20rpx; margin: 0 30rpx; overflow: hidden; }
.menu-item { display: flex; align-items: center; padding: 30rpx; border-bottom: 1rpx solid #f5f5f5; }
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 40rpx; margin-right: 20rpx; }
.menu-text { flex: 1; font-size: 30rpx; color: #333; }
.arrow { font-size: 28rpx; color: #ccc; }
.version { text-align: center; font-size: 24rpx; color: #999; margin-top: 60rpx; }
</style>
