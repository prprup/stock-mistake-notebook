<template>
  <view class="container">
    <view class="stock-header">
      <text class="stock-name">{{stockName}}</text>
      <text class="stock-code">{{stockCode}}</text>
    </view>
    
    <!-- K线图表 -->
    <view class="chart-container">
      <qiun-data-charts 
        type="candle"
        :opts="chartOpts"
        :chartData="chartData"
        :ontap="onChartTap"
      />
    </view>
    
    <!-- 错题标记列表 -->
    <view class="mistake-list" v-if="mistakeList.length > 0">
      <view class="section-title">该股票错题记录 ({{mistakeList.length}})</view>
      <view 
        class="mistake-item" 
        v-for="(item, index) in mistakeList" 
        :key="index"
        @click="goToDetail(item._id)"
      >
        <view class="mistake-date">{{formatDate(item.date)}}</view>
        <view class="mistake-types">
          <text class="type-tag" v-for="(type, idx) in item.mistakeTypes" :key="idx">{{type}}</text>
        </view>
        <view class="mistake-reflection" v-if="item.reflection">{{item.reflection}}</view>
      </view>
    </view>
    
    <view class="empty-tip" v-else>
      <text>该股票暂无错题记录</text>
    </view>
  </view>
</template>

<script>
import { getKlineWithMistakes } from '@/utils/klineApi.js'

export default {
  data() {
    return {
      stockCode: '',
      stockName: '',
      tsCode: '',
      chartData: {},
      mistakeList: [],
      chartOpts: {
        color: ['#e94560', '#37A2DA', '#32C5E9', '#67E0E3'],
        padding: [15, 15, 0, 15],
        enableScroll: true,
        legend: { show: false },
        xAxis: {
          disableGrid: true,
          labelCount: 5,
          itemCount: 40,
          scrollShow: true,
          scrollAlign: 'right'
        },
        yAxis: {
          gridType: 'dash',
          dashLength: 2,
          splitNumber: 5
        },
        extra: {
          candle: {
            color: {
              upLine: '#e94560',
              upFill: '#e94560',
              downLine: '#2ecc71',
              downFill: '#2ecc71'
            },
            average: {
              show: false
            }
          },
          markPoint: {
            type: '2',
            data: []
          }
        }
      }
    }
  },
  onLoad(options) {
    this.stockCode = options.code || ''
    this.stockName = options.name || ''
    this.tsCode = options.tsCode || ''
    this.loadKlineData()
  },
  methods: {
    async loadKlineData() {
      if (!this.tsCode) {
        uni.showToast({ title: '股票代码错误', icon: 'none' })
        return
      }
      
      uni.showLoading({ title: '加载中' })
      
      // 获取最近90天数据
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 90)
      
      const format = (date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}${m}${d}`
      }
      
      const result = await getKlineWithMistakes(
        this.tsCode,
        format(start),
        format(end)
      )
      
      uni.hideLoading()
      
      if (result.success) {
        this.mistakeList = result.data.klineData.filter(k => k.hasMistake)
        this.renderChart(result.data.klineData)
      } else {
        uni.showToast({ title: result.error || '加载失败', icon: 'none' })
      }
    },
    
    renderChart(klineData) {
      const categories = klineData.map(k => k.date.slice(4, 6) + '/' + k.date.slice(6))
      const series = [{
        name: '日K',
        data: klineData.map(k => [k.open, k.close, k.low, k.high, k.volume])
      }]
      
      // 标记错题位置
      const markPointData = klineData
        .map((k, index) => ({ ...k, index }))
        .filter(k => k.hasMistake)
        .map(k => ({
          x: k.index,
          y: k.high,
          value: '错',
          label: {
            show: true,
            color: '#fff',
            fontSize: 10,
            bgColor: '#e94560',
            padding: 4,
            borderRadius: 4
          }
        }))
      
      this.chartOpts.extra.markPoint.data = markPointData
      
      this.chartData = {
        categories,
        series
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return `${d.getMonth() + 1}月${d.getDate()}日`
    },
    
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/mistakes/detail?id=${id}`
      })
    },
    
    onChartTap(e) {
      console.log('点击图表', e)
    }
  }
}
</script>

<style scoped>
.container {
  background: #f5f5f5;
  min-height: 100vh;
}
.stock-header {
  background: #1a1a2e;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.stock-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}
.stock-code {
  font-size: 28rpx;
  color: #888;
}
.chart-container {
  background: #fff;
  padding: 20rpx;
  margin: 20rpx;
  border-radius: 16rpx;
  height: 600rpx;
}
.mistake-list {
  padding: 20rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}
.mistake-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}
.mistake-date {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
}
.mistake-types {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.type-tag {
  background: #ffe5e5;
  color: #e94560;
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}
.mistake-reflection {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
}
.empty-tip {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}
</style>
