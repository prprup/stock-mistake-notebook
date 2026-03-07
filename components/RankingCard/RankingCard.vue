<template>
  <view class="ranking-card" v-if="rankingData && rankingData.top3 && rankingData.top3.length > 0">
    <!-- 卡片头部 -->
    <view class="ranking-header">
      <view class="ranking-title-wrap">
        <text class="ranking-icon">🏆</text>
        <text class="ranking-title">错题共鸣</text>
      </view>
      <text class="ranking-subtitle">本周 {{rankingData.participantCount || 0}} 人参与</text>
    </view>

    <!-- TOP3 列表 -->
    <view class="ranking-list">
      <view 
        class="ranking-item" 
        v-for="(item, index) in rankingData.top3" 
        :key="index"
        :class="{ 'ranking-item-highlight': item.hasSameMistake }"
      >
        <!-- 排名 -->
        <view class="rank-badge" :class="`rank-${item.rank}`">
          <text class="rank-num">{{item.rank}}</text>
        </view>

        <!-- 内容 -->
        <view class="rank-content">
          <view class="rank-type-wrap">
            <text class="rank-type">{{item.type}}</text>
            <!-- 共鸣标记 -->
            <view class="resonance-tag" v-if="item.hasSameMistake">
              <text class="resonance-icon">💡</text>
              <text class="resonance-text">你也有</text>
            </view>
          </view>
          
          <view class="rank-stats">
            <text class="rank-count">{{item.count}} 次</text>
            <text class="rank-users">{{item.userCount}} 人</text>
          </view>
        </view>

        <!-- 百分比条 -->
        <view class="percent-bar-wrap">
          <view class="percent-bar-bg">
            <view 
              class="percent-bar-fill" 
              :class="`rank-fill-${item.rank}`"
              :style="{ width: item.percent + '%' }"
            ></view>
          </view>
          <text class="percent-text">{{item.percent}}%</text>
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="ranking-footer">
      <text class="footer-text">本周统计周期：{{rankingData.weekRange?.start}} ~ {{rankingData.weekRange?.end}}</text>
    </view>
  </view>

  <!-- 空状态 -->
  <view class="ranking-empty" v-else-if="showEmpty">
    <view class="empty-icon-wrap">
      <text class="empty-icon">📊</text>
    </view>
    <text class="empty-title">暂无统计数据</text>
    <text class="empty-desc">本周还没有足够的错题记录</text>
    <text class="empty-tip">记录你的第一笔交易，开启复盘之旅</text>
  </view>
</template>

<script>
export default {
  name: 'RankingCard',
  props: {
    rankingData: {
      type: Object,
      default: () => ({
        top3: [],
        participantCount: 0,
        weekRange: null
      })
    },
    showEmpty: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style scoped>
/* 卡片主容器 */
.ranking-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}

/* 头部 */
.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #F3F4F6;
}

.ranking-title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.ranking-icon {
  font-size: 36rpx;
}

.ranking-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1E3A8A;
}

.ranking-subtitle {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 列表 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #F8FAFC;
  border-radius: 16rpx;
  transition: all 0.2s ease;
}

.ranking-item-highlight {
  background: linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%);
  border: 1rpx solid rgba(245, 158, 11, 0.2);
}

/* 排名徽章 */
.rank-badge {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.rank-1 {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}

.rank-2 {
  background: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
}

.rank-3 {
  background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
}

.rank-num {
  font-size: 24rpx;
  font-weight: bold;
  color: #FFFFFF;
}

/* 内容区 */
.rank-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.rank-type-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.rank-type {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

/* 共鸣标记 */
.resonance-tag {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.3);
}

.resonance-icon {
  font-size: 18rpx;
}

.resonance-text {
  font-size: 20rpx;
  color: #FFFFFF;
  font-weight: 500;
}

/* 统计 */
.rank-stats {
  display: flex;
  gap: 16rpx;
}

.rank-count {
  font-size: 24rpx;
  color: #6B7280;
}

.rank-users {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 百分比条 */
.percent-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-left: 16rpx;
  min-width: 120rpx;
}

.percent-bar-bg {
  width: 80rpx;
  height: 8rpx;
  background: #E5E7EB;
  border-radius: 4rpx;
  overflow: hidden;
}

.percent-bar-fill {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.5s ease;
}

.rank-fill-1 {
  background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%);
}

.rank-fill-2 {
  background: linear-gradient(90deg, #9CA3AF 0%, #6B7280 100%);
}

.rank-fill-3 {
  background: linear-gradient(90deg, #D97706 0%, #B45309 100%);
}

.percent-text {
  font-size: 22rpx;
  color: #6B7280;
  font-weight: 500;
  min-width: 44rpx;
  text-align: right;
}

/* 底部 */
.ranking-footer {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F3F4F6;
  text-align: center;
}

.footer-text {
  font-size: 22rpx;
  color: #9CA3AF;
}

/* 空状态 */
.ranking-empty {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 60rpx 48rpx;
  text-align: center;
  box-shadow: 0 4rpx 24rpx rgba(30, 58, 138, 0.06);
}

.empty-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #F0F4FF 0%, #EFF6FF 100%);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24rpx;
}

.empty-icon {
  font-size: 48rpx;
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
  margin-bottom: 8rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: #9CA3AF;
  display: block;
}
</style>
