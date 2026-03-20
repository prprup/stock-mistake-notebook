# 错题本小程序 - 开发说明

## 项目结构

```
miniprogram/
├── app.js                 # 小程序入口
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── pages/
│   ├── index/             # 首页
│   ├── record/            # 记录模块
│   │   ├── record.js      # 记录入口
│   │   ├── manual/        # 手动录入
│   │   └── ocr/           # 截图识别
│   ├── mistakes/          # 错题列表
│   ├── analysis/          # 统计分析
│   ├── square/            # 错题广场
│   ├── profile/           # 个人中心
│   ├── points/            # 积分系统
│   │   ├── points.js      # 积分中心
│   │   └── records/       # 积分明细
│   └── stockDonation/     # 股票打赏系统
│       ├── donate/        # 打赏页面
│       ├── ranking/       # 排行榜
│       └── myDonations/   # 我的打赏
├── components/            # 公共组件
├── utils/                 # 工具函数
└── images/                # 图片资源

cloudfunctions/            # 云函数
├── getPoints/             # 获取用户积分信息
├── checkIn/               # 每日签到
├── addPoints/             # 增加积分
├── getPointsRecords/      # 获取积分记录
├── addMistakeWithPoints/  # 录入错题并加积分
├── initPointsDB/          # 初始化积分数据库
├── searchStocks/          # 搜索A股股票
├── donateToStock/         # 打赏股票
├── getStockRanking/       # 获取股票打赏排行榜
└── getUserDonations/      # 获取用户打赏记录
```

## 快速开始

1. 注册微信小程序账号
2. 下载微信开发者工具
3. 导入本项目
4. 开通云开发环境
5. 部署云函数和数据库

### 部署步骤

```bash
# 1. 在微信开发者工具中右键 cloudfunctions/initPointsDB 选择"创建并部署：云端安装依赖"

# 2. 调用 initPointsDB 云函数初始化数据库
# 在小程序中执行或开发者工具控制台执行：
wx.cloud.callFunction({ name: 'initPointsDB' })

# 3. 部署其他云函数（右键每个云函数目录）
# - getPoints, checkIn, addPoints, getPointsRecords, addMistakeWithPoints
# - searchStocks, donateToStock, getStockRanking, getUserDonations
```

## 云开发配置

### 数据库集合

| 集合名 | 说明 | 主要字段 |
|--------|------|----------|
| `user_points` | 用户积分表 | points, totalPoints, checkInStreak, lastCheckIn |
| `points_records` | 积分变动记录 | type, points, description, relatedId |
| `mistakes` | 错题记录 | stockCode, stockName, mistakeTypes, reflection |
| `stock_donations` | 股票打赏记录 | stockCode, stockName, points, message |
| `stock_donation_stats` | 股票打赏统计 | stockCode, stockName, totalPoints, donorCount |

### user_points 字段说明

```javascript
{
  _openid: string,        // 用户openid
  points: number,         // 当前可用积分
  totalPoints: number,    // 累计获得积分
  checkInStreak: number,  // 连续签到天数
  lastCheckIn: Date,      // 最后签到时间
  createTime: Date,
  updateTime: Date
}
```

### points_records 字段说明

```javascript
{
  _openid: string,        // 用户openid
  type: string,           // 类型: mistake/ad/checkin/bonus/donate/invite/share
  points: number,         // 变动积分（正数获得，负数消耗）
  description: string,    // 描述
  relatedId: string,      // 关联ID（如错题ID）
  createTime: Date
}
```

### stock_donations 字段说明

```javascript
{
  _openid: string,        // 用户openid
  stockCode: string,      // 股票代码
  stockName: string,      // 股票名称
  points: number,         // 打赏积分
  message: string,        // 留言（可选）
  createTime: Date
}
```

### stock_donation_stats 字段说明

```javascript
{
  stockCode: string,      // 股票代码
  stockName: string,      // 股票名称
  totalPoints: number,    // 总打赏积分
  donorCount: number,     // 打赏人数
  createTime: Date,
  updateTime: Date
}
```

## 积分系统

### 获取途径

| 任务 | 积分 | 说明 |
|------|------|------|
| **录入错题** | +10 | 每记录1条错题 |
| **观看广告** | +20 | 完整观看激励视频 |
| **每日签到** | +5 | 每日首次签到 |
| **连续签到** | +10 | 连续7天额外奖励 |

### 消耗途径

| 用途 | 积分 | 说明 |
|------|------|------|
| **股票打赏** | 10-10000 | 打赏任意A股股票 |

### 云函数接口

#### getPoints - 获取用户积分信息
```javascript
wx.cloud.callFunction({
  name: 'getPoints'
}).then(res => {
  // res.result.data = { points, totalPoints, checkInStreak, lastCheckIn }
})
```

#### checkIn - 每日签到
```javascript
wx.cloud.callFunction({
  name: 'checkIn'
}).then(res => {
  // res.result.data = { points, totalPoints, checkInStreak, basePoints, bonusPoints }
})
```

#### addPoints - 增加积分
```javascript
wx.cloud.callFunction({
  name: 'addPoints',
  data: {
    type: 'ad',              // 类型
    points: 20,              // 积分数量
    description: '观看广告奖励',
    relatedId: ''            // 可选：关联ID
  }
})
```

#### getPointsRecords - 获取积分记录
```javascript
wx.cloud.callFunction({
  name: 'getPointsRecords',
  data: {
    page: 1,
    pageSize: 20,
    type: 'mistake'  // 可选：筛选类型
  }
})
```

#### addMistakeWithPoints - 录入错题并加积分
```javascript
wx.cloud.callFunction({
  name: 'addMistakeWithPoints',
  data: {
    stockCode: '000001',
    stockName: '平安银行',
    action: 'buy',
    price: 10.5,
    quantity: 100,
    mistakeTypes: ['追高买入'],
    emotion: '冲动',
    reflection: '没有等回调就买入了'
  }
})
```

## 股票打赏系统

### 页面路径

| 页面 | 路径 |
|------|------|
| 股票打赏 | `/pages/stockDonation/donate/donate` |
| 排行榜 | `/pages/stockDonation/ranking/ranking` |
| 我的打赏 | `/pages/stockDonation/myDonations/myDonations` |

### 打赏规则

- **最低打赏**: 1积分
- **最高打赏**: 10000积分
- **快捷金额**: 10, 50, 100, 500, 1000积分
- **排行榜**: 按总打赏积分降序排名

### 云函数接口

#### searchStocks - 搜索A股股票
```javascript
wx.cloud.callFunction({
  name: 'searchStocks',
  data: {
    keyword: '平安',      // 股票代码或名称
    limit: 10             // 返回数量
  }
})
```

#### donateToStock - 打赏股票
```javascript
wx.cloud.callFunction({
  name: 'donateToStock',
  data: {
    stockCode: '000001',
    stockName: '平安银行',
    points: 100,
    message: '看好这只股票'   // 可选
  }
})
```

#### getStockRanking - 获取排行榜
```javascript
wx.cloud.callFunction({
  name: 'getStockRanking',
  data: {
    page: 1,
    pageSize: 20,
    period: 'all'          // all(总榜)/week(本周)/month(本月)
  }
})
```

#### getUserDonations - 获取用户打赏记录
```javascript
wx.cloud.callFunction({
  name: 'getUserDonations',
  data: {
    page: 1,
    pageSize: 20
  }
})
```

## 前端页面说明

### pages/points/points.js
- 积分中心主页面
- 显示当前积分、累计积分、连续签到天数
- 任务列表和快速入口
- 已连接真实云函数数据

### pages/points/records/
- 积分明细页面
- 支持按类型筛选
- 上拉加载更多
- 下拉刷新

### pages/stockDonation/donate/
- 股票打赏页面
- 搜索A股股票
- 选择打赏金额
- 提交打赏并扣除积分

### pages/stockDonation/ranking/
- 股票打赏排行榜
- 按总积分排名
- 显示我的打赏统计
- 支持总榜/本周/本月筛选

### pages/stockDonation/myDonations/
- 我的打赏记录
- 显示打赏统计
- 查看历史打赏记录

## 样式规范

- 主色：#e94560（红色，警示感）
- 背景：#1a1a2e（深蓝黑）
- 次要背景：#16213e
- 文字：#333 / #666 / #999
- 卡片背景：#fff
- 页面背景：#f5f5f5
- 积分/打赏主题色：#667eea（紫蓝渐变）

## 待开发/优化

- [ ] 积分兑换功能
- [ ] 积分排行榜
- [ ] 邀请好友得积分
- [ ] 分享得积分
- [ ] 广告单元ID配置（替换 adunit-xxxxxxxxxxxx）
- [ ] 接入真实股票行情API（替换 searchStocks 模拟数据）
- [ ] 排行榜周榜/月榜数据聚合
- [ ] 打赏留言展示在排行榜
