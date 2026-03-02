# 项目运行说明

## 当前状态

项目已补充必要文件，可以运行了。

## 运行步骤

1. **打开 HBuilder X**
2. **文件 → 导入 → 从本地目录导入**
3. **选择 `stock-mistake-notebook-uniapp` 文件夹**
4. **点击工具栏「预览」按钮（或按 Ctrl+R）**

## 注意事项

### Tab 栏图标

`static/images/` 目录下的图标文件需要你自己准备：
- `home.png` / `home-active.png`
- `book.png` / `book-active.png`
- `plus.png` / `plus-active.png`
- `square.png` / `square-active.png`
- `profile.png` / `profile-active.png`

可以用简单的占位图，或从 iconfont 下载。

### 微信小程序 AppID

如果要运行到微信开发者工具，需要在 `manifest.json` 中填写你的小程序 AppID：
```json
"mp-weixin": {
  "appid": "你的小程序AppID"
}
```

### 云开发配置

数据目前是模拟的，如需真实数据，需要：
1. 开通微信云开发
2. 配置数据库和云函数

## 快速测试

先点击「预览」看效果，确认页面能正常显示后再配置其他功能。
