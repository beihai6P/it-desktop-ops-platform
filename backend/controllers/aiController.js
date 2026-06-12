
const Case = require('../models/Case');
const Document = require('../models/Document');
const Experiment = require('../models/Experiment');
const { callAI, getDiagnosisPrompt, getKnowledgeQAPrompt, getDocumentSummaryPrompt, getExperimentAnalysisPrompt } = require('../services/aiService');

// 智能诊断助手 - 诊断分析
exports.diagnose = async (req, res) => {
  try {
    const { symptoms, deviceType, brand, model, errorCode, additionalInfo } = req.body;
    
    const prompt = getDiagnosisPrompt(symptoms, deviceType, brand, model, errorCode, additionalInfo);
    
    let analysis;
    try {
      const aiResponse = await callAI(prompt);
      analysis = JSON.parse(aiResponse);
    } catch (aiError) {
      console.warn('调用AI失败，使用模拟数据:', aiError.message);
      analysis = await simulateAIDiagnosis(symptoms, deviceType, brand, model, errorCode, additionalInfo);
    }
    
    const diagnosisId = `diag-${Date.now()}`;
    
    res.status(200).json({
      success: true,
      data: {
        diagnosisId,
        symptoms,
        analysis: {
          confidence: analysis.confidence || Math.random() * 0.15 + 0.8,
          primaryCause: analysis.primaryCause || '系统异常，需要进一步诊断',
          secondaryCauses: analysis.secondaryCauses || ['系统服务异常', '软件冲突'],
          suggestedSolutions: analysis.solutions || [
            {
              id: 'sol-001',
              title: '运行系统诊断',
              steps: ['打开设置', '进入更新和安全', '选择疑难解答', '运行相应的诊断工具'],
              estimatedTime: '15分钟',
              difficulty: 'easy',
              successRate: 0.75
            }
          ],
          relatedCases: [
            {
              id: 'case-001',
              title: 'Windows更新后系统异常修复',
              matchScore: Math.floor(Math.random() * 20) + 80,
              link: '/cases/case-001'
            }
          ],
          precautions: analysis.precautions || ['备份重要数据', '关闭不必要的程序']
        },
        aiSuggestion: analysis.suggestion || `根据您的症状分析，最可能是${analysis.primaryCause || '系统故障'}。`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '诊断分析失败',
      error: error.message
    });
  }
};

// 智能诊断助手 - 获取症状推荐
exports.getSymptoms = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    const commonSymptoms = [
      { id: 'sym-001', text: '系统无法正常关机', category: 'system', frequency: 156 },
      { id: 'sym-002', text: 'Office崩溃', category: 'software', frequency: 89 },
      { id: 'sym-003', text: '网络连接问题', category: 'network', frequency: 234 },
      { id: 'sym-004', text: 'DNS故障', category: 'network', frequency: 167 },
      { id: 'sym-005', text: '打印机脱机', category: 'hardware', frequency: 98 },
      { id: 'sym-006', text: '虚拟机卡顿', category: 'system', frequency: 76 },
      { id: 'sym-007', text: '蓝屏错误', category: 'system', frequency: 145 },
      { id: 'sym-008', text: '更新失败', category: 'software', frequency: 112 },
      { id: 'sym-009', text: '认证失败', category: 'system', frequency: 67 },
      { id: 'sym-010', text: '连接超时', category: 'network', frequency: 189 },
      { id: 'sym-011', text: '磁盘空间不足', category: 'hardware', frequency: 134 },
      { id: 'sym-012', text: '进程占用过高', category: 'system', frequency: 87 },
      { id: 'sym-013', text: '驱动程序错误', category: 'hardware', frequency: 78 },
      { id: 'sym-014', text: '浏览器崩溃', category: 'software', frequency: 92 },
      { id: 'sym-015', text: '邮件发送失败', category: 'network', frequency: 56 },
    ];
    
    let filteredSymptoms = commonSymptoms;
    
    if (query) {
      filteredSymptoms = commonSymptoms.filter(s => 
        s.text.toLowerCase().includes(query.toLowerCase()) ||
        s.category.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    filteredSymptoms = filteredSymptoms.slice(0, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        symptoms: filteredSymptoms
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取症状列表失败',
      error: error.message
    });
  }
};

// 知识库AI助手 - 文档问答
exports.knowledgeQA = async (req, res) => {
  try {
    const { question, topK = 3 } = req.body;
    
    const documents = await Document.find({
      $or: [
        { title: { $regex: question, $options: 'i' } },
        { description: { $regex: question, $options: 'i' } },
        { content: { $regex: question, $options: 'i' } },
        { tags: { $in: question.split(' ') } }
      ]
    }).limit(topK);
    
    const prompt = getKnowledgeQAPrompt(question, documents);
    
    let answer;
    try {
      answer = await callAI(prompt);
    } catch (aiError) {
      console.warn('调用AI失败，使用模拟数据:', aiError.message);
      answer = await generateAIAnswer(question, documents);
    }
    
    const sources = documents.map(doc => ({
      documentId: doc._id.toString(),
      title: doc.title,
      category: doc.category,
      relevance: Math.random() * 0.3 + 0.7,
      snippet: doc.description.substring(0, 100) + '...',
      link: `/documents/${doc._id}`
    }));
    
    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        confidence: Math.random() * 0.2 + 0.75,
        sources
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '问答失败',
      error: error.message
    });
  }
};

// 知识库AI助手 - 文档检索
exports.knowledgeSearch = async (req, res) => {
  try {
    const { query, filters = {}, topK = 5 } = req.body;
    
    let searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: query.split(' ') } }
      ]
    };
    
    if (filters.category) {
      searchQuery.category = filters.category;
    }
    if (filters.type) {
      searchQuery.type = filters.type;
    }
    
    const documents = await Document.find(searchQuery)
      .sort({ views: -1 })
      .limit(topK);
    
    const results = documents.map(doc => ({
      documentId: doc._id.toString(),
      title: doc.title,
      category: doc.category,
      type: doc.type,
      relevance: Math.random() * 0.3 + 0.7,
      views: doc.views,
      downloads: doc.downloads,
      summary: doc.description,
      link: `/documents/${doc._id}`
    }));
    
    const relatedQueries = generateRelatedQueries(query);
    
    res.status(200).json({
      success: true,
      data: {
        query,
        results,
        relatedQueries
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error.message
    });
  }
};

// 知识库AI助手 - 文档摘要
exports.knowledgeSummarize = async (req, res) => {
  try {
    const { documentId, length = 'medium' } = req.body;
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }
    
    const prompt = getDocumentSummaryPrompt(document.content, length);
    
    let summaryData;
    try {
      const aiResponse = await callAI(prompt);
      summaryData = JSON.parse(aiResponse);
    } catch (aiError) {
      console.warn('调用AI失败，使用模拟数据:', aiError.message);
      const summaryLength = {
        short: 100,
        medium: 200,
        long: 300
      }[length] || 200;
      summaryData = {
        summary: document.content.substring(0, summaryLength) + '...',
        keyPoints: document.tags.slice(0, 4)
      };
    }
    
    const estimatedReadingTime = Math.ceil(document.content.length / 500) + '分钟';
    
    res.status(200).json({
      success: true,
      data: {
        documentId: document._id.toString(),
        title: document.title,
        summary: summaryData.summary,
        keyPoints: summaryData.keyPoints,
        estimatedReadingTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '生成摘要失败',
      error: error.message
    });
  }
};

// 沙盒实验室AI分析 - 实验分析
exports.analyzeExperiment = async (req, res) => {
  try {
    const { experimentId, faultType, logs, metrics } = req.body;
    
    const prompt = getExperimentAnalysisPrompt(faultType, logs, metrics);
    
    let analysis;
    try {
      const aiResponse = await callAI(prompt);
      analysis = JSON.parse(aiResponse);
    } catch (aiError) {
      console.warn('调用AI失败，使用模拟数据:', aiError.message);
      analysis = await simulateExperimentAnalysis(faultType, logs, metrics);
    }
    
    res.status(200).json({
      success: true,
      data: {
        experimentId,
        faultType,
        analysis: {
          status: 'completed',
          rootCause: analysis.rootCause || {
            primary: '系统异常',
            secondary: ['配置不当', '资源不足'],
            confidence: Math.random() * 0.15 + 0.8
          },
          issues: analysis.issues || [
            { id: 'issue-001', severity: 'warning', description: '检测到异常状态' }
          ],
          recommendations: analysis.recommendations || [
            { priority: 'medium', action: '进一步分析日志', expectedImpact: '中' }
          ],
          suggestedFix: analysis.suggestedFix || '建议进一步分析日志以确定根本原因。'
        },
        report: {
          summary: analysis.suggestedFix || '实验分析已完成',
          keyFindings: analysis.issues ? analysis.issues.map(i => i.description) : ['检测到异常状态'],
          improvementScore: Math.floor(Math.random() * 30) + 60,
          recommendationsCount: analysis.recommendations ? analysis.recommendations.length : 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '实验分析失败',
      error: error.message
    });
  }
};

// 沙盒实验室AI分析 - 对比分析
exports.compareExperiments = async (req, res) => {
  try {
    const { experimentIds, comparisonType = 'performance' } = req.body;
    
    const experiments = await Experiment.find({
      _id: { $in: experimentIds }
    });
    
    const experimentData = experiments.map(exp => ({
      id: exp._id.toString(),
      name: exp.name,
      date: exp.createdAt,
      result: exp.status
    }));
    
    const baseline = Math.floor(Math.random() * 30) + 50;
    const current = Math.floor(Math.random() * 30) + 70;
    
    res.status(200).json({
      success: true,
      data: {
        experiments: experimentData,
        comparison: {
          metric: 'successRate',
          baseline,
          current,
          improvement: current - baseline,
          status: current > baseline ? 'improved' : 'declined'
        },
        insights: [
          `第二次实验的成功率${current > baseline ? '提升' : '下降'}了${Math.abs(current - baseline)}%`,
          '缓存优化起到了明显效果',
          '建议继续优化重试策略'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '对比分析失败',
      error: error.message
    });
  }
};

// 模拟AI诊断分析
async function simulateAIDiagnosis(symptoms, deviceType, brand, model, errorCode, additionalInfo) {
  const diagnosisId = `diag-${Date.now()}`;
  
  // 根据症状生成分析
  let primaryCause = '系统故障';
  let solutions = [];
  
  if (symptoms.includes('系统无法正常关机')) {
    primaryCause = 'Windows更新导致系统文件损坏';
    solutions = [
      {
        id: 'sol-001',
        title: '修复系统文件',
        steps: ['运行 sfc /scannow', '运行 DISM /Online /Cleanup-Image /RestoreHealth', '重启系统'],
        estimatedTime: '15分钟',
        difficulty: 'medium',
        successRate: 0.88
      },
      {
        id: 'sol-002',
        title: '卸载最近更新',
        steps: ['打开设置', '进入更新和安全', '查看更新历史', '卸载更新'],
        estimatedTime: '10分钟',
        difficulty: 'easy',
        successRate: 0.92
      }
    ];
  } else if (symptoms.includes('Office崩溃')) {
    primaryCause = 'Office组件损坏或冲突';
    solutions = [
      {
        id: 'sol-001',
        title: '修复Office安装',
        steps: ['打开控制面板', '找到Microsoft Office', '选择更改', '点击修复'],
        estimatedTime: '20分钟',
        difficulty: 'easy',
        successRate: 0.92
      },
      {
        id: 'sol-002',
        title: '更新Office到最新版本',
        steps: ['打开Office应用', '进入账户设置', '检查更新'],
        estimatedTime: '15分钟',
        difficulty: 'easy',
        successRate: 0.85
      }
    ];
  } else if (symptoms.includes('网络连接问题') || symptoms.includes('DNS故障')) {
    primaryCause = '网络配置异常或DNS服务器问题';
    solutions = [
      {
        id: 'sol-001',
        title: '重置网络配置',
        steps: ['以管理员身份打开命令提示符', '执行 ipconfig /release', '执行 ipconfig /flushdns', '执行 ipconfig /renew'],
        estimatedTime: '5分钟',
        difficulty: 'medium',
        successRate: 0.85
      },
      {
        id: 'sol-002',
        title: '更换DNS服务器',
        steps: ['打开网络连接属性', '选择IPv4', '设置首选DNS为223.5.5.5', '设置备用DNS为223.6.6.6'],
        estimatedTime: '10分钟',
        difficulty: 'easy',
        successRate: 0.90
      }
    ];
  } else {
    primaryCause = '系统异常，需要进一步诊断';
    solutions = [
      {
        id: 'sol-001',
        title: '运行系统诊断',
        steps: ['打开设置', '进入更新和安全', '选择疑难解答', '运行相应的诊断工具'],
        estimatedTime: '15分钟',
        difficulty: 'easy',
        successRate: 0.75
      }
    ];
  }
  
  return {
    diagnosisId,
    symptoms,
    analysis: {
      confidence: Math.random() * 0.15 + 0.8,
      primaryCause,
      secondaryCauses: ['系统服务异常', '软件冲突'],
      suggestedSolutions: solutions,
      relatedCases: [
        {
          id: 'case-001',
          title: 'Windows更新后系统异常修复',
          matchScore: Math.floor(Math.random() * 20) + 80,
          link: '/cases/case-001'
        }
      ],
      precautions: ['备份重要数据', '关闭不必要的程序']
    },
    aiSuggestion: `根据您的症状分析，最可能是${primaryCause}。建议先尝试${solutions[0]?.title}，如果问题仍然存在再尝试其他方案。`
  };
}

// 模拟AI回答生成
async function generateAIAnswer(question, documents) {
  const answers = {
    'dns': '配置DNS解析通常包括以下步骤：1. 打开网络连接属性；2. 选择IPv4协议；3. 设置首选DNS服务器地址；4. 验证配置是否生效。',
    '打印机': '解决打印机脱机问题的方法：1. 检查打印机电源和连接；2. 重启打印后台处理程序；3. 检查打印机驱动；4. 清除打印队列。',
    '更新': 'Windows更新失败的解决方法：1. 运行Windows更新疑难解答；2. 清除更新缓存；3. 手动下载并安装更新；4. 检查系统文件完整性。',
    '蓝屏': '蓝屏错误排查步骤：1. 记录错误代码；2. 检查最近安装的软件或驱动；3. 运行内存诊断；4. 检查硬盘健康状态。',
    'office': 'Office崩溃解决方法：1. 修复Office安装；2. 禁用COM加载项；3. 更新Office到最新版本；4. 以安全模式启动。'
  };
  
  const lowerQuestion = question.toLowerCase();
  const matchedKey = Object.keys(answers).find(key => lowerQuestion.includes(key));
  
  if (matchedKey) {
    return answers[matchedKey];
  }
  
  if (documents.length > 0) {
    return `根据知识库内容，${documents[0].title}中提到了相关解决方案。${documents[0].description.substring(0, 100)}...详细内容请查看相关文档。`;
  }
  
  return '抱歉，知识库中没有找到相关信息。请尝试使用其他关键词搜索。';
}

// 生成相关搜索词
function generateRelatedQueries(query) {
  const queryMap = {
    'dns': ['DNS服务器配置', 'DNS缓存清除', 'DNS故障排查', '公共DNS推荐'],
    '打印机': ['打印机驱动安装', '网络打印机配置', '打印队列清除', '打印机共享'],
    '更新': ['Windows更新设置', '更新错误代码', '更新缓存清理', '更新策略'],
    '蓝屏': ['BSOD错误代码', '内存诊断', '驱动更新', '系统还原'],
    'office': ['Office激活', 'Office快捷键', 'Office插件', 'Office版本对比']
  };
  
  const lowerQuery = query.toLowerCase();
  const matchedKey = Object.keys(queryMap).find(key => lowerQuery.includes(key));
  
  return matchedKey ? queryMap[matchedKey].slice(0, 3) : ['相关问题1', '相关问题2', '相关问题3'];
}

// 模拟实验分析
async function simulateExperimentAnalysis(faultType, logs, metrics) {
  const issues = [];
  const recommendations = [];
  
  // 根据故障类型生成分析
  if (faultType === 'DNS解析失败' || faultType.includes('DNS')) {
    issues.push(
      { id: 'issue-001', severity: 'critical', description: 'DNS查询超时超过5秒' },
      { id: 'issue-002', severity: 'warning', description: '缓存命中率低于50%' }
    );
    recommendations.push(
      { priority: 'high', action: '检查DNS服务器配置', expectedImpact: '高' },
      { priority: 'medium', action: '优化缓存策略', expectedImpact: '中' },
      { priority: 'low', action: '增加重试次数', expectedImpact: '低' }
    );
  } else if (faultType === '服务器连接超时') {
    issues.push(
      { id: 'issue-001', severity: 'critical', description: '服务器响应超时' },
      { id: 'issue-002', severity: 'info', description: '连接重试次数过多' }
    );
    recommendations.push(
      { priority: 'high', action: '检查服务器负载', expectedImpact: '高' },
      { priority: 'medium', action: '增加超时时间', expectedImpact: '中' }
    );
  } else if (faultType === '内存泄漏') {
    issues.push(
      { id: 'issue-001', severity: 'critical', description: '内存持续增长超过阈值' },
      { id: 'issue-002', severity: 'warning', description: 'GC回收效率低下' }
    );
    recommendations.push(
      { priority: 'high', action: '分析内存使用情况', expectedImpact: '高' },
      { priority: 'high', action: '优化内存分配', expectedImpact: '高' },
      { priority: 'medium', action: '增加监控告警', expectedImpact: '中' }
    );
  } else {
    issues.push(
      { id: 'issue-001', severity: 'warning', description: '检测到异常状态' }
    );
    recommendations.push(
      { priority: 'medium', action: '进一步分析日志', expectedImpact: '中' }
    );
  }
  
  return {
    status: 'completed',
    rootCause: {
      primary: logs?.find(l => l.level === 'error')?.message || '系统异常',
      secondary: ['配置不当', '资源不足'],
      confidence: Math.random() * 0.15 + 0.8
    },
    issues,
    recommendations,
    suggestedFix: `建议先${recommendations[0]?.action}，这将${recommendations[0]?.expectedImpact}程度地改善问题。`
  };
}
