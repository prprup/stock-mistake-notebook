const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 搜索A股股票
 * @param {string} keyword - 搜索关键词（股票代码或名称）
 * @param {number} limit - 返回数量，默认10
 */
exports.main = async (event, context) => {
  const { keyword, limit = 10 } = event

  if (!keyword || keyword.trim() === '') {
    return {
      code: -1,
      message: '请输入搜索关键词'
    }
  }

  try {
    // 这里应该调用Tushare API获取真实股票数据
    // 为了演示，先返回模拟数据
    // 实际使用时需要接入Tushare或其他行情API
    
    const mockStocks = [
      { code: '000001', name: '平安银行', py: 'PAYH' },
      { code: '000002', name: '万科A', py: 'WKA' },
      { code: '000333', name: '美的集团', py: 'MDJT' },
      { code: '000568', name: '泸州老窖', py: 'LZLJ' },
      { code: '000651', name: '格力电器', py: 'GLDQ' },
      { code: '000725', name: '京东方A', py: 'JDFA' },
      { code: '000858', name: '五粮液', py: 'WLY' },
      { code: '002001', name: '新和成', py: 'XHC' },
      { code: '002007', name: '华兰生物', py: 'HLSW' },
      { code: '002024', name: '苏宁易购', py: 'SNG' },
      { code: '002027', name: '分众传媒', py: 'FZCM' },
      { code: '002142', name: '宁波银行', py: 'NBYH' },
      { code: '002230', name: '科大讯飞', py: 'KDXF' },
      { code: '002236', name: '大华股份', py: 'DHGF' },
      { code: '002271', name: '东方雨虹', py: 'DFYH' },
      { code: '002304', name: '洋河股份', py: 'YHGF' },
      { code: '002352', name: '顺丰控股', py: 'SFKG' },
      { code: '002415', name: '海康威视', py: 'HKWS' },
      { code: '002460', name: '赣锋锂业', py: 'GFLY' },
      { code: '002475', name: '立讯精密', py: 'LXJM' },
      { code: '002594', name: '比亚迪', py: 'BYD' },
      { code: '002714', name: '牧原股份', py: 'MYGF' },
      { code: '002812', name: '恩捷股份', py: 'EJGF' },
      { code: '300003', name: '乐普医疗', py: 'LPYL' },
      { code: '300014', name: '亿纬锂能', py: 'YWLN' },
      { code: '300015', name: '爱尔眼科', py: 'AEYK' },
      { code: '300033', name: '同花顺', py: 'THS' },
      { code: '300059', name: '东方财富', py: 'DFCF' },
      { code: '300124', name: '汇川技术', py: 'HCJS' },
      { code: '300142', name: '沃森生物', py: 'WSSW' },
      { code: '300274', name: '阳光电源', py: 'YGDY' },
      { code: '300408', name: '三环集团', py: 'SHJT' },
      { code: '300413', name: '芒果超媒', py: 'MGCM' },
      { code: '300433', name: '蓝思科技', py: 'LSKJ' },
      { code: '300498', name: '温氏股份', py: 'WSGF' },
      { code: '300750', name: '宁德时代', py: 'NDSD' },
      { code: '600000', name: '浦发银行', py: 'PFYH' },
      { code: '600009', name: '上海机场', py: 'SHJC' },
      { code: '600016', name: '民生银行', py: 'MSYH' },
      { code: '600028', name: '中国石化', py: 'ZGSH' },
      { code: '600030', name: '中信证券', py: 'ZXZQ' },
      { code: '600031', name: '三一重工', py: 'SYZG' },
      { code: '600036', name: '招商银行', py: 'ZSYH' },
      { code: '600048', name: '保利地产', py: 'BLDC' },
      { code: '600050', name: '中国联通', py: 'ZGLT' },
      { code: '600104', name: '上汽集团', py: 'SQJT' },
      { code: '600276', name: '恒瑞医药', py: 'HRYY' },
      { code: '600309', name: '万华化学', py: 'WMHX' },
      { code: '600519', name: '贵州茅台', py: 'GZMT' },
      { code: '600547', name: '山东黄金', py: 'SDHJ' },
      { code: '600585', name: '海螺水泥', py: 'HLSN' },
      { code: '600588', name: '用友网络', py: 'YYWL' },
      { code: '600690', name: '海尔智家', py: 'HEZJ' },
      { code: '600703', name: '三安光电', py: 'SAGD' },
      { code: '600745', name: '闻泰科技', py: 'WTKJ' },
      { code: '600809', name: '山西汾酒', py: 'SXFJ' },
      { code: '600887', name: '伊利股份', py: 'YLGF' },
      { code: '601012', name: '隆基股份', py: 'LJGF' },
      { code: '601066', name: '中信建投', py: 'ZXJT' },
      { code: '601088', name: '中国神华', py: 'ZGSH' },
      { code: '601100', name: '恒立液压', py: 'HLZY' },
      { code: '601138', name: '工业富联', py: 'GYFL' },
      { code: '601166', name: '兴业银行', py: 'XYYH' },
      { code: '601211', name: '国泰君安', py: 'GTJA' },
      { code: '601288', name: '农业银行', py: 'NYYH' },
      { code: '601318', name: '中国平安', py: 'ZGPA' },
      { code: '601398', name: '工商银行', py: 'GSYH' },
      { code: '601601', name: '中国太保', py: 'ZGTB' },
      { code: '601628', name: '中国人寿', py: 'ZGRS' },
      { code: '601668', name: '中国建筑', py: 'ZGJZ' },
      { code: '601688', name: '华泰证券', py: 'HTZQ' },
      { code: '601888', name: '中国中免', py: 'ZGZM' },
      { code: '601899', name: '紫金矿业', py: 'ZJKY' },
      { code: '601933', name: '永辉超市', py: 'YXCS' },
      { code: '603019', name: '中科曙光', py: 'ZKSG' },
      { code: '603288', name: '海天味业', py: 'HTWY' },
      { code: '603501', name: '韦尔股份', py: 'WEGF' },
      { code: '603659', name: '璞泰来', py: 'PTL' },
      { code: '603799', name: '华友钴业', py: 'HYGY' },
      { code: '603986', name: '兆易创新', py: 'ZYCX' },
      { code: '688005', name: '容百科技', py: 'RBKJ' },
      { code: '688008', name: '澜起科技', py: 'LQKJ' },
      { code: '688009', name: '中国通号', py: 'ZGTT' },
      { code: '688012', name: '中微公司', py: 'ZWGS' },
      { code: '688036', name: '传音控股', py: 'CYKG' },
      { code: '688111', name: '金山办公', py: 'JSBG' },
      { code: '688126', name: '沪硅产业', py: 'HGCY' },
      { code: '688169', name: '石头科技', py: 'STKJ' },
      { code: '688363', name: '华熙生物', py: 'HXSW' },
      { code: '688599', name: '天合光能', py: 'THGN' }
    ]

    // 根据关键词筛选
    const searchKey = keyword.toUpperCase()
    const results = mockStocks.filter(stock => {
      return stock.code.includes(searchKey) || 
             stock.name.includes(keyword) ||
             stock.py.includes(searchKey)
    }).slice(0, limit)

    return {
      code: 0,
      data: results,
      message: results.length > 0 ? '搜索成功' : '未找到匹配的股票'
    }
  } catch (err) {
    console.error('搜索股票失败:', err)
    return {
      code: -1,
      message: '搜索失败',
      error: err.message
    }
  }
}