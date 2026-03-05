const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { id, ...updateData } = event
  
  try {
    const db = cloud.database()
    
    await db.collection('mistakes').where({
      _openid: OPENID,
      _id: id
    }).update({
      data: {
        ...updateData,
        updateTime: new Date()
      }
    })
    
    return {
      success: true
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
