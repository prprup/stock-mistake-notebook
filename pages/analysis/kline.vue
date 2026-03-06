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
        color: ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD'],
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
              upLine: '#DC2626',
              upFill: '#DC2626',
              downLine: '#059669',
              downFill: '#059669'
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
            bgColor: '#1E3A8A',
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
  background: #F5F7FA;
  min-height: 100vh;
}
.stock-header {
  background: #1E3A8A;
  padding: 32rpx;
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
  color: rgba(255,255,255,0.7);
  font-family: "DIN Alternate", "Roboto Mono", monospace;
}
.chart-container {
  background: #FFFFFF;
  padding: 20rpx;
  margin: 24rpx;
  border-radius: 20rpx;
  height: 600rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.mistake-list {
  padding: 24rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1E3A8A;
  margin-bottom: 24rpx;
}
.mistake-item {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(30, 58, 138, 0.06);
}
.mistake-date {
  font-size: 28rpx;
  color: #6B7280;
  margin-bottom: 16rpx;
}
.mistake-types {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.type-tag {
  background: #EFF6FF;
  color: #1E3A8A;
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 500;
}
.mistake-reflection {
  font-size: 26rpx;
  color: #374151;
  line-height: 1.5;
}
.empty-tip {
  text-align: center;
  padding: 100rpx;
  color: #9CA3AF;
  font-size: 28rpx;
}
</style>
