const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 获取错题详情
 * @param {string} id - 错题ID
 */
exports.main = async (event, context) => {
  const { id } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!id) {
    return {
      code: -1,
      message: '缺少错题ID'
    }
  }

  try {
    const result = await db.collection('mistakes').doc(id).get()
    
    if (!result.data) {
      return {
        code: -1,
        message: '错题不存在'
      }
    }

    const mistake = result.data

    // 检查是否有权限查看（只能看自己的或公开的）
    if (mistake._openid !== openid && !mistake.isPublic) {
      return {
        code: -1,
        message: '无权查看此错题'
      }
    }

    // 格式化日期
    const date = new Date(mistake.createTime)
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    return {
      code: 0,
      data: {
        _id: mistake._id,
        stockCode: mistake.stockCode,
        stockName: mistake.stockName,
        action: mistake.action,
        price: mistake.price,
        quantity: mistake.quantity,
        amount: mistake.amount,
        tradeDate: mistake.tradeDate,
        mistakeTypes: mistake.mistakeTypes || [],
        emotion: mistake.emotion,
        reflection: mistake.reflection,
        screenshot: mistake.screenshot,
        isPublic: mistake.isPublic,
        isMyMistake: mistake._openid === openid,
        formattedDate: formattedDate
      }
    }
  } catch (err) {
    console.error('获取错题详情失败:', err)
    return {
      code: -1,
      message: '获取详情失败',
      error: err.message
    }
  }
}