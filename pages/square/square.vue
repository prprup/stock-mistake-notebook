<template>
  <view class="container">
    <!-- 筛选标签 -->
    <view class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-item" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">全部</view>
        <view v-for="item in mistakeTypes" :key="item.code"
          class="filter-item" :class="{ active: currentFilter === item.code }"
          @click="setFilter(item.code)">
          {{item.name}}
        </view>
      </scroll-view>
    </view>

    <!-- 本周热错 -->
    <view class="hot-section" v-if="currentFilter === 'all'">
      <view class="hot-title">🔥 本周最多人犯的错误</view>
      <view class="hot-card">
        <view class="hot-name">{{hotMistake.name}}</view>
        <view class="hot-count">{{hotMistake.count}} 人犯过这个错</view>
      </view>
    </view>

    <!-- 错题列表 -->
    <view class="mistake-list">
      <view class="mistake-card" v-for="item in mistakes" :key="item._id" @click="goToDetail(item._id)">
        <view class="card-header">
          <view class="type-tags">
            <text class="tag" v-for="(type, idx) in item.mistakeTypes" :key="idx">{{type}}</text>
          </view>
          <text class="time">{{item.timeAgo}}</text>
        </view>

        <view class="reflection">{{item.reflection}}</view>

        <view class="emotion-tag" v-if="item.emotion">当时情绪：{{item.emotion}}</view>

        <view class="card-footer">
          <view class="action" @click.stop="likeMistake(item._id)">
            <text class="icon">{{item.isLiked ? '❤️' : '🤍'}}</text>
            <text class="count">{{item.likes || '我也犯过'}}</text>
          </view>
          <view class="action">
            <text class="icon">💬</text>
            <text class="count">{{item.comments || '评论'}}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore" @click="loadMore">
      <text>加载更多</text>
    </view>
    <view class="no-more" v-else>
      <text>没有更多了</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentFilter: 'all',
      mistakeTypes: [
        { code: 'chase_high', name: '追高' },
        { code: 'panic_sell', name: '割肉' },
        { code: 'no_stop_loss', name: '不止损' },
        { code: 'heavy_position', name: '重仓' },
        { code: 'frequent_trade', name: '频繁交易' },
        { code: 'revenge_trade', name: '报复交易' }
      ],
      hotMistake: { name: '追高买入AI概念股', count: 328 },
      mistakes: [],
      hasMore: true
    }
  },
  onLoad() {
    this.loadMistakes()
  },
  methods: {
    loadMistakes() {
      this.mistakes = [
        {
          _id: '1',
          mistakeTypes: ['追高买入', '仓位过重'],
          reflection: '看到群里说这只票要涨停，没忍住全仓冲进去了，结果当天就炸板，第二天低开割肉。以后再也不信群消息了。',
          emotion: '贪婪',
          timeAgo: '2小时前',
          likes: 45,
          comments: 12,
          isLiked: false
        },
        {
          _id: '2',
          mistakeTypes: ['恐慌割肉'],
          reflection: '早盘低开3个点就慌了，赶紧割肉止损。结果下午V型反转，收盘涨2个点。我的心理素质还是太差了。',
          emotion: '恐慌',
          timeAgo: '5小时前',
          likes: 128,
          comments: 34,
          isLiked: true
        },
        {
          _id: '3',
          mistakeTypes: ['该止损没止损'],
          reflection: '-5%的时候舍不得割，想等反弹，结果一路跌到-20%。侥幸心理害死人，纪律性太差。',
          emotion: '犹豫',
          timeAgo: '昨天',
          likes: 89,
          comments: 23,
          isLiked: false
        }
      ]
    },
    setFilter(filter) {
      this.currentFilter = filter
      // TODO: 重新加载数据
    },
    likeMistake(id) {
      const item = this.mistakes.find(i => i._id === id)
      if (item) {
        item.isLiked = !item.isLiked
        item.likes = item.isLiked ? item.likes + 1 : item.likes - 1
      }
    },
    goToDetail(id) {
      uni.navigateTo({ url: `/pages/square/detail?id=${id}` })
    },
    loadMore() {
      uni.showToast({ title: '加载中...', icon: 'loading' })
    }
  }
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }
.filter-bar { background: #fff; padding: 20rpx 0; position: sticky; top: 0; z-index: 10; border-bottom: 1rpx solid #eee; }
.filter-scroll { white-space: nowrap; padding: 0 20rpx; }
.filter-item { display: inline-block; padding: 16rpx 32rpx; margin-right: 16rpx; background: #f5f5f5; border-radius: 30rpx; font-size: 26rpx; color: #666; }
.filter-item.active { background: #e94560; color: #fff; }
.hot-section { padding: 30rpx 20rpx; }
.hot-title { font-size: 28rpx; color: #666; margin-bottom: 20rpx; }
.hot-card { background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); border-radius: 16rpx; padding: 40rpx; color: #fff; }
.hot-name { font-size: 40rpx; font-weight: bold; margin-bottom: 16rpx; }
.hot-count { font-size: 26rpx; opacity: 0.9; }
.mistake-list { padding: 0 20rpx; }
.mistake-card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20rpx; }
.type-tags { display: flex; flex-wrap: wrap; gap: 12rpx; flex: 1; }
.type-tags .tag { background: #ffe5e5; color: #e94560; font-size: 22rpx; padding: 8rpx 16rpx; border-radius: 8rpx; }
.time { font-size: 22rpx; color: #999; margin-left: 20rpx; }
.reflection { font-size: 28rpx; color: #333; line-height: 1.6; margin-bottom: 20rpx; }
.emotion-tag { display: inline-block; background: #f0f0f0; color: #666; font-size: 22rpx; padding: 8rpx 16rpx; border-radius: 8rpx; margin-bottom: 20rpx; }
.card-footer { display: flex; gap: 40rpx; padding-top: 20rpx; border-top: 1rpx solid #f0f0f0; }
.action { display: flex; align-items: center; gap: 8rpx; }
.action .icon { font-size: 32rpx; }
.action .count { font-size: 24rpx; color: #999; }
.load-more, .no-more { text-align: center; padding: 40rpx; }
.load-more text { color: #e94560; font-size: 28rpx; }
.no-more text { color: #999; font-size: 26rpx; }
</style>
