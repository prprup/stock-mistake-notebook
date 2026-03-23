const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 打赏股票
 * @param {string} stockCode - 股票代码
 * @param {string} stockName - 股票名称
 * @param {number} points - 打赏积分数量
 * @param {string} message - 留言（可选）
 */
exports.main = async (event, context) => {
  const { stockCode, stockName, points, message = '' } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  // 参数校验
  if (!stockCode || !stockName) {
    return {
      code: -1,
      message: '股票代码和名称不能为空'
    }
  }

  if (!points || points <= 0) {
    return {
      code: -1,
      message: '打赏积分必须大于0'
    }
  }

  // 限制单次打赏上限
  if (points > 10000) {
    return {
      code: -1,
      message: '单次打赏不能超过10000积分'
    }
  }

  try {
    // 1. 使用事务确保积分扣除的原子性，防止并发透支
    const transaction = await db.startTransaction()

    try {
      // 事务内再次检查积分余额
      let userPoints = await transaction.collection('user_points').where({
        _openid: openid
      }).get()

      if (userPoints.data.length === 0) {
        await transaction.rollback()
        return {
          code: -1,
          message: '积分不足'
        }
      }

      const userData = userPoints.data[0]
      if (userData.points < points) {
        await transaction.rollback()
        return {
          code: -1,
          message: `积分不足，当前${userData.points}积分，需要${points}积分`
        }
      }

      // 2. 事务内扣除用户积分
      await transaction.collection('user_points').doc(userData._id).update({
        data: {
          points: _.inc(-points),
          updateTime: db.serverDate()
        }
      })

      // 3. 事务内记录打赏
      const donationResult = await transaction.collection('stock_donations').add({
        data: {
          _openid: openid,
          stockCode: stockCode,
          stockName: stockName,
          points: points,
          message: message,
          createTime: db.serverDate()
        }
      })

      // 4. 事务内更新股票打赏统计
      const statsResult = await transaction.collection('stock_donation_stats').where({
        stockCode: stockCode
      }).get()

      if (statsResult.data.length === 0) {
        await transaction.collection('stock_donation_stats').add({
          data: {
            stockCode: stockCode,
            stockName: stockName,
            totalPoints: points,
            donorCount: 1,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
      } else {
        const statsDoc = statsResult.data[0]
        await transaction.collection('stock_donation_stats').doc(statsDoc._id).update({
          data: {
            totalPoints: _.inc(points),
            updateTime: db.serverDate()
          }
        })
      }

      // 5. 事务内添加积分消费记录
      await transaction.collection('points_records').add({
        data: {
          _openid: openid,
          type: 'donate',
          points: -points,
          description: `打赏 ${stockName}(${stockCode})`,
          relatedId: donationResult._id,
          createTime: db.serverDate()
        }
      })

      await transaction.commit()

      return {
        code: 0,
        message: '打赏成功',
        data: {
          donationId: donationResult._id,
          stockCode: stockCode,
          stockName: stockName,
          points: points,
          remainingPoints: userData.points - points
        }
      }
    } catch (txErr) {
      await transaction.rollback()
      throw txErr
    }
  } catch (err) {
    console.error('打赏失败:', err)
    return {
      code: -1,
      message: '打赏失败',
      error: err.message
    }
  }
}