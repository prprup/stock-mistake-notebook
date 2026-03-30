const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event
  
  // 参数校验
  if (!id) {
    return {
      success: false,
      error: '记录ID不能为空'
    }
  }
  
  try {
    const db = cloud.database()
    
    const { data } = await db.collection('mistakes')
      .where({
        _openid: OPENID,
        _id: id
      })
      .get()
    
    if (data.length === 0) {
      return {
        success: false,
        error: '记录不存在或无权访问'
      }
    }
    
    let linkedPlan = null
    if (data[0].planId) {
      try {
        const planResult = await db.collection('plans').doc(data[0].planId).get()
        if (planResult.data && planResult.data._openid === OPENID) {
          linkedPlan = planResult.data
        }
      } catch (e) {
        console.error('Load linked plan failed:', e)
      }
    }

    return {
      success: true,
      data: {
        ...data[0],
        linkedPlan
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
