# 错题本小程序 - 开发说明

## 项目结构

```
miniprogram/
├── app.js                 # 小程序入口
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── pages/
│   ├── index/             # 首页
│   │   ├── index.js
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── record/            # 记录模块
│   │   ├── record.js      # 记录入口（选择方式）
│   │   ├── record.wxml
│   │   ├── record.wxss
│   │   ├── manual/        # 手动录入
│   │   │   ├── manual.js
│   │   │   ├── manual.wxml
│   │   │   └── manual.wxss
│   │   └── ocr/           # 截图识别
│   │       ├── ocr.js
│   │       ├── ocr.wxml
│   │       └── ocr.wxss
│   ├── mistakes/          # 错题列表
│   │   ├── mistakes.js
│   │   ├── mistakes.wxml
│   │   ├── mistakes.wxss
│   │   └── detail/        # 错题详情
│   │       ├── detail.js
│   │       ├── detail.wxml
│   │       └── detail.wxss
│   ├── analysis/          # 统计分析
│   │   ├── analysis.js
│   │   ├── analysis.wxml
│   │   └── analysis.wxss
│   ├── square/            # 错题广场
│   │   ├── square.js
│   │   ├── square.wxml
│   │   ├── square.wxss
│   │   └── detail/        # 广场详情
│   │       ├── detail.js
│   │       ├── detail.wxml
│   │       └── detail.wxss
│   └── profile/           # 个人中心
│       ├── profile.js
│       ├── profile.wxml
│       └── profile.wxss
├── components/            # 公共组件
├── utils/                 # 工具函数
└── images/                # 图片资源
```

## 快速开始

1. 注册微信小程序账号
2. 下载微信开发者工具
3. 导入本项目
4. 开通云开发环境
5. 部署云函数和数据库

## 云开发配置

### 数据库集合

- `users` - 用户信息
- `mistakes` - 错题记录
- `mistake_types` - 错误类型配置
- `square_posts` - 广场帖子
- `likes` - 点赞记录

### 云函数

- `login` - 用户登录
- `saveMistake` - 保存错题
- `getMistakes` - 获取错题列表
- `getMistakeStats` - 获取统计数据
- `getSquarePosts` - 获取广场帖子
- `likePost` - 点赞/取消点赞

## 配色方案

- 主色：#e94560（红色，警示感）
- 背景：#1a1a2e（深蓝黑）
- 次要背景：#16213e
- 文字：#333 / #666 / #999
- 卡片背景：#fff
- 页面背景：#f5f5f5

## 待开发页面

- [ ] app.js / app.wxss
- [ ] record/record 入口页
- [ ] record/ocr OCR识别页
- [ ] mistakes/mistakes 错题列表页
- [ ] mistakes/detail 错题详情
- [ ] analysis/analysis 统计分析页
- [ ] square/detail 广场详情
- [ ] profile/profile 个人中心
