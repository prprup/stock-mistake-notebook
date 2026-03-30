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
    action,
    mistakeTypes, 
    emotion, 
    reflection, 
    lossAmount, 
    date,
    tradeDate,
    price,
    quantity,
    screenshot,
    planId,
    images = []
  } = event

  const POINTS_AWARD = 10
  
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
  const rawDate = tradeDate || date
  let validatedDate = rawDate
  if (rawDate) {
    const dateObj = new Date(rawDate)
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
    
    // 使用数据库事务包裹：添加错题 + 更新用户计数 + 发放积分 + 写积分记录
    const transaction = await db.startTransaction()
    
    try {
      const trimmedStockName = stockName.trim()
      const trimmedStockCode = stockCode.trim()
      const tradeAction = action && ['buy', 'sell'].includes(action) ? action : 'buy'
      const normalizedTypes = mistakeTypes.map(t => String(t).trim()).filter(t => t)
      const screenshotList = screenshot ? [String(screenshot)] : []
      const imageList = Array.isArray(images) ? images.slice(0, 9) : []
      const mergedImages = [...imageList, ...screenshotList].slice(0, 9)

      // 1. 添加错题记录
      const result = await transaction.collection('mistakes').add({
        data: {
          _openid: OPENID,
          stockName: trimmedStockName,
          stockCode: trimmedStockCode.toUpperCase(),
          action: tradeAction,
          tradeDate: validatedDate || now,
          date: validatedDate || now,
          planId: planId || '',
          mistakeTypes: normalizedTypes,
          emotion: emotion ? String(emotion).trim() : '',
          reflection: reflection ? String(reflection).trim() : '',
          lossAmount: validatedLossAmount,
          pointsAwarded: POINTS_AWARD,
          ...validatedNumbers,
          images: mergedImages,
          createTime: now,
          updateTime: now
        }
      })

      // 2. 如果来自预案，自动回写预案执行状态，形成后端闭环
      if (planId) {
        try {
          const planDoc = await transaction.collection('plans').doc(planId).get()
          if (planDoc.data && planDoc.data._openid === OPENID) {
            await transaction.collection('plans').doc(planId).update({
              data: {
                status: 'executed',
                mistakeId: result._id,
                executeTime: planDoc.data.executeTime || now,
                updateTime: now
              }
            })
          }
        } catch (e) {
          // 预案关联失败不阻断主链，避免影响错题录入
          console.error('Link plan failed:', e)
        }
      }

      // 3. 更新用户错题计数
      await transaction.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          mistakeCount: db.command.inc(1),
          updateTime: now
        }
      })

      // 4. 获取或创建用户积分记录
      let userPoints = await transaction.collection('user_points').where({
        _openid: OPENID
      }).get()

      let pointsDocId = ''
      let currentPoints = 0
      let currentTotalPoints = 0

      if (userPoints.data.length === 0) {
        const pointsResult = await transaction.collection('user_points').add({
          data: {
            _openid: OPENID,
            points: 0,
            totalPoints: 0,
            checkInStreak: 0,
            lastCheckIn: null,
            createTime: now,
            updateTime: now
          }
        })
        pointsDocId = pointsResult._id
      } else {
        pointsDocId = userPoints.data[0]._id
        currentPoints = userPoints.data[0].points || 0
        currentTotalPoints = userPoints.data[0].totalPoints || 0
      }

      // 4. 发放录入错题积分
      await transaction.collection('user_points').doc(pointsDocId).update({
        data: {
          points: db.command.inc(POINTS_AWARD),
          totalPoints: db.command.inc(POINTS_AWARD),
          updateTime: now
        }
      })

      // 5. 添加积分记录
      await transaction.collection('points_records').add({
        data: {
          _openid: OPENID,
          type: 'mistake',
          points: POINTS_AWARD,
          description: '录入错题奖励',
          relatedId: result._id,
          createTime: now
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        data: {
          _id: result._id,
          pointsAdded: POINTS_AWARD,
          currentPoints: currentPoints + POINTS_AWARD,
          totalPoints: currentTotalPoints + POINTS_AWARD
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
