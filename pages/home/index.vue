
<template>
  <view class="container">
    <!-- 头部统计卡片 -->
    <view class="header-card">
      <view class="stat-row">
        <view class="stat-item">
          <text class="stat-num" :class="{ 'stat-empty': monthMistakes === 0 }">{{monthMistakes}}</text>
          <text class="stat-label">本月错题</text>
          <view class="stat-icon-wrap">
            <text class="stat-icon">📅</text>
          </view>
        </view>
        <view class="stat-item">
          <text class="stat-num" :class="{ 'stat-empty': totalMistakes === 0 }">{{totalMistakes}}</text>
          <text class="stat-label">累计错题</text>
          <view class="stat-icon-wrap">
            <text class="stat-icon">📊</text>
          </view>
        </view>
        <view class="stat-item">
          <text class="stat-num" :class="{ 'stat-empty': streakDays === 0 }">{{streakDays}}</text>
          <text class="stat-label">连续记录</text>
          <view class="stat-icon-wrap">
            <text class="stat-icon" :class="{ 'stat-icon-active': streakDays > 0 }">🔥</text>
          </view>
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

    <!-- 最新预案 -->
    <view class="section" v-if="latestPlan">
      <view class="section-header">
        <text class="section-title">最新预案</text>
        <text class="more" @click="goToPlans">查看全部 ></text>
      </view>
      <view class="plan-card" @click="goToPlanDetail(latestPlan._id)">
        <view class="plan-header">
          <view class="plan-stock">
            <text class="stock-name">{{latestPlan.stockName}}</text>
            <text class="stock-code">{{latestPlan.stockCode}}</text>
          </view>
          <view class="plan-status" :class="latestPlan.status">
            {{latestPlan.status === 'pending' ? '待执行' : latestPlan.status === 'executed' ? '已执行' : '已取消'}}
          </view>
        </view>
        <view class="plan-info">
          <view class="plan-row">
            <text class="plan-label">{{latestPlan.action === 'buy' ? '买入' : '卖出'}}目标价</text>
            <text class="plan-value">¥{{latestPlan.targetPrice}}</text>
          </view>
          <view class="plan-row" v-if="latestPlan.stopLoss">
            <text class="plan-label">止损</text>
            <text class="plan-value stop">¥{{latestPlan.stopLoss}}</text>
          </view>
          <view class="plan-row" v-if="latestPlan.takeProfit">
            <text class="plan-label">止盈</text>
            <text class="plan-value profit">¥{{latestPlan.takeProfit}}</text>
          </view>
        </view>
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
      <!-- 空状态 - 线条风格插画 -->
      <view class="enemy-empty-card" v-else>
        <view class="empty-illustration">
          <!-- 下降趋势线条图 -->
          <view class="trend-chart">
            <view class="trend-line"></view>
            <view class="trend-arrow">↘</view>
          </view>
        </view>
        <text class="empty-title">暂无亏损记录</text>
        <text class="empty-desc">保持警惕，让亏损无处可藏</text>
        
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
        <view class="action-btn" @click="goToPlan">
          <view class="action-icon-wrap">
            <text class="action-icon">📝</text>
          </view>
          <text class="action-text">交易预案</text>
        </view>
      </view>
    </view>

    <!-- 最近错题 -->
    <view class="section" v-if="recentMistakes.length > 0">
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
    
    <!-- 无数据时显示引导 -->
    <view class="section" v-else>
      <view class="section-header">
        <text class="section-title">最近错题</text>
      </view>
      <view class="mistake-guide-card" @click="goToMistakes">
        <view class="guide-icon">📋</view>
        <text class="guide-text">暂无记录，记录第一笔交易开始复盘</text>
        <text class="guide-arrow">→</text>
      </view>
    </view>
  </view>
</template>

<script>
import { login, checkLogin, getUserInfo } from '@/utils/auth.js'
import { getHomeStats } from '@/utils/homeApi.js'
import { getPlans } from '@/utils/planApi.js'

export default {
  data() {
    return {
      monthMistakes: 0,
      totalMistakes: 0,
      streakDays: 0,
      todayTip: '',
      topMistake: null,
      recentMistakes: [],
      latestPlan: null,
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
      
      // 并行获取首页数据和最新预案
      const [homeResult, planResult] = await Promise.all([
        getHomeStats(),
        getPlans({ limit: 1 })
      ])
      
      uni.hideLoading()
      
      if (homeResult.success) {
        const data = homeResult.data
        this.monthMistakes = data.monthMistakes
        this.totalMistakes = data.totalMistakes
        this.streakDays = data.streakDays
        this.todayTip = data.todayTip
        this.topMistake = data.topMistake
        this.recentMistakes = data.recentMistakes
      } else {
        uni.showToast({ title: homeResult.error || '加载失败', icon: 'none' })
      }
      
      // 设置最新预案
      if (planResult.success && planResult.data && planResult.data.length > 0) {
        this.latestPlan = planResult.data[0]
      } else {
        this.latestPlan = null
      }
    },
    goToManual() {
      uni.navigateTo({ url: '/pages/record/manual' })
    },
    goToPlan() {
      uni.navigateTo({ url: '/pages/plan/plan' })
    },
    goToPlans() {
      uni.switchTab({ url: '/pages/plan/plan' })
    },
    goToPlanDetail(id) {
      uni.navigateTo({ url: `/pages/plan/detail?id=${id}` })
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
  padding: 40rpx 32rpx; 
  margin-bottom: 32rpx; 
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06); 
}
.stat-row { display: flex; justify-content: space-around; }
.stat-item { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  position: relative;
}
.stat-num { 
  font-size: 48rpx; 
  font-weight: 700; 
  color: #1E3A8A; 
  font-family: "DIN Alternate", "Roboto Mono", monospace;
  transition: all 0.3s;
  margin-bottom: 8rpx;
}
/* 无数据时显示灰色 */
.stat-num.stat-empty {
  color: #9CA3AF;
  opacity: 0.6;
}
.stat-label { 
  font-size: 24rpx; 
  color: #6B7280; 
  margin-bottom: 16rpx;
}
/* 统计图标 */
.stat-icon-wrap {
  width: 48rpx;
  height: 48rpx;
  background: #F3F4F6;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-icon {
  font-size: 24rpx;
  opacity: 0.5;
}
.stat-icon-active {
  opacity: 1;
}

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

/* 最新预案卡片 */
.plan-card { 
  background: #FFFFFF; 
  border-radius: 20rpx; 
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #F3F4F6;
}
.plan-stock {
  display: flex;
  flex-direction: column;
}
.plan-stock .stock-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #111827;
}
.plan-stock .stock-code {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 6rpx;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.plan-status {
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
  font-size: 22rpx;
  font-weight: 500;
}
.plan-status.pending {
  background: #FEF3C7;
  color: #D97706;
}
.plan-status.executed {
  background: #D1FAE5;
  color: #059669;
}
.plan-status.cancelled {
  background: #F3F4F6;
  color: #9CA3AF;
}
.plan-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.plan-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.plan-label {
  font-size: 26rpx;
  color: #6B7280;
}
.plan-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.plan-value.stop {
  color: #DC2626;
}
.plan-value.profit {
  color: #059669;
}

/* 头号敌人 - 有数据时 */
.enemy-card { 
  background: #F8FAFC; 
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

/* 头号敌人 - 空状态（线条风格插画） */
.enemy-empty-card { 
  background: linear-gradient(145deg, #F0F4FF 0%, #F8FAFC 100%); 
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
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 下降趋势线条图 */
.trend-chart {
  position: relative;
  width: 120rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trend-line {
  position: absolute;
  width: 80rpx;
  height: 4rpx;
  background: linear-gradient(135deg, #64748B, #94A3B8);
  transform: rotate(25deg);
  border-radius: 2rpx;
}
.trend-line::before {
  content: '';
  position: absolute;
  left: -20rpx;
  top: -10rpx;
  width: 30rpx;
  height: 4rpx;
  background: linear-gradient(135deg, #94A3B8, #CBD5E1);
  transform: rotate(-15deg);
  border-radius: 2rpx;
}
.trend-arrow {
  position: absolute;
  right: 0;
  bottom: 10rpx;
  font-size: 36rpx;
  color: #64748B;
  font-weight: bold;
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
/* 琥珀色行动按钮 - 带内外阴影 */
.empty-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: linear-gradient(145deg, #F59E0B 0%, #D97706 100%);
  color: #fff;
  padding: 24rpx 48rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 
    inset 0 1rpx 0 rgba(255,255,255,0.3),
    0 4rpx 16rpx rgba(245, 158, 11, 0.35);
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

/* 快速记录 - 质感升级 */
.quick-actions { display: flex; gap: 20rpx; }
.action-btn { 
  flex: 1; 
  background: linear-gradient(145deg, #3B82F6 0%, #1D4ED8 100%);
  border-radius: 16rpx; 
  padding: 32rpx 20rpx; 
  display: flex; 
  flex-direction: column; 
  align-items: center;
  box-shadow: 
    inset 0 1rpx 0 rgba(255,255,255,0.2),
    0 4rpx 12rpx rgba(59, 130, 246, 0.25);
  transition: transform 0.1s;
  position: relative;
  overflow: hidden;
}
/* 高光效果 */
.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
}
.action-btn:active { transform: scale(0.95); }
/* 图标白色圆形背景 */
.action-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  border: 1rpx solid rgba(255,255,255,0.1);
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

/* 最近错题 - 引导卡片 */
.mistake-guide-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
  border: 1rpx solid #F3F4F6;
}
.guide-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}
.guide-text {
  flex: 1;
  font-size: 28rpx;
  color: #6B7280;
}
.guide-arrow {
  font-size: 32rpx;
  color: #3B82F6;
  font-weight: bold;
}
</style>
