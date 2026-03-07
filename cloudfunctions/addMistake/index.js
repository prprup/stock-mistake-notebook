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
    stockName, 
    stockCode, 
    mistakeTypes, 
    emotion, 
    reflection, 
    lossAmount, 
    date,
    price,
    quantity,
    images = []
  } = event
  
  // ========== 基础必填校验 ==========
  if (!stockName || !stockName.trim()) {
    return {
      success: false,
      error: '股票名称不能为空'
    }
  }
  
  if (!stockCode || !stockCode.trim()) {
    return {
      success: false,
      error: '股票代码不能为空'
    }
  }
  
  // 错误类型至少选一项
  if (!mistakeTypes || !Array.isArray(mistakeTypes) || mistakeTypes.length === 0) {
    return {
      success: false,
      error: '请至少选择一种错误类型'
    }
  }
  
  // ========== 字符串长度校验 ==========
  for (const [field, config] of Object.entries(FIELD_LIMITS)) {
    const result = validateStringLength(event[field], config.label, config.max)
    if (!result.valid) {
      return { success: false, error: result.error }
    }
  }
  
  // 校验错误类型每个项的长度
  for (const type of mistakeTypes) {
    const result = validateStringLength(type, '错误类型', 50)
    if (!result.valid) {
      return { success: false, error: result.error }
    }
  }
  
  // ========== 数值校验 ==========
  // lossAmount 可选
  const lossAmountResult = validateNumber(
    lossAmount, 
    NUMBER_LIMITS.lossAmount.label, 
    NUMBER_LIMITS.lossAmount.min, 
    NUMBER_LIMITS.lossAmount.max,
    NUMBER_LIMITS.lossAmount.allowNull
  )
  if (!lossAmountResult.valid) {
    return { success: false, error: lossAmountResult.error }
  }
  const validatedLossAmount = lossAmountResult.value !== null ? lossAmountResult.value : 0
  
  // price 和 quantity 如果传了也做校验
  const validatedNumbers = {}
  if (price !== undefined && price !== '') {
    const priceResult = validateNumber(price, NUMBER_LIMITS.price.label, NUMBER_LIMITS.price.min, NUMBER_LIMITS.price.max)
    if (!priceResult.valid) {
      return { success: false, error: priceResult.error }
    }
    validatedNumbers.price = priceResult.value
  }
  
  if (quantity !== undefined && quantity !== '') {
    const quantityResult = validateNumber(quantity, NUMBER_LIMITS.quantity.label, NUMBER_LIMITS.quantity.min, NUMBER_LIMITS.quantity.max)
    if (!quantityResult.valid) {
      return { success: false, error: quantityResult.error }
    }
    validatedNumbers.quantity = Math.round(quantityResult.value)
  }
  
  // ========== 日期校验 ==========
  let validatedDate = date
  if (date) {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return { success: false, error: '无效的日期格式' }
    }
    // 日期不能超过今天
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (dateObj.getTime() > today.getTime()) {
      return { success: false, error: '交易日期不能是未来日期' }
    }
    validatedDate = dateObj
  }
  
  try {
    const db = cloud.database()
    const now = new Date()
    
    // 使用数据库事务包裹添加错题和更新用户计数
    const transaction = await db.startTransaction()
    
    try {
      // 添加错题记录
      const result = await transaction.collection('mistakes').add({
        data: {
          _openid: OPENID,
          stockName: stockName.trim(),
          stockCode: stockCode.trim(),
          mistakeTypes: mistakeTypes.map(t => String(t).trim()).filter(t => t),
          emotion: emotion ? String(emotion).trim() : '',
          reflection: reflection ? String(reflection).trim() : '',
          lossAmount: validatedLossAmount,
          ...validatedNumbers,
          date: validatedDate || now,
          images: Array.isArray(images) ? images.slice(0, 9) : [], // 最多9张图片
          createTime: now,
          updateTime: now
        }
      })
      
      // 更新用户错题计数
      await transaction.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          mistakeCount: db.command.inc(1),
          updateTime: now
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        data: {
          _id: result._id
        }
      }
    } catch (err) {
      // 事务回滚
      await transaction.rollback()
      throw err
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
