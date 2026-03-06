<template>
  <view class="container">
    <!-- 统计概览 -->
    <view class="stats-overview">
      <view class="stat-card">
        <text class="stat-value">{{stats.totalMistakes}}</text>
        <text class="stat-label">总错题数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{stats.thisMonth}}</text>
        <text class="stat-label">本月错题</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{stats.improvement}}%</text>
        <text class="stat-label">改进率</text>
      </view>
    </view>

    <!-- 错误类型分布 -->
    <view class="section">
      <view class="section-title">错误类型分布</view>
      <view class="chart-placeholder">
        <text>图表区域（需接入图表库）</text>
      </view>
      <view class="type-rank">
        <view class="rank-item" v-for="(item, index) in typeRank" :key="item.type">
          <view class="rank-num">{{index + 1}}</view>
          <view class="rank-info">
            <text class="rank-type">{{item.type}}</text>
            <view class="rank-bar">
              <view class="rank-fill" :style="{ width: item.percent + '%' }"></view>
            </view>
          </view>
          <text class="rank-count">{{item.count}}次</text>
        </view>
      </view>
    </view>

    <!-- 错误趋势 -->
    <view class="section">
      <view class="section-title">错误趋势（近6个月）</view>
      <view class="chart-placeholder">
        <text>折线图区域</text>
      </view>
    </view>

    <!-- 情绪分析 -->
    <view class="section">
      <view class="section-title">情绪与错误关联</view>
      <view class="emotion-list">
        <view class="emotion-item" v-for="item in emotionStats" :key="item.emotion">
          <text class="emotion-name">{{item.emotion}}</text>
          <text class="emotion-count">{{item.count}}次</text>
          <text class="emotion-rate">{{item.rate}}%</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      stats: {
        totalMistakes: 47,
        thisMonth: 12,
        improvement: 15
      },
      typeRank: [
        { type: '追高买入', count: 18, percent: 100 },
        { type: '恐慌割肉', count: 12, percent: 67 },
        { type: '该止损没止损', count: 8, percent: 44 },
        { type: '仓位过重', count: 5, percent: 28 },
        { type: '频繁交易', count: 4, percent: 22 }
      ],
      emotionStats: [
        { emotion: '贪婪', count: 20, rate: 42 },
        { emotion: '恐慌', count: 15, rate: 32 },
        { emotion: '冲动', count: 8, rate: 17 },
        { emotion: '犹豫', count: 4, rate: 9 }
      ]
    }
  }
}
</script>

<style scoped>
.container { padding: 20rpx; background: #f8fafc; min-height: 100vh; }
.stats-overview { display: flex; gap: 20rpx; margin-bottom: 30rpx; }
.stat-card { flex: 1; background: #fff; border-radius: 16rpx; padding: 30rpx; text-align: center; }
.stat-value { font-size: 48rpx; font-weight: bold; color: #2563eb; display: block; }
.stat-label { font-size: 24rpx; color: #94a3b8; margin-top: 10rpx; display: block; }
.section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #1e293b; margin-bottom: 30rpx; }
.chart-placeholder { height: 300rpx; background: #f8fafc; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 30rpx; }
.chart-placeholder text { color: #94a3b8; font-size: 28rpx; }
.type-rank { display: flex; flex-direction: column; gap: 24rpx; }
.rank-item { display: flex; align-items: center; gap: 20rpx; }
.rank-num { width: 40rpx; height: 40rpx; background: #f1f5f9; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: #64748b; }
.rank-item:first-child .rank-num { background: #2563eb; color: #fff; }
.rank-info { flex: 1; }
.rank-type { font-size: 28rpx; color: #1e293b; display: block; margin-bottom: 10rpx; }
.rank-bar { height: 12rpx; background: #f1f5f9; border-radius: 6rpx; overflow: hidden; }
.rank-fill { height: 100%; background: #2563eb; border-radius: 6rpx; }
.rank-count { font-size: 26rpx; color: #94a3b8; width: 80rpx; text-align: right; }
.emotion-list { display: flex; flex-wrap: wrap; gap: 20rpx; }
.emotion-item { flex: 1; min-width: 140rpx; background: #f8fafc; border-radius: 12rpx; padding: 24rpx; text-align: center; }
.emotion-name { font-size: 28rpx; color: #1e293b; display: block; margin-bottom: 10rpx; }
.emotion-count { font-size: 24rpx; color: #94a3b8; display: block; }
.emotion-rate { font-size: 32rpx; font-weight: bold; color: #2563eb; display: block; margin-top: 10rpx; }
</style>
