const sensitiveKeywords = [
  '色情', '色情图片', '色情视频', '涉黄', '露骨', '三级片', 'AV', '性爱', '性交',
  '恐怖', '恐怖袭击', '炸弹', '爆炸', '炸药', '枪支', '武器', '暴力', '屠杀',
  '广告', '推广', '刷单', '营销', '引流', '代购', '微商', '返利', '优惠券',
  '赌博', '博彩', '彩票', '棋牌', '赌场',
  '毒品', '大麻', '冰毒', '海洛因', '鸦片'
];

const detectSensitiveContent = (text) => {
  if (!text) return [];
  
  const foundKeywords = [];
  for (const keyword of sensitiveKeywords) {
    if (text.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }
  return foundKeywords;
};

const needsReview = (text) => {
  return detectSensitiveContent(text).length > 0;
};

module.exports = {
  sensitiveKeywords,
  detectSensitiveContent,
  needsReview
};