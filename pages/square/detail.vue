<template>
  <view class="container">
    <view class="detail-card">
      <view class="user-header">
        <view class="avatar">👤</view>
        <view class="user-info">
          <text class="username">匿名用户</text>
          <text class="time">{{post.timeAgo}}</text>
        </view>
      </view>

      <view class="content">
        <view class="type-tags">
          <text class="tag" v-for="(type, idx) in post.mistakeTypes" :key="idx">{{type}}</text>
        </view>

        <view class="reflection">{{post.reflection}}</view>

        <view class="emotion" v-if="post.emotion">
          <text class="emotion-label">当时情绪：</text>
          <text class="emotion-value">{{post.emotion}}</text>
        </view>
      </view>

      <view class="actions">
        <view class="action-btn" :class="{ active: post.isLiked }" @click="toggleLike">
          <text class="icon">{{post.isLiked ? '❤️' : '🤍'}}</text>
          <text class="count">{{post.likes}}</text>
        </view>
        
        <view class="action-btn">
          <text class="icon">💬</text>
          <text class="count">{{post.comments}}</text>
        </view>
        
        <view class="action-btn" @click="share">
          <text class="icon">📤</text>
          <text class="count">分享</text>
        </view>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comment-section">
      <view class="section-title">评论 ({{post.comments}})</view>
      
      <view class="comment-list">
        <view class="comment-item" v-for="item in comments" :key="item._id">
          <view class="comment-header">
            <text class="comment-user">匿名用户</text>
            <text class="comment-time">{{item.time}}</text>
          </view>
          <view class="comment-content">{{item.content}}</view>
        </view>
      </view>
    </view>

    <!-- 底部评论输入 -->
    <view class="comment-input-bar">
      <input class="comment-input" placeholder="写下你的评论..." v-model="newComment" />
      <button class="btn-send" @click="sendComment">发送</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      post: {},
      comments: [],
      newComment: ''
    }
  },
  onLoad(options) {
    this.loadDetail(options.id)
    this.loadComments()
  },
  methods: {
    loadDetail(id) {
      this.post = {
        _id: id,
        mistakeTypes: ['追高买入', '仓位过重'],
        reflection: '看到群里说这只票要涨停，没忍住全仓冲进去了，结果当天就炸板，第二天低开割肉。以后再也不信群消息了。',
        emotion: '贪婪',
        timeAgo: '2小时前',
        likes: 45,
        comments: 12,
        isLiked: false
      }
    },
    loadComments() {
      this.comments = [
        { _id: '1', content: '我也犯过同样的错，太真实了', time: '1小时前' },
        { _id: '2', content: '群消息真的不能信，都是接盘侠', time: '30分钟前' },
        { _id: '3', content: '共勉，一起进步', time: '10分钟前' }
      ]
    },
    toggleLike() {
      this.post.isLiked = !this.post.isLiked
      this.post.likes += this.post.isLiked ? 1 : -1
    },
    share() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    },
    sendComment() {
      if (!this.newComment.trim()) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' })
        return
      }
      this.comments.push({
        _id: Date.now().toString(),
        content: this.newComment,
        time: '刚刚'
      })
      this.newComment = ''
      this.post.comments++
    }
  }
}
</script>

<style scoped>
.container { padding: 20rpx 20rpx 120rpx; background: #f5f5f5; min-height: 100vh; }
.detail-card { background: #fff; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
.user-header { display: flex; align-items: center; gap: 20rpx; margin-bottom: 30rpx; }
.avatar { width: 80rpx; height: 80rpx; background: #f0f0f0; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; font-size: 40rpx; }
.user-info { flex: 1; }
.username { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.time { font-size: 24rpx; color: #999; margin-top: 6rpx; display: block; }
.type-tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 24rpx; }
.tag { background: #ffe5e5; color: #e94560; font-size: 24rpx; padding: 10rpx 20rpx; border-radius: 8rpx; }
.reflection { font-size: 30rpx; color: #333; line-height: 1.8; margin-bottom: 24rpx; }
.emotion { display: flex; align-items: center; gap: 10rpx; margin-bottom: 30rpx; }
.emotion-label { font-size: 26rpx; color: #999; }
.emotion-value { font-size: 26rpx; color: #e94560; font-weight: bold; }
.actions { display: flex; gap: 40rpx; padding-top: 30rpx; border-top: 1rpx solid #f0f0f0; }
.action-btn { display: flex; align-items: center; gap: 10rpx; }
.action-btn.active .count { color: #e94560; }
.icon { font-size: 36rpx; }
.count { font-size: 26rpx; color: #999; }
.comment-section { background: #fff; border-radius: 20rpx; padding: 30rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 30rpx; }
.comment-list { display: flex; flex-direction: column; gap: 30rpx; }
.comment-item { padding-bottom: 30rpx; border-bottom: 1rpx solid #f5f5f5; }
.comment-item:last-child { border-bottom: none; padding-bottom: 0; }
.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.comment-user { font-size: 28rpx; font-weight: bold; color: #333; }
.comment-time { font-size: 24rpx; color: #999; }
.comment-content { font-size: 28rpx; color: #666; line-height: 1.6; }
.comment-input-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 30rpx; background: #fff; border-top: 1rpx solid #eee; display: flex; gap: 20rpx; align-items: center; }
.comment-input { flex: 1; height: 72rpx; background: #f5f5f5; border-radius: 36rpx; padding: 0 30rpx; font-size: 28rpx; }
.btn-send { width: 120rpx; height: 72rpx; background: #e94560; color: #fff; font-size: 28rpx; border-radius: 36rpx; display: flex; align-items: center; justify-content: center; }
</style>
