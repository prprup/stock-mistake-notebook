const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 录入错题并增加积分
 * 事务性操作：保证错题录入和积分增加同时成功或失败
 */
exports.main = async (event, context) => {
  const { 
    stockCode, 
    stockName, 
    action, 
    price, 
    quantity, 
    amount,
    tradeDate,
    mistakeTypes,
    emotion,
    reflection,
    screenshot
  } = event
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  // 参数校验
  if (!stockCode || !stockName || !action || !price || !quantity) {
    return {
      code: -1,
      message: '参数错误: 股票代码、名称、操作、价格、数量为必填项'
    }
  }

  if (!['buy', 'sell'].includes(action)) {
    return {
      code: -1,
      message: '操作类型错误: 只能是 buy 或 sell'
    }
  }

  try {
    // 1. 录入错题
    const mistakeData = {
      _openid: openid,
      stockCode: stockCode,
      stockName: stockName,
      action: action,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      amount: amount ? parseFloat(amount) : parseFloat(price) * parseInt(quantity),
      tradeDate: tradeDate || new Date().toISOString().split('T')[0],
      mistakeTypes: mistakeTypes || [],
      emotion: emotion || '',
      reflection: reflection || '',
      screenshot: screenshot || '',
      isPublic: false,
      pointsAwarded: 10, // 记录已发放积分
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const mistakeResult = await db.collection('mistakes').add({
      data: mistakeData
    })

    const mistakeId = mistakeResult._id

    // 2. 获取或创建用户积分记录
    let userPoints = await db.collection('user_points').where({
      _openid: openid
    }).get()

    let docId
    let currentPoints = 0
    let currentTotalPoints = 0

    if (userPoints.data.length === 0) {
      const newRecord = {
        _openid: openid,
        points: 0,
        totalPoints: 0,
        checkInStreak: 0,
        lastCheckIn: null,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      const result = await db.collection('user_points').add({
        data: newRecord
      })
      docId = result._id
    } else {
      docId = userPoints.data[0]._id
      currentPoints = userPoints.data[0].points
      currentTotalPoints = userPoints.data[0].totalPoints
    }

    // 3. 增加积分
    const pointsToAdd = 10
    await db.collection('user_points').doc(docId).update({
      data: {
        points: _.inc(pointsToAdd),
        totalPoints: _.inc(pointsToAdd),
        updateTime: db.serverDate()
      }
    })

    // 4. 添加积分记录
    await db.collection('points_records').add({
      data: {
        _openid: openid,
        type: 'mistake',
        points: pointsToAdd,
        description: '录入错题奖励',
        relatedId: mistakeId,
        createTime: db.serverDate()
      }
    })

    return {
      code: 0,
      message: '录入成功',
      data: {
        mistakeId: mistakeId,
        pointsAdded: pointsToAdd,
        currentPoints: currentPoints + pointsToAdd,
        totalPoints: currentTotalPoints + pointsToAdd
      }
    }
  } catch (err) {
    console.error('录入错题失败:', err)
    return {
      code: -1,
      message: '录入失败',
      error: err.message
    }
  }
}