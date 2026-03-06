<template>
  <canvas 
    :canvas-id="cid" 
    :id="cid" 
    class="ucharts-canvas"
    :style="{ width: width + 'px', height: height + 'px' }"
    @touchstart="touchStart"
    @touchmove="touchMove"
    @touchend="touchEnd"
  />
</template>

<script>
// uCharts 微信小程序版本
// 需要下载 ucharts.js 放到 utils 目录
import uCharts from '@/utils/ucharts.js'

export default {
  name: 'QiunWxUcharts',
  props: {
    cid: {
      type: String,
      default: 'ucharts-canvas'
    },
    type: {
      type: String,
      default: 'line'
    },
    width: {
      type: Number,
      default: 375
    },
    height: {
      type: Number,
      default: 250
    },
    opts: {
      type: Object,
      default: () => ({})
    },
    chartData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    chartData: {
      handler(newVal) {
        if (newVal && newVal.categories) {
          this.drawChart()
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.chartData && this.chartData.categories) {
      this.drawChart()
    }
  },
  methods: {
    drawChart() {
      const ctx = uni.createCanvasContext(this.cid, this)
      
      const defaultOpts = {
        type: this.type,
        context: ctx,
        width: this.width,
        height: this.height,
        categories: this.chartData.categories || [],
        series: this.chartData.series || [],
        animation: true,
        background: '#ffffff',
        padding: [15, 15, 0, 5],
        ...this.opts
      }
      
      this.chart = new uCharts(defaultOpts)
    },
    touchStart(e) {
      this.chart && this.chart.showToolTip(e, {
        format: (item, category) => {
          return `${category} ${item.name}: ${item.data}`
        }
      })
    },
    touchMove(e) {
      this.chart && this.chart.showToolTip(e)
    },
    touchEnd(e) {
      // 可添加点击事件处理
    }
  }
}
</script>

<style scoped>
.ucharts-canvas {
  display: block;
}
</style>
