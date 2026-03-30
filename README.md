# uni-app 版本说明

## 转换内容

已将微信小程序原生代码转换为 uni-app 版本，主要改动：

### 文件结构变化

| 微信小程序 | uni-app |
|-----------|---------|
| `page.js` + `page.wxml` + `page.wxss` | `page.vue`（单文件组件）|
| `wx.navigateTo` | `uni.navigateTo` |
| `wx.switchTab` | `uni.switchTab` |
| `wx.showToast` | `uni.showToast` |
| `bindtap` / `bind:tap` | `@click` |
| `wx:for` / `wx:key` | `v-for` / `:key` |
| `wx:if` / `wx:else` | `v-if` / `v-else` |
| `{{}}` 绑定 | 相同 |

### 已转换页面

- [x] `pages/index/index.vue` - 首页
- [x] `pages/record/manual.vue` - 手动录入

### 待转换页面

- [ ] `pages/record/record.vue` - 记录入口
- [ ] `pages/mistakes/mistakes.vue` - 错题列表
- [ ] `pages/mistakes/detail.vue` - 错题详情
- [ ] `pages/analysis/analysis.vue` - 统计分析
- [ ] `pages/profile/profile.vue` - 个人中心

## 使用方式

1. 打开 HBuilder X
2. 文件 → 导入 → 从本地目录导入
3. 选择 `stock-mistake-notebook-uniapp` 文件夹
4. 运行 → 运行到小程序模拟器 → 微信开发者工具

## 注意事项

- uni-app 使用 Vue 3 语法
- 样式单位保持 `rpx` 不变
- 需要安装依赖：`npm install`
