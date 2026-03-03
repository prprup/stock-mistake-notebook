const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event
  
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
        error: '记录不存在'
      }
    }
    
    return {
      success: true,
      data: data[0]
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
