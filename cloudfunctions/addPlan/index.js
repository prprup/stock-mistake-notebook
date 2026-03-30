const cloud = require('wx-server-sdk')
cloud.init()

// 字段长度限制配置
const FIELD_LIMITS = {
  stockName: { max: 50, label: '股票名称' },
  stockCode: { max: 20, label: '股票代码' },
  triggerCondition: { max: 200, label: '触发条件' },
  reason: { max: 500, label: '交易理由' }
}

// 数值范围限制
const NUMBER_LIMITS = {
  targetPrice: { min: 0.01, max: 100000, label: '目标价位' },
  stopLoss: { min: 0.01, max: 100000, label: '止损价位', allowNull: true },
  takeProfit: { min: 0.01, max: 100000, label: '止盈价位', allowNull: true },
  position: { min: 0, max: 100, label: '计划仓位' }
}

/**
 * 校验字符串长度
 */
function validateStringLength(value, fieldName, maxLength) {
  if (value === null || value === undefined) {
    return { valid: true }
  }
  const str = String(value)
  if (str.length > maxLength) {
    return { 
      valid: false, 
      error: `${fieldName}不能超过${maxLength}个字符` 
    }
  }
  return { valid: true }
}

/**
 * 校验数值
 */
function validateNumber(value, fieldName, min, max, allowNull = false) {
  if (value === null || value === undefined || value === '') {
    if (allowNull) {
      return { valid: true, value: null }
    }
    return { valid: false, error: `${fieldName}不能为空` }
  }
  
  const num = parseFloat(value)
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName}必须是有效数字` }
  }
  
  if (num < min || num > max) {
    return { 
      valid: false, 
      error: `${fieldName}必须在${min}到${max}之间` 
    }
  }
  
  return { valid: true, value: num }
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { 
    stockName, 
    stockCode, 
    action, 
    date,
    targetPrice,
    stopLoss,
    takeProfit,
    position,
    triggerCondition,
    reason
  } = event
  
  // 基础必填校验
  if (!stockName || !stockCode) {
    return { success: false, error: '股票名称和代码不能为空' }
  }
  
  // 字符串长度校验
  for (const [field, config] of Object.entries(FIELD_LIMITS)) {
    const result = validateStringLength(event[field], config.label, config.max)
    if (!result.valid) {
      return { success: false, error: result.error }
    }
  }
  
  // 数值校验
  const validatedNumbers = {}
  
  // targetPrice 必填
  const targetPriceResult = validateNumber(
    targetPrice, 
    NUMBER_LIMITS.targetPrice.label, 
    NUMBER_LIMITS.targetPrice.min, 
    NUMBER_LIMITS.targetPrice.max
  )
  if (!targetPriceResult.valid) {
    return { success: false, error: targetPriceResult.error }
  }
  validatedNumbers.targetPrice = targetPriceResult.value
  
  // stopLoss 可选
  const stopLossResult = validateNumber(
    stopLoss, 
    NUMBER_LIMITS.stopLoss.label, 
    NUMBER_LIMITS.stopLoss.min, 
    NUMBER_LIMITS.stopLoss.max,
    NUMBER_LIMITS.stopLoss.allowNull
  )
  if (!stopLossResult.valid) {
    return { success: false, error: stopLossResult.error }
  }
  validatedNumbers.stopLoss = stopLossResult.value
  
  // takeProfit 可选
  const takeProfitResult = validateNumber(
    takeProfit, 
    NUMBER_LIMITS.takeProfit.label, 
    NUMBER_LIMITS.takeProfit.min, 
    NUMBER_LIMITS.takeProfit.max,
    NUMBER_LIMITS.takeProfit.allowNull
  )
  if (!takeProfitResult.valid) {
    return { success: false, error: takeProfitResult.error }
  }
  validatedNumbers.takeProfit = takeProfitResult.value
  
  // position 默认为0
  const positionResult = validateNumber(
    position !== undefined ? position : 0, 
    NUMBER_LIMITS.position.label, 
    NUMBER_LIMITS.position.min, 
    NUMBER_LIMITS.position.max
  )
  if (!positionResult.valid) {
    return { success: false, error: positionResult.error }
  }
  validatedNumbers.position = Math.round(positionResult.value)
  
  try {
    const db = cloud.database()
    const now = new Date()
    
    // 处理日期字段 - 确保是 Date 类型
    let planDate = now
    if (date) {
      const dateObj = new Date(date)
      if (!isNaN(dateObj.getTime())) {
        planDate = dateObj
      }
    }
    
    const result = await db.collection('plans').add({
      data: {
        _openid: OPENID,
        stockName: String(stockName).trim(),
        stockCode: String(stockCode).trim().toUpperCase(),
        action: action === 'sell' ? 'sell' : 'buy',
        date: planDate,
        targetPrice: validatedNumbers.targetPrice,
        stopLoss: validatedNumbers.stopLoss,
        takeProfit: validatedNumbers.takeProfit,
        position: validatedNumbers.position,
        triggerCondition: triggerCondition ? String(triggerCondition).trim() : '',
        reason: reason ? String(reason).trim() : '',
        status: 'pending',
        createTime: now,
        updateTime: now
      }
    })
    
    return {
      success: true,
      data: { _id: result._id }
    }
  } catch (err) {
    console.error('Add plan error:', err)
    return { success: false, error: err.message }
  }
}
