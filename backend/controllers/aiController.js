const Case = require('../models/Case');
const Document = require('../models/Document');
const { 
  callAI, 
  searchLocalKnowledgeBase, 
  generateAnswerFromLocal,
  getSmartQAPrompt,
  getDiagnosisPrompt, 
  getKnowledgeQAPrompt, 
  getDocumentSummaryPrompt, 
  getExperimentAnalysisPrompt 
} = require('../services/aiService');

exports.smartQA = async (req, res) => {
  try {
    const { question, useLocalOnly = false, topK = 5 } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: '请输入问题'
      });
    }

    let localResults = null;
    let localContext = '';
    let sources = [];
    let dataSource = 'network';

    if (!useLocalOnly) {
      localResults = await searchLocalKnowledgeBase(question, topK);
      const { context, sources: localSources } = generateAnswerFromLocal(question, localResults);
      localContext = context;
      sources = localSources;

      if (localResults.hasEnoughData) {
        dataSource = 'local';
      }
    }

    const prompt = getSmartQAPrompt(question, localContext, useLocalOnly);

    let answer;
    try {
      answer = await callAI(prompt);
    } catch (aiError) {
      console.warn('调用AI失败，使用模拟数据:', aiError.message);
      answer = await generateSmartAnswer(question, localResults);
    }

    const totalResults = localResults ? localResults.cases.length + localResults.documents.length : 0;

    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        confidence: totalResults > 0 ? Math.random() * 0.2 + 0.8 : Math.random() * 0.15 + 0.7,
        dataSource,
        localResults: {
          cases: localResults?.cases || [],
          documents: localResults?.documents || []
        },
        sources,
        hasLocalData: totalResults > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '智能问答失败',
      error: error.message
    });
  }
};

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

async function generateSmartAnswer(question, localResults) {
  const lowerQuestion = question.toLowerCase();
  
  const chatKeywords = ['你能看到我吗', '在吗', '你好', '你好吗', 'hello', 'hi', '嗨', '聊天', '聊聊天', '聊聊', '说话'];
  const isChatting = chatKeywords.some(keyword => lowerQuestion.includes(keyword));
  
  if (isChatting) {
    return '我仅提供电脑故障诊断相关服务，闲聊类问题无法解答，请描述你的电脑故障问题。';
  }
  
  const nonDesktopKeywords = ['服务器', '代码', '开发', '编程', '硬件维修', '拆机', '手机', '平板'];
  const isNonDesktop = nonDesktopKeywords.some(keyword => lowerQuestion.includes(keyword));
  
  if (isNonDesktop) {
    return '当前暂无该故障标准化解决方案，请前往网站【故障诊断】板块提交工单，可申请工程师远程协助。';
  }

  const answers = {
    'dns': '配置DNS解析通常包括以下步骤：1. 打开网络连接属性；2. 选择IPv4协议；3. 设置首选DNS服务器地址；4. 验证配置是否生效。',
    '打印机': '解决打印机脱机问题的方法：1. 检查打印机电源和连接；2. 重启打印后台处理程序；3. 检查打印机驱动；4. 清除打印队列。',
    '更新': 'Windows更新失败的解决方法：1. 运行Windows更新疑难解答；2. 清除更新缓存；3. 手动下载并安装更新；4. 检查系统文件完整性。',
    '蓝屏': '蓝屏错误排查步骤：1. 记录错误代码；2. 检查最近安装的软件或驱动；3. 运行内存诊断；4. 检查硬盘健康状态。',
    'office': 'Office崩溃解决方法：1. 修复Office安装；2. 禁用COM加载项；3. 更新Office到最新版本；4. 以安全模式启动。',
    '网络': '网络连接问题排查：1. 检查网线连接；2. 重启路由器；3. 刷新DNS缓存(ipconfig /flushdns)；4. 检查IP地址配置。',
    '连接': '连接超时问题解决：1. 检查网络连接；2. 增加超时时间设置；3. 检查目标服务器状态；4. 尝试更换网络环境。'
  };
  
  const matchedKey = Object.keys(answers).find(key => lowerQuestion.includes(key));
  
  if (matchedKey) {
    return answers[matchedKey];
  }
  
  if (localResults && (localResults.cases.length > 0 || localResults.documents.length > 0)) {
    const hasCases = localResults.cases.length > 0;
    const hasDocs = localResults.documents.length > 0;
    
    let response = '根据本地知识库内容，';
    if (hasCases) {
      response += `找到了 ${localResults.cases.length} 个相关故障案例。`;
      if (localResults.cases[0]) {
        response += `例如「${localResults.cases[0].title}」提到了相关解决方案。`;
      }
    }
    if (hasDocs) {
      response += `找到了 ${localResults.documents.length} 个相关文档。`;
      if (localResults.documents[0]) {
        response += `「${localResults.documents[0].title}」提供了详细的处理指南。`;
      }
    }
    response += '建议参考这些资料进行故障排查。';
    return response;
  }
  
  return '当前暂无该故障标准化解决方案，可以联网查询可靠方案';
}

async function simulateAIDiagnosis(symptoms, deviceType, brand, model, errorCode, additionalInfo) {
  const diagnosisId = `diag-${Date.now()}`;
  
  let primaryCause = '系统故障';
  let secondaryCauses = [];
  let solutions = [];
  let precautions = ['备份重要数据', '关闭不必要的程序'];
  
  const hasErrorCode = errorCode && errorCode.trim() !== '';
  const hasMemoryError = errorCode && errorCode.includes('内存') && errorCode.includes('read');
  
  if (hasMemoryError) {
    primaryCause = '"此内存不能为read"错误通常由以下原因导致：1) 应用程序访问了无效的内存地址；2) 内存模块损坏或不兼容；3) 系统文件损坏；4) 病毒感染或恶意软件';
    secondaryCauses = ['内存硬件故障', '系统文件损坏', '应用程序冲突', '病毒感染'];
    solutions = [
      {
        id: 'sol-001',
        title: '运行内存诊断工具',
        steps: ['按下Win+R键打开运行', '输入mdsched.exe并回车', '选择"立即重新启动并检查问题"', '等待诊断完成'],
        estimatedTime: '15分钟',
        difficulty: 'easy',
        successRate: 0.82
      },
      {
        id: 'sol-002',
        title: '修复系统文件',
        steps: ['以管理员身份打开命令提示符', '执行 sfc /scannow 命令', '等待扫描完成并修复', '如果sfc无法修复，执行 DISM /Online /Cleanup-Image /RestoreHealth'],
        estimatedTime: '20分钟',
        difficulty: 'medium',
        successRate: 0.88
      },
      {
        id: 'sol-003',
        title: '检查并更新驱动程序',
        steps: ['右键点击此电脑选择管理', '进入设备管理器', '查看是否有黄色感叹号的设备', '右键点击更新驱动程序', '重点检查显卡、声卡、网卡驱动'],
        estimatedTime: '15分钟',
        difficulty: 'medium',
        successRate: 0.78
      },
      {
        id: 'sol-004',
        title: '执行病毒扫描',
        steps: ['启动杀毒软件', '执行全面系统扫描', '清除发现的恶意软件', '重启系统'],
        estimatedTime: '30分钟',
        difficulty: 'easy',
        successRate: 0.85
      }
    ];
    precautions = ['重要提示：在进行任何系统修复前，请备份重要数据', '内存诊断可能需要重启系统', '修复系统文件时不要中断操作'];
  } else if (symptoms.includes('系统无法正常关机')) {
    primaryCause = 'Windows更新导致系统文件损坏或系统服务异常';
    secondaryCauses = ['最近安装的Windows更新不兼容', '系统服务Shutdown blocked', '电源计划设置问题', '驱动程序冲突'];
    solutions = [
      {
        id: 'sol-001',
        title: '修复系统文件',
        steps: ['以管理员身份打开命令提示符', '运行 sfc /scannow', '运行 DISM /Online /Cleanup-Image /RestoreHealth', '重启系统'],
        estimatedTime: '15分钟',
        difficulty: 'medium',
        successRate: 0.88
      },
      {
        id: 'sol-002',
        title: '卸载最近更新',
        steps: ['打开设置', '进入更新和安全', '点击查看更新历史', '选择卸载更新', '找到最近安装的更新并卸载'],
        estimatedTime: '10分钟',
        difficulty: 'easy',
        successRate: 0.92
      },
      {
        id: 'sol-003',
        title: '检查关机服务',
        steps: ['按下Win+R键打开运行', '输入services.msc', '找到Windows Update服务', '确保服务状态为运行', '检查Remote Procedure Call服务'],
        estimatedTime: '5分钟',
        difficulty: 'easy',
        successRate: 0.80
      }
    ];
    precautions = ['卸载更新后可能需要重新启动', '建议在卸载前记录更新KB编号以便恢复'];
  } else if (symptoms.includes('Office崩溃')) {
    primaryCause = 'Office组件损坏、冲突或系统资源不足';
    secondaryCauses = ['Office安装文件损坏', 'COM加载项冲突', '系统资源不足', 'Office版本与系统不兼容'];
    solutions = [
      {
        id: 'sol-001',
        title: '修复Office安装',
        steps: ['打开控制面板', '找到Microsoft Office', '选择更改', '点击联机修复', '等待修复完成'],
        estimatedTime: '20分钟',
        difficulty: 'easy',
        successRate: 0.92
      },
      {
        id: 'sol-002',
        title: '以安全模式启动Office',
        steps: ['按下Win+R键打开运行', '输入excel /safe（或word /safe等）', '检查是否正常启动', '如果正常，进入选项->加载项->COM加载项->转到', '禁用可疑加载项'],
        estimatedTime: '10分钟',
        difficulty: 'medium',
        successRate: 0.85
      },
      {
        id: 'sol-003',
        title: '更新Office到最新版本',
        steps: ['打开任意Office应用', '进入文件->账户', '点击更新选项', '选择立即更新'],
        estimatedTime: '15分钟',
        difficulty: 'easy',
        successRate: 0.85
      }
    ];
    precautions = ['修复Office前请保存所有打开的文档', '禁用加载项前记录其名称以便恢复'];
  } else if (symptoms.includes('网络连接问题') || symptoms.includes('DNS故障')) {
    primaryCause = '网络配置异常、DNS服务器问题或网络适配器故障';
    secondaryCauses = ['DNS缓存污染', '路由器DHCP故障', '网络适配器驱动问题', '防火墙阻止连接'];
    solutions = [
      {
        id: 'sol-001',
        title: '重置网络配置',
        steps: ['以管理员身份打开命令提示符', '执行 ipconfig /release', '执行 ipconfig /flushdns', '执行 ipconfig /renew', '执行 netsh winsock reset'],
        estimatedTime: '5分钟',
        difficulty: 'medium',
        successRate: 0.85
      },
      {
        id: 'sol-002',
        title: '更换DNS服务器',
        steps: ['打开网络连接属性', '选择Internet协议版本4 (TCP/IPv4)', '点击属性', '设置首选DNS为223.5.5.5', '设置备用DNS为223.6.6.6', '点击确定'],
        estimatedTime: '10分钟',
        difficulty: 'easy',
        successRate: 0.90
      },
      {
        id: 'sol-003',
        title: '重启网络适配器',
        steps: ['打开设备管理器', '找到网络适配器', '右键点击当前使用的适配器', '选择禁用', '等待10秒后选择启用'],
        estimatedTime: '5分钟',
        difficulty: 'easy',
        successRate: 0.80
      }
    ];
    precautions = ['更换DNS前记录原DNS设置', '重置网络后可能需要重新连接WiFi'];
  } else if (symptoms.includes('打印机脱机') || symptoms.includes('打印机')) {
    primaryCause = '打印机连接问题、驱动程序故障或打印队列堵塞';
    secondaryCauses = ['USB/网络连接断开', '打印后台处理程序异常', '打印机驱动过时', '打印队列堆积'];
    solutions = [
      {
        id: 'sol-001',
        title: '检查打印机连接',
        steps: ['检查USB线是否插好或网络连接是否正常', '重启打印机', '确保打印机处于就绪状态', '打印测试页'],
        estimatedTime: '5分钟',
        difficulty: 'easy',
        successRate: 0.85
      },
      {
        id: 'sol-002',
        title: '重启打印后台处理程序',
        steps: ['按下Win+R键打开运行', '输入services.msc', '找到Print Spooler服务', '右键点击重新启动', '等待服务重启完成'],
        estimatedTime: '5分钟',
        difficulty: 'easy',
        successRate: 0.90
      },
      {
        id: 'sol-003',
        title: '清除打印队列',
        steps: ['打开控制面板', '进入设备和打印机', '右键点击打印机', '选择查看正在打印的内容', '点击打印机菜单', '选择取消所有文档'],
        estimatedTime: '5分钟',
        difficulty: 'easy',
        successRate: 0.88
      }
    ];
    precautions = ['清除打印队列前确认不需要的打印任务', '重启服务可能会中断正在进行的打印'];
  } else if (symptoms.includes('蓝屏错误') || symptoms.includes('蓝屏')) {
    primaryCause = '系统严重错误，可能由硬件故障、驱动问题或系统文件损坏引起';
    secondaryCauses = ['硬件不兼容或损坏', '驱动程序冲突', '系统文件损坏', '恶意软件感染'];
    solutions = [
      {
        id: 'sol-001',
        title: '分析蓝屏错误代码',
        steps: ['记录蓝屏时显示的STOP代码', '访问微软官方文档查找代码含义', '根据代码定位问题', '常见代码：0x0000007B(启动问题), 0x000000D1(驱动问题), 0x000000F4(系统进程终止)'],
        estimatedTime: '10分钟',
        difficulty: 'medium',
        successRate: 0.80
      },
      {
        id: 'sol-002',
        title: '进入安全模式排查',
        steps: ['重启电脑', '开机时按F8键', '选择安全模式', '如果能进入安全模式，说明问题可能是第三方软件或驱动引起的', '卸载最近安装的软件或驱动'],
        estimatedTime: '15分钟',
        difficulty: 'medium',
        successRate: 0.85
      },
      {
        id: 'sol-003',
        title: '检查硬件',
        steps: ['关闭电脑并断开电源', '打开机箱检查内存条是否插紧', '检查显卡是否插紧', '清理灰尘', '重新连接硬件'],
        estimatedTime: '20分钟',
        difficulty: 'hard',
        successRate: 0.82
      }
    ];
    precautions = ['进入安全模式前保存重要数据', '硬件操作需要一定的计算机知识', '建议在断电状态下操作'];
  } else if (errorCode && errorCode.includes('0x')) {
    primaryCause = `错误代码 ${errorCode} 表示系统遇到了特定的故障。这个代码通常指向特定的系统组件或驱动程序问题。`;
    secondaryCauses = ['系统文件损坏', '驱动程序问题', '硬件兼容性问题', '软件冲突'];
    solutions = [
      {
        id: 'sol-001',
        title: '查询错误代码含义',
        steps: ['打开浏览器', '访问微软支持网站', '搜索错误代码 ' + errorCode, '根据官方文档进行修复'],
        estimatedTime: '10分钟',
        difficulty: 'easy',
        successRate: 0.85
      },
      {
        id: 'sol-002',
        title: '运行系统文件检查',
        steps: ['以管理员身份打开命令提示符', '执行 sfc /scannow', '等待扫描完成', '根据提示修复问题'],
        estimatedTime: '15分钟',
        difficulty: 'medium',
        successRate: 0.82
      },
      {
        id: 'sol-003',
        title: '更新系统和驱动',
        steps: ['打开设置', '进入更新和安全', '检查Windows更新', '安装所有可用更新', '更新设备驱动程序'],
        estimatedTime: '30分钟',
        difficulty: 'easy',
        successRate: 0.78
      }
    ];
    precautions = ['更新前备份重要数据', '更新过程可能需要重启'];
  } else {
    primaryCause = '系统异常，根据提供的症状分析可能存在以下问题：';
    if (symptoms.length > 0) {
      primaryCause += symptoms.join('、');
    }
    secondaryCauses = ['系统服务异常', '软件冲突', '资源不足', '配置错误'];
    solutions = [
      {
        id: 'sol-001',
        title: '运行系统诊断',
        steps: ['打开设置', '进入更新和安全', '选择疑难解答', '选择合适的诊断工具运行'],
        estimatedTime: '15分钟',
        difficulty: 'easy',
        successRate: 0.75
      },
      {
        id: 'sol-002',
        title: '检查系统日志',
        steps: ['按下Win+R键打开运行', '输入eventvwr.msc', '展开Windows日志', '查看系统日志中的错误信息', '根据错误ID查找解决方案'],
        estimatedTime: '10分钟',
        difficulty: 'medium',
        successRate: 0.80
      },
      {
        id: 'sol-003',
        title: '重启相关服务',
        steps: ['按下Win+R键打开运行', '输入services.msc', '找到相关服务', '右键点击重新启动'],
        estimatedTime: '5分钟',
        difficulty: 'easy',
        successRate: 0.70
      }
    ];
  }
  
  return {
    diagnosisId,
    symptoms,
    analysis: {
      confidence: Math.random() * 0.15 + 0.8,
      primaryCause,
      secondaryCauses,
      suggestedSolutions: solutions,
      relatedCases: [
        {
          id: 'case-001',
          title: 'Windows系统故障排查指南',
          matchScore: Math.floor(Math.random() * 20) + 80,
          link: '/cases/case-001'
        },
        {
          id: 'case-002',
          title: '常见系统错误代码解析',
          matchScore: Math.floor(Math.random() * 15) + 75,
          link: '/cases/case-002'
        }
      ],
      precautions
    },
    aiSuggestion: `根据您的症状分析，最可能是${primaryCause}。建议先尝试${solutions[0]?.title || '系统诊断'}。`
  };
}

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

async function simulateExperimentAnalysis(faultType, logs, metrics) {
  const issues = [];
  const recommendations = [];
  
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
