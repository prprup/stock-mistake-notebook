// 广告配置
// ⚠️ 发布前请将 adUnitId 替换为微信广告后台的真实激励视频广告位 ID
export const REWARDED_VIDEO_AD_UNIT_ID = 'adunit-xxxxxxxxxxxx'

export const AD_REWARD_POINTS = 20
export const AD_DAILY_LIMIT = 5
export const AD_COOLDOWN_SECONDS = 30

export function isValidRewardedVideoAdUnitId(adUnitId) {
  return /^adunit-[0-9a-z]{10,}$/i.test(String(adUnitId || '')) && !String(adUnitId).includes('xxxxxxxx')
}

export function getRewardedVideoAdUnavailableReason() {
  if (!isValidRewardedVideoAdUnitId(REWARDED_VIDEO_AD_UNIT_ID)) {
    return '广告位未配置，请先替换真实 adUnitId'
  }
  return ''
}
