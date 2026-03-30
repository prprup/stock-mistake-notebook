const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const batchSize = Math.min(Math.max(Number(event.batchSize) || 100, 1), 100)
    const dryRun = !!event.dryRun
    const maxLoops = Math.max(Number(event.maxLoops) || 1000, 1)

    let scanned = 0
    let matched = 0
    let updated = 0
    let loops = 0

    while (loops < maxLoops) {
      const res = await db.collection('mistakes')
        .where({
          isPublic: _.in([true, false])
        })
        .limit(batchSize)
        .get()

      const list = (res.data || []).filter(item =>
        Object.prototype.hasOwnProperty.call(item, 'isPublic')
      )

      scanned += (res.data || []).length

      if (!list.length) {
        break
      }

      matched += list.length

      if (!dryRun) {
        for (const item of list) {
          await db.collection('mistakes').doc(item._id).update({
            data: {
              isPublic: _.remove(),
              updateTime: db.serverDate()
            }
          })
          updated += 1
        }
      }

      loops += 1

      if (list.length < batchSize) {
        break
      }
    }

    return {
      success: true,
      message: dryRun ? '试运行完成' : '历史 isPublic 字段清理完成',
      dryRun,
      batchSize,
      loops,
      scanned,
      matched,
      updated
    }
  } catch (error) {
    return {
      success: false,
      message: '清理失败',
      error: error.message
    }
  }
}
