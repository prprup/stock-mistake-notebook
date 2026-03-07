# 股票错题本 UniApp 项目代码审查报告

## 按严重程度排序的问题列表

---

## 🔴 严重问题 (Critical)

### 1. 安全漏洞：updateMistake 云函数允许修改任意字段
**文件位置**: `cloudfunctions/updateMistake/index.js`

**问题描述**:
```javascript
const { id, ...updateData } = event
// ...
await db.collection('mistakes').where({
  _openid: OPENID,
  _id: id
}).update({
  data: {
    ...updateData,  // 危险：用户可传入任意字段
    updateTime: new Date()
  }
})
```

**可能的影响**:
- 用户可以修改 `_openid` 字段，将错题记录转移给其他用户
- 可以修改 `_id` 字段，导致数据库混乱
- 可以修改 `createTime` 等系统字段

**建议修复方案**:
```javascript
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id, stockName, stockCode, mistakeTypes, emotion, reflection, lossAmount, date, images } = event
  
  if (!id) {
    return { success: false, error: '记录ID不能为空' }
  }
  
  try {
    const db = cloud.database()
    
    // 构建更新数据，只包含允许的字段
    const updateData = {}
    if (stockName !== undefined) updateData.stockName = stockName
    if (stockCode !== undefined) updateData.stockCode = stockCode
    if (mistakeTypes !== undefined) updateData.mistakeTypes = mistakeTypes
    if (emotion !== undefined) updateData.emotion = emotion
    if (reflection !== undefined) updateData.reflection = reflection
    if (lossAmount !== undefined) updateData.lossAmount = lossAmount
    if (date !== undefined) updateData.date = date
    if (images !== undefined) updateData.images = images
    
    updateData.updateTime = new Date()
    
    await db.collection('mistakes').where({
      _openid: OPENID,
      _id: id
    }).update({
      data: updateData
    })
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
```

---

### 2. 安全漏洞：updatePlan 云函数同样允许修改任意字段
**文件位置**: `cloudfunctions/updatePlan/index.js`

**问题描述**: 与 updateMistake 相同，使用 `...updateData` 展开操作符允许用户修改任意字段。

**建议修复方案**: 采用白名单方式，只允许修改特定字段。

---

### 3. deleteMistake 云函数缺少 ID 校验且没有使用事务
**文件位置**: `cloudfunctions/deleteMistake/index.js`

**问题描述**:
```javascript
const { id } = event  // 没有校验 id 是否为空
// ...
await db.collection('mistakes').where({
  _openid: OPENID,
  _id: id
}).remove()

// 更新用户错题计数 - 如果上面的删除失败，这里也会执行
await db.collection('users').where({
  _openid: OPENID
}).update({
  data: {
    mistakeCount: db.command.inc(-1),  // 计数错误减少
    updateTime: new Date()
  }
})
```

**可能的影响**:
- id 为空时可能误删其他记录
- 删除失败但计数减少，导致数据不一致

**建议修复方案**:
```javascript
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event
  
  if (!id) {
    return { success: false, error: '记录ID不能为空' }
  }
  
  try {
    const db = cloud.database()
    
    // 使用事务确保数据一致性
    const transaction = await db.startTransaction()
    
    try {
      // 先检查记录是否存在
      const { data } = await transaction.collection('mistakes').where({
        _openid: OPENID,
        _id: id
      }).get()
      
      if (data.length === 0) {
        await transaction.rollback()
        return { success: false, error: '记录不存在' }
      }
      
      // 删除记录
      await transaction.collection('mistakes').doc(id).remove()
      
      // 更新用户计数
      await transaction.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          mistakeCount: db.command.inc(-1),
          updateTime: new Date()
        }
      })
      
      await transaction.commit()
      return { success: true }
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
```

---

### 4. searchStock 云函数性能严重问题
**文件位置**: `cloudfunctions/searchStock/index.js`

**问题描述**:
```javascript
// 每次请求都拉取全部股票数据（可能几千条），在内存中过滤
const response = await axios.post(TUSHARE_API, {
  api_name: 'stock_basic',
  token: TUSHARE_TOKEN,
  params: { list_status: 'L' },
  fields: 'ts_code,symbol,name,area,industry,list_date'
})

// 在内存中过滤
const results = items.filter(stock => 
  stock.name.includes(keyword) || 
  stock.symbol.includes(keyword) ||
  stock.ts_code.includes(keyword)
)
```

**可能的影响**:
- API 响应慢，浪费带宽
- 云函数内存占用高
- 用户体验差

**建议修复方案**:
```javascript
exports.main = async (event, context) => {
  const { keyword } = event
  
  // 参数校验
  if (!keyword || typeof keyword !== 'string') {
    return { success: false, error: '搜索关键词不能为空' }
  }
  
  if (keyword.length < 2) {
    return { success: false, error: '搜索关键词至少2个字符' }
  }
  
  if (keyword.length > 20) {
    return { success: false, error: '搜索关键词过长' }
  }
  
  try {
    // 先查本地缓存的股票列表
    const db = cloud.database()
    const cacheKey = 'stock_basic_cache'
    
    let stockList = []
    const { data: cacheData } = await db.collection('system_cache').where({
      cacheKey
    }).get()
    
    if (cacheData.length > 0) {
      const cache = cacheData[0]
      // 缓存24小时
      if (Date.now() - new Date(cache.updateTime).getTime() < 24 * 60 * 60 * 1000) {
        stockList = cache.data
      }
    }
    
    // 缓存不存在或过期，从API获取
    if (stockList.length === 0) {
      const response = await axios.post(TUSHARE_API, {
        api_name: 'stock_basic',
        token: TUSHARE_TOKEN,
        params: { list_status: 'L' },
        fields: 'ts_code,symbol,name,area,industry,list_date'
      })
      
      if (response.data.code !== 0) {
        return { success: false, error: response.data.msg }
      }
      
      const fields = response.data.data.fields
      const items = response.data.data.items
      
      stockList = items.map(item => {
        const obj = {}
        fields.forEach((field, index) => {
          obj[field] = item[index]
        })
        return obj
      })
      
      // 更新缓存
      if (cacheData.length > 0) {
        await db.collection('system_cache').doc(cacheData[0]._id).update({
          data: { data: stockList, updateTime: new Date() }
        })
      } else {
        await db.collection('system_cache').add({
          data: { cacheKey, data: stockList, createTime: new Date(), updateTime: new Date() }
        })
      }
    }
    
    // 过滤搜索
    const keywordLower = keyword.toLowerCase()
    const results = stockList
      .filter(stock => 
        stock.name.toLowerCase().includes(keywordLower) || 
        stock.symbol.includes(keyword) ||
        stock.ts_code.toLowerCase().includes(keywordLower)
      )
      .slice(0, 20)
    
    return {
      success: true,
      data: results.map(s => ({
        tsCode: s.ts_code,
        symbol: s.symbol,
        name: s.name,
        area: s.area,
        industry: s.industry
      }))
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
```

---

## 🟠 中等问题 (High)

### 5. getKlineData 云函数缓存查询逻辑错误
**文件位置**: `cloudfunctions/getKlineData/index.js`

**问题描述**:
```javascript
const { data: cacheData } = await db.collection('kline_cache').where({
  tsCode,
  startDate: db.command.lte(startDate),  // 逻辑错误
  endDate: db.command.gte(endDate)       // 逻辑错误
}).get()
```

这里的逻辑是反的。应该查询：缓存的 startDate <= 请求的 startDate 且缓存的 endDate >= 请求的 endDate。

**建议修复方案**:
```javascript
const { data: cacheData } = await db.collection('kline_cache').where({
  tsCode,
  startDate: db.command.lte(startDate),  // 缓存起始日期 <= 请求的起始日期
  endDate: db.command.gte(endDate)       // 缓存结束日期 >= 请求的结束日期
}).get()
```

注意：这个逻辑实际是正确的（缓存范围包含请求范围），但当前数据库结构可能不支持这种查询，需要考虑重新设计缓存策略。

---

### 6. getKlineWithMistakes 云函数缓存查询逻辑错误
**文件位置**: `cloudfunctions/getKlineWithMistakes/index.js`

**问题描述**: 与 getKlineData 相同，缓存查询条件逻辑需要检查。

---

### 7. addPlan 云函数缺少数值校验
**文件位置**: `cloudfunctions/addPlan/index.js`

**问题描述**:
```javascript
targetPrice,  // 没有校验是否为有效数字
stopLoss: stopLoss || null,  // 空字符串会转为 null
takeProfit: takeProfit || null,
position: position || 0,  // 没有校验范围
```

**建议修复方案**:
```javascript
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { 
    stockName, stockCode, action, date,
    targetPrice, stopLoss, takeProfit, position,
    triggerCondition, reason
  } = event
  
  // 基础校验
  if (!stockName || !stockCode) {
    return { success: false, error: '股票名称和代码不能为空' }
  }
  
  // 数值校验
  const targetPriceNum = parseFloat(targetPrice)
  if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
    return { success: false, error: '目标价位必须是大于0的数字' }
  }
  
  const stopLossNum = stopLoss ? parseFloat(stopLoss) : null
  if (stopLoss !== undefined && stopLoss !== '' && stopLoss !== null) {
    if (isNaN(stopLossNum) || stopLossNum <= 0) {
      return { success: false, error: '止损价位必须是大于0的数字' }
    }
  }
  
  const takeProfitNum = takeProfit ? parseFloat(takeProfit) : null
  if (takeProfit !== undefined && takeProfit !== '' && takeProfit !== null) {
    if (isNaN(takeProfitNum) || takeProfitNum <= 0) {
      return { success: false, error: '止盈价位必须是大于0的数字' }
    }
  }
  
  const positionNum = parseInt(position) || 0
  if (positionNum < 0 || positionNum > 100) {
    return { success: false, error: '仓位百分比必须在0-100之间' }
  }
  
  // 字符串长度校验
  if (triggerCondition && triggerCondition.length > 200) {
    return { success: false, error: '触发条件不能超过200字符' }
  }
  if (reason && reason.length > 500) {
    return { success: false, error: '交易理由不能超过500字符' }
  }
  
  // ... 后续逻辑
}
```

---

### 8. manual.vue 页面数值计算问题
**文件位置**: `pages/record/manual.vue`

**问题描述**:
```javascript
lossAmount: parseFloat(this.price) * parseInt(this.quantity)
// price 和 quantity 是字符串，可能为 '' 或无效值
```

**建议修复方案**:
```javascript
async submit() {
  // ... 其他校验
  
  const priceNum = parseFloat(this.price)
  const quantityNum = parseInt(this.quantity)
  
  if (isNaN(priceNum) || priceNum <= 0) {
    uni.showToast({ title: '请输入有效的价格', icon: 'none' })
    return
  }
  
  if (isNaN(quantityNum) || quantityNum <= 0) {
    uni.showToast({ title: '请输入有效的数量', icon: 'none' })
    return
  }
  
  const result = await addMistake({
    // ...
    lossAmount: priceNum * quantityNum,
    // ...
  })
  // ...
}
```

---

### 9. detail.vue 页面格式化函数缺少空值校验
**文件位置**: `pages/plan/detail.vue`

**问题描述**:
```javascript
formatMonth(dateStr) {
  const date = new Date(dateStr)  // dateStr 可能为 null/undefined
  return `${date.getMonth() + 1}月`
},
formatDay(dateStr) {
  const date = new Date(dateStr)
  return String(date.getDate()).padStart(2, '0')
}
```

**建议修复方案**:
```javascript
formatMonth(dateStr) {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '--'
  return `${date.getMonth() + 1}月`
},
formatDay(dateStr) {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '--'
  return String(date.getDate()).padStart(2, '0')
}
```

---

### 10. mistakes.vue 页面 setFilter 调用参数未使用
**文件位置**: `pages/mistakes/mistakes.vue`

**问题描述**:
```javascript
setFilter(filter) {
  this.currentFilter = filter
  this.loadMistakes(filter)  // 传入了 filter
},
async loadMistakes() {  // 但没有使用
  // ...
  const res = await getMistakes()  // 没有传入筛选参数
```

**建议修复方案**:
```javascript
async loadMistakes(filter = 'all') {
  uni.showLoading({ title: '加载中...' })
  const res = await getMistakes({ 
    mistakeType: filter === 'all' ? undefined : filter 
  })
  // ...
}
```

---

## 🟡 低等问题 (Medium)

### 11. getUserStats 中 calculateStreak 函数日期处理问题
**文件位置**: `cloudfunctions/getUserStats/index.js`

**问题描述**:
```javascript
const date = new Date(item.createTime || item.date)
const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
// item.date 可能不是有效的日期格式
```

**建议修复方案**: 添加日期有效性校验。

---

### 12. manual.vue 页面 searchTimer 未在组件销毁时清除
**文件位置**: `pages/record/manual.vue`

**问题描述**:
```javascript
data() {
  return {
    searchTimer: null  // 定时器
  }
},
// 没有 onUnload 或 beforeDestroy 钩子来清除定时器
```

**建议修复方案**:
```javascript
onUnload() {
  if (this.searchTimer) {
    clearTimeout(this.searchTimer)
    this.searchTimer = null
  }
}
```

---

### 13. plan/edit.vue 同样存在 searchTimer 未清除问题
**文件位置**: `pages/plan/edit.vue`

**建议修复方案**: 添加 onUnload 钩子清除定时器。

---

### 14. executePlan 方法 URL 编码问题
**文件位置**: `pages/plan/plan.vue`

**问题描述**:
```javascript
executePlan(item) {
  const params = new URLSearchParams()
  params.append('planId', item._id)
  params.append('stockName', item.stockName)  // 可能包含特殊字符
  // ...
  uni.navigateTo({
    url: `/pages/record/manual?${params.toString()}`
  })
}
```

**建议修复方案**:
```javascript
executePlan(item) {
  const query = encodeURIComponent(JSON.stringify({
    planId: item._id,
    stockName: item.stockName,
    stockCode: item.stockCode,
    action: item.action,
    planPrice: item.targetPrice
  }))
  
  uni.navigateTo({
    url: `/pages/record/manual?data=${query}`
  })
}
// 在 manual.vue 中解析
onLoad(options) {
  if (options.data) {
    const data = JSON.parse(decodeURIComponent(options.data))
    // ...
  }
}
```

---

### 15. updateUser 云函数缺少字段校验
**文件位置**: `cloudfunctions/updateUser/index.js`

**问题描述**:
```javascript
await db.collection('users').where({
  _openid: OPENID
}).update({
  data: {
    nickname,    // 没有长度限制
    avatarUrl,   // 没有格式校验
    updateTime: new Date()
  }
})
```

**建议修复方案**: 添加字段长度和格式校验。

---

### 16. getAnalysisStats 可能存在性能问题
**文件位置**: `cloudfunctions/getAnalysisStats/index.js`

**问题描述**:
```javascript
const mistakesResult = await db.collection('mistakes')
  .where({ _openid: OPENID })
  .get()  // 获取用户的所有错题，数据量大时可能超时
```

**建议修复方案**: 使用聚合查询或分页处理。

---

## 🟢 轻微问题 (Low)

### 17. login 云函数未使用 code 参数
**文件位置**: `cloudfunctions/login/index.js`

**问题描述**:
```javascript
const { code } = event  // 接收了 code 参数
// ...
const { OPENID } = cloud.getWXContext()  // 但没有使用，直接通过上下文获取
```

**说明**: 这不是错误，但 code 参数未被使用，可以移除或添加注释说明。

---

### 18. deletePlan 和 deleteMistake 缺少事务
**文件位置**: `cloudfunctions/deletePlan/index.js`

**问题描述**: 虽然操作单一，但如果后续需要级联删除相关数据，应该使用事务。

---

### 19. App.vue 生命周期空实现
**文件位置**: `App.vue`

**问题描述**: 生命周期方法只有 console.log，可以移除或添加实际逻辑。

---

### 20. 多处代码重复
**文件位置**: 多个文件

**问题描述**: 
- `manual.vue` 和 `edit.vue` 的股票搜索逻辑高度重复
- 日期格式化函数在多个组件中重复定义

**建议修复方案**: 提取公共工具函数。

---

## 📋 修复优先级建议

| 优先级 | 问题 | 文件 |
|--------|------|------|
| P0 | updateMistake 安全漏洞 | cloudfunctions/updateMistake/index.js |
| P0 | updatePlan 安全漏洞 | cloudfunctions/updatePlan/index.js |
| P0 | deleteMistake 缺少事务 | cloudfunctions/deleteMistake/index.js |
| P1 | searchStock 性能问题 | cloudfunctions/searchStock/index.js |
| P1 | addPlan 数值校验 | cloudfunctions/addPlan/index.js |
| P1 | manual.vue 数值计算 | pages/record/manual.vue |
| P2 | detail.vue 空值校验 | pages/plan/detail.vue |
| P2 | mistakes.vue 筛选参数 | pages/mistakes/mistakes.vue |
| P2 | 定时器未清除 | manual.vue, edit.vue |
| P3 | 其他优化项 | 多个文件 |

---

## 🔒 安全建议总结

1. **永远不要在云函数中使用 `...event` 或 `...updateData` 直接展开到数据库操作中**
2. **始终使用白名单方式校验输入字段**
3. **对数值类型进行有效性校验（NaN 检查）**
4. **对字符串长度进行限制**
5. **涉及多个数据库操作的必须使用事务**
6. **避免在内存中处理大量数据**

---

*报告生成时间: 2026-03-07*
