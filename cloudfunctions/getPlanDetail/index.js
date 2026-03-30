const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event
  
  if (!id) {
    return { success: false, error: '预案ID不能为空' }
  }
  
  try {
    const db = cloud.database()
    
    const result = await db.collection('plans').doc(id).get()
    
    if (!result.data) {
      return { success: false, error: '预案不存在' }
    }
    
    if (result.data._openid !== OPENID) {
      return { success: false, error: '无权访问' }
    }
    
    let mistake = null
    if (result.data.mistakeId) {
      try {
        const mistakeResult = await db.collection('mistakes').doc(result.data.mistakeId).get()
        if (mistakeResult.data && mistakeResult.data._openid === OPENID) {
          mistake = mistakeResult.data
        }
      } catch (e) {
        console.error('Load linked mistake failed:', e)
      }
    }

    return {
      success: true,
      data: {
        ...result.data,
        linkedMistake: mistake
      }
    }
  } catch (err) {
    console.error('Get plan detail error:', err)
    return { success: false, error: err.message }
  }
}