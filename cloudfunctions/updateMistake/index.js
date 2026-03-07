const cloud = require('wx-server-sdk')
cloud.init()

// 字段长度限制配置
const FIELD_LIMITS = {
  stockName: { max: 50, label: '股票名称' },
  stockCode: { max: 20, label: '股票代码' },
  emotion: { max: 20, label: '情绪' },
  reflection: { max: 500, label: '反思' }
}

// 数值范围限制
const NUMBER_LIMITS = {
  price: { min: 0.01, max: 100000, label: '价格' },
  quantity: { min: 1, max: 10000000, label: '数量' },
  lossAmount: { min: 0, max: 100000000, label: '亏损金额', allowNull: true }
}

/**
 * 校验字符串长度
 */
function validateStringLength(value, fieldName, maxLength) {
  if (value === null || value === undefined || value === '') {
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
    return { valid: true }
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
    id,
    stockName, 
    stockCode, 
    mistakeTypes, 
    emotion, 
    reflection, 
    lossAmount,
    price,
    quantity,
    date
  } = event
  
  if (!id) {
    return { success: false, error: '记录ID不能为空' }
  }
  
  try {
    const db = cloud.database()
    
    // 检查权限
    const record = await db.collection('mistakes').doc(id).get()
    if (!record.data) {
      return { success: false, error: '记录不存在' }
    }
    if (record.data._openid !== OPENID) {
      return { success: false, error: '无权修改' }
    }
    
    const updateData = {}
    
    // 股票名称校验
    if (stockName !== undefined) {
      if (!stockName.trim()) {
        return { success: false, error: '股票名称不能为空' }
      }
      const result = validateStringLength(stockName, FIELD_LIMITS.stockName.label, FIELD_LIMITS.stockName.max)
      if (!result.valid) return { success: false, error: result.error }
      updateData.stockName = stockName.trim()
    }
    
    // 股票代码校验
    if (stockCode !== undefined) {
      if (!stockCode.trim()) {
        return { success: false, error: '股票代码不能为空' }
      }
      const result = validateStringLength(stockCode, FIELD_LIMITS.stockCode.label, FIELD_LIMITS.stockCode.max)
      if (!result.valid) return { success: false, error: result.error }
      updateData.stockCode = stockCode.trim()
    }
    
    // 错误类型校验
    if (mistakeTypes !== undefined) {
      if (!Array.isArray(mistakeTypes) || mistakeTypes.length === 0) {
        return { success: false, error: '请至少选择一种错误类型' }
      }
      for (const type of mistakeTypes) {
        const result = validateStringLength(type, '错误类型', 50)
        if (!result.valid) return { success: false, error: result.error }
      }
      updateData.mistakeTypes = mistakeTypes.map(t => String(t).trim()).filter(t => t)
    }
    
    // 情绪校验
    if (emotion !== undefined) {
      const result = validateStringLength(emotion, FIELD_LIMITS.emotion.label, FIELD_LIMITS.emotion.max)
      if (!result.valid) return { success: false, error: result.error }
      updateData.emotion = emotion ? String(emotion).trim() : ''
    }
    
    // 反思校验
    if (reflection !== undefined) {
      const result = validateStringLength(reflection, FIELD_LIMITS.reflection.label, FIELD_LIMITS.reflection.max)
      if (!result.valid) return { success: false, error: result.error }
      updateData.reflection = reflection ? String(reflection).trim() : ''
    }
    
    // 亏损金额校验
    if (lossAmount !== undefined) {
      const result = validateNumber(lossAmount, NUMBER_LIMITS.lossAmount.label, NUMBER_LIMITS.lossAmount.min, NUMBER_LIMITS.lossAmount.max, NUMBER_LIMITS.lossAmount.allowNull)
      if (!result.valid) return { success: false, error: result.error }
      updateData.lossAmount = result.value !== null ? result.value : 0
    }
    
    // 价格校验
    if (price !== undefined && price !== '') {
      const result = validateNumber(price, NUMBER_LIMITS.price.label, NUMBER_LIMITS.price.min, NUMBER_LIMITS.price.max)
      if (!result.valid) return { success: false, error: result.error }
      updateData.price = result.value
    }
    
    // 数量校验
    if (quantity !== undefined && quantity !== '') {
      const result = validateNumber(quantity, NUMBER_LIMITS.quantity.label, NUMBER_LIMITS.quantity.min, NUMBER_LIMITS.quantity.max)
      if (!result.valid) return { success: false, error: result.error }
      updateData.quantity = Math.round(result.value)
    }
    
    // 日期校验
    if (date !== undefined) {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return { success: false, error: '无效的日期格式' }
      }
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (dateObj.getTime() > today.getTime()) {
        return { success: false, error: '交易日期不能是未来日期' }
      }
      updateData.date = dateObj
    }
    
    // 执行更新
    await db.collection('mistakes').doc(id).update({
      data: {
        ...updateData,
        updateTime: new Date()
      }
    })
    
    return { success: true }
  } catch (err) {
    console.error('Update mistake error:', err)
    return { success: false, error: err.message }
  }
}