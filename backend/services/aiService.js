const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');
const Case = require('../models/Case');
const Document = require('../models/Document');

let aiSettings = null;

const clearAISettingsCache = () => {
  aiSettings = null;
};

const loadAISettings = async (forceReload = false) => {
  if (!aiSettings || forceReload) {
    try {
      const settings = await SystemSettings.findOne();
      console.log('[AI Service] 从数据库读取设置:', settings ? '存在' : '不存在');
      console.log('[AI Service] settings 文档完整内容:', settings ? JSON.stringify(settings, null, 2) : 'null');
      
      if (settings && settings.aiSettings) {
        const aiSettingsDoc = settings.aiSettings.toObject ? settings.aiSettings.toObject() : settings.aiSettings;
        console.log('[AI Service] aiSettings 子对象内容:', JSON.stringify(aiSettingsDoc, null, 2));
        aiSettings = {
          enabled: true,
          provider: 'doubao',
          apiKey: '',
          apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          model: 'doubao-pro',
          maxTokens: 4096,
          temperature: 0.7,
          timeout: 30000,
          enableNetworkFallback: true,
          localSearchThreshold: 0.6,
          ...aiSettingsDoc
        };
        console.log('[AI Service] 加载的AI配置:', { 
          provider: aiSettings.provider, 
          apiKey: aiSettings.apiKey ? '已配置' : '未配置',
          apiUrl: aiSettings.apiUrl,
          model: aiSettings.model
        });
      } else {
        console.log('[AI Service] aiSettings 不存在或为空，使用默认配置');
        aiSettings = {
          enabled: true,
          provider: 'doubao',
          apiKey: '',
          apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          model: 'doubao-pro',
          maxTokens: 4096,
          temperature: 0.7,
          timeout: 30000,
          enableNetworkFallback: true,
          localSearchThreshold: 0.6
        };
        console.log('[AI Service] 使用默认AI配置');
      }
    } catch (error) {
      console.error('加载AI设置失败:', error.message);
      aiSettings = {
        enabled: true,
        provider: 'doubao',
        apiKey: '',
        apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        model: 'doubao-pro',
        maxTokens: 4096,
        temperature: 0.7,
        timeout: 30000,
        enableNetworkFallback: true,
        localSearchThreshold: 0.6
      };
    }
  }
  return aiSettings;
};

const callDoubaoAPI = async (prompt) => {
  await loadAISettings(true);

  if (!aiSettings.enabled || !aiSettings.apiKey) {
    throw new Error('AI服务未启用或未配置API密钥');
  }

  try {
    const apiUrl = aiSettings.apiUrl || 'https://ark.cn-beijing.volces.com/api/v3/responses';
    
    const requestData = {
      model: aiSettings.model || 'doubao-pro',
      input: [
        {
          role: 'system',
          content: '你是萌萌的运维人网站专属桌面运维AI诊断专家，精通Windows系统故障诊断和修复。仅输出标准JSON，不额外输出解释文字。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      text: {
        format: {
          type: 'json_object'
        }
      },
      thinking: {
        type: 'disabled'
      },
      max_output_tokens: aiSettings.maxTokens
    };
    
    console.log('[Doubao API] 请求URL:', apiUrl);
    console.log('[Doubao API] 请求数据:', JSON.stringify(requestData));
    
    const response = await axios.post(
      apiUrl,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.apiKey}`
        },
        timeout: 60000
      }
    );

    console.log('[Doubao API] 响应数据:', JSON.stringify(response.data));
    
    const data = response.data;
    
    if (data.output && Array.isArray(data.output) && 
        data.output[0] && data.output[0].content && 
        Array.isArray(data.output[0].content) && 
        data.output[0].content[0] && data.output[0].content[0].text) {
      return data.output[0].content[0].text;
    } else if (data.output && data.output.stringValue) {
      return data.output.stringValue;
    } else if (data.outputs && data.outputs[0] && data.outputs[0].stringValue) {
      return data.outputs[0].stringValue;
    } else if (data.result) {
      return data.result;
    } else if (data.answer) {
      return data.answer;
    } else if (data.choices && 
        data.choices[0] && data.choices[0].message && 
        data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    } else if (typeof data === 'string') {
      return data;
    } else {
      throw new Error('AI API返回格式不正确');
    }
  } catch (error) {
    console.error('[Doubao API] 调用失败:', error.message);
    if (error.response) {
      console.error('[Doubao API] 错误响应:', JSON.stringify(error.response.data));
    }
    throw error;
  }
};

const callOpenAIAPI = async (prompt) => {
  await loadAISettings(true);

  if (!aiSettings.enabled || !aiSettings.apiKey) {
    throw new Error('AI服务未启用或未配置API密钥');
  }

  try {
    const response = await axios.post(
      aiSettings.apiUrl || 'https://api.openai.com/v1/chat/completions',
      {
        model: aiSettings.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: aiSettings.maxTokens,
        temperature: aiSettings.temperature
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.apiKey}`
        },
        timeout: aiSettings.timeout
      }
    );

    if (response.data && response.data.choices && response.data.choices[0] && 
        response.data.choices[0].message && response.data.choices[0].message.content) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error('AI API返回格式不正确');
    }
  } catch (error) {
    console.error('调用OpenAI API失败:', error.message);
    throw error;
  }
};

const callAI = async (prompt) => {
  await loadAISettings(true);

  if (!aiSettings.enabled) {
    throw new Error('AI服务未启用');
  }

  if (!aiSettings.apiKey || aiSettings.apiKey.trim() === '') {
    console.log('AI API密钥未配置，使用本地智能分析...');
    return await generateSmartAnalysis(prompt);
  }

  switch (aiSettings.provider) {
    case 'doubao':
      return await callDoubaoAPI(prompt);
    case 'openai':
      return await callOpenAIAPI(prompt);
    case 'custom':
      return await callCustomAPI(prompt);
    default:
      return await callDoubaoAPI(prompt);
  }
};

const generateSmartAnalysis = async (prompt) => {
  const analysisPatterns = {
    memory: {
      keywords: ['内存', 'memory', 'read', 'write', '0x00'],
      response: `
{
  "primaryCause": "内存访问错误通常由以下原因导致：1) 应用程序访问了无效的内存地址；2) 内存模块损坏或不兼容；3) 系统文件损坏；4) 病毒感染或恶意软件",
  "secondaryCauses": ["内存硬件故障", "系统文件损坏", "应用程序冲突", "病毒感染"],
  "solutions": [
    {
      "title": "运行内存诊断工具",
      "steps": ["按下Win+R键打开运行", "输入mdsched.exe并回车", "选择立即重新启动并检查问题", "等待诊断完成"],
      "estimatedTime": "15分钟",
      "difficulty": "easy",
      "successRate": 0.82
    },
    {
      "title": "修复系统文件",
      "steps": ["以管理员身份打开命令提示符", "执行 sfc /scannow 命令", "等待扫描完成并修复", "如果sfc无法修复，执行 DISM /Online /Cleanup-Image /RestoreHealth"],
      "estimatedTime": "20分钟",
      "difficulty": "medium",
      "successRate": 0.88
    },
    {
      "title": "检查并更新驱动程序",
      "steps": ["右键点击此电脑选择管理", "进入设备管理器", "查看是否有黄色感叹号的设备", "右键点击更新驱动程序"],
      "estimatedTime": "15分钟",
      "difficulty": "medium",
      "successRate": 0.78
    }
  ],
  "precautions": ["重要提示：在进行任何系统修复前，请备份重要数据", "内存诊断可能需要重启系统"],
  "suggestion": "建议先运行内存诊断工具，然后修复系统文件，最后检查驱动程序。"
}
      `.trim()
    },
    office: {
      keywords: ['Office', 'Excel', 'Word', 'PPT', '崩溃', '闪退'],
      response: `
{
  "primaryCause": "Office组件损坏、冲突或系统资源不足",
  "secondaryCauses": ["Office安装文件损坏", "COM加载项冲突", "系统资源不足", "Office版本与系统不兼容"],
  "solutions": [
    {
      "title": "修复Office安装",
      "steps": ["打开控制面板", "找到Microsoft Office", "选择更改", "点击联机修复", "等待修复完成"],
      "estimatedTime": "20分钟",
      "difficulty": "easy",
      "successRate": 0.92
    },
    {
      "title": "以安全模式启动Office",
      "steps": ["按下Win+R键打开运行", "输入excel /safe", "检查是否正常启动", "进入选项->加载项->COM加载项->转到", "禁用可疑加载项"],
      "estimatedTime": "10分钟",
      "difficulty": "medium",
      "successRate": 0.85
    },
    {
      "title": "更新Office到最新版本",
      "steps": ["打开任意Office应用", "进入文件->账户", "点击更新选项", "选择立即更新"],
      "estimatedTime": "15分钟",
      "difficulty": "easy",
      "successRate": 0.85
    }
  ],
  "precautions": ["修复Office前请保存所有打开的文档", "禁用加载项前记录其名称以便恢复"],
  "suggestion": "建议先尝试修复Office安装，如果问题仍然存在，再检查COM加载项。"
}
      `.trim()
    },
    network: {
      keywords: ['网络', 'DNS', '连接', 'WiFi', 'IP', '上网'],
      response: `
{
  "primaryCause": "网络配置异常、DNS服务器问题或网络适配器故障",
  "secondaryCauses": ["DNS缓存污染", "路由器DHCP故障", "网络适配器驱动问题", "防火墙阻止连接"],
  "solutions": [
    {
      "title": "重置网络配置",
      "steps": ["以管理员身份打开命令提示符", "执行 ipconfig /release", "执行 ipconfig /flushdns", "执行 ipconfig /renew", "执行 netsh winsock reset"],
      "estimatedTime": "5分钟",
      "difficulty": "medium",
      "successRate": 0.85
    },
    {
      "title": "更换DNS服务器",
      "steps": ["打开网络连接属性", "选择Internet协议版本4 (TCP/IPv4)", "点击属性", "设置首选DNS为223.5.5.5", "设置备用DNS为223.6.6.6"],
      "estimatedTime": "10分钟",
      "difficulty": "easy",
      "successRate": 0.90
    },
    {
      "title": "重启网络适配器",
      "steps": ["打开设备管理器", "找到网络适配器", "右键点击当前使用的适配器", "选择禁用", "等待10秒后选择启用"],
      "estimatedTime": "5分钟",
      "difficulty": "easy",
      "successRate": 0.80
    }
  ],
  "precautions": ["更换DNS前记录原DNS设置", "重置网络后可能需要重新连接WiFi"],
  "suggestion": "建议先重置网络配置，如果问题仍然存在，再更换DNS服务器。"
}
      `.trim()
    },
    printer: {
      keywords: ['打印机', '打印', '脱机', '墨盒', '纸张'],
      response: `
{
  "primaryCause": "打印机连接问题、驱动程序故障或打印队列堵塞",
  "secondaryCauses": ["USB/网络连接断开", "打印后台处理程序异常", "打印机驱动过时", "打印队列堆积"],
  "solutions": [
    {
      "title": "检查打印机连接",
      "steps": ["检查USB线是否插好或网络连接是否正常", "重启打印机", "确保打印机处于就绪状态", "打印测试页"],
      "estimatedTime": "5分钟",
      "difficulty": "easy",
      "successRate": 0.85
    },
    {
      "title": "重启打印后台处理程序",
      "steps": ["按下Win+R键打开运行", "输入services.msc", "找到Print Spooler服务", "右键点击重新启动"],
      "estimatedTime": "5分钟",
      "difficulty": "easy",
      "successRate": 0.90
    },
    {
      "title": "清除打印队列",
      "steps": ["打开控制面板", "进入设备和打印机", "右键点击打印机", "选择查看正在打印的内容", "点击打印机菜单", "选择取消所有文档"],
      "estimatedTime": "5分钟",
      "difficulty": "easy",
      "successRate": 0.88
    }
  ],
  "precautions": ["清除打印队列前确认不需要的打印任务"],
  "suggestion": "建议先检查打印机连接，如果问题仍然存在，再重启打印后台处理程序。"
}
      `.trim()
    },
    blueScreen: {
      keywords: ['蓝屏', 'BSOD', '0x000000', 'STOP'],
      response: `
{
  "primaryCause": "系统严重错误，可能由硬件故障、驱动问题或系统文件损坏引起",
  "secondaryCauses": ["硬件不兼容或损坏", "驱动程序冲突", "系统文件损坏", "恶意软件感染"],
  "solutions": [
    {
      "title": "分析蓝屏错误代码",
      "steps": ["记录蓝屏时显示的STOP代码", "访问微软官方文档查找代码含义", "根据代码定位问题"],
      "estimatedTime": "10分钟",
      "difficulty": "medium",
      "successRate": 0.80
    },
    {
      "title": "进入安全模式排查",
      "steps": ["重启电脑", "开机时按F8键", "选择安全模式", "如果能进入安全模式，说明问题可能是第三方软件或驱动引起的"],
      "estimatedTime": "15分钟",
      "difficulty": "medium",
      "successRate": 0.85
    },
    {
      "title": "检查硬件",
      "steps": ["关闭电脑并断开电源", "打开机箱检查内存条是否插紧", "检查显卡是否插紧", "清理灰尘"],
      "estimatedTime": "20分钟",
      "difficulty": "hard",
      "successRate": 0.82
    }
  ],
  "precautions": ["进入安全模式前保存重要数据", "硬件操作需要一定的计算机知识"],
  "suggestion": "建议先分析错误代码，如果问题仍然存在，再进入安全模式排查。"
}
      `.trim()
    },
    update: {
      keywords: ['更新', 'Windows Update', '升级', '补丁'],
      response: `
{
  "primaryCause": "Windows更新失败通常由以下原因导致：1) 更新文件损坏；2) 系统文件损坏；3) 软件冲突；4) 磁盘空间不足",
  "secondaryCauses": ["更新缓存损坏", "系统文件损坏", "第三方软件阻止", "磁盘空间不足"],
  "solutions": [
    {
      "title": "运行Windows更新疑难解答",
      "steps": ["打开设置", "进入更新和安全", "点击疑难解答", "选择Windows更新", "运行疑难解答"],
      "estimatedTime": "10分钟",
      "difficulty": "easy",
      "successRate": 0.85
    },
    {
      "title": "清除更新缓存",
      "steps": ["以管理员身份打开命令提示符", "执行 net stop wuauserv", "执行 rd /s /q C:\\Windows\\SoftwareDistribution", "执行 net start wuauserv"],
      "estimatedTime": "5分钟",
      "difficulty": "medium",
      "successRate": 0.88
    },
    {
      "title": "修复系统文件",
      "steps": ["以管理员身份打开命令提示符", "执行 sfc /scannow", "执行 DISM /Online /Cleanup-Image /RestoreHealth"],
      "estimatedTime": "20分钟",
      "difficulty": "medium",
      "successRate": 0.82
    }
  ],
  "precautions": ["清除更新缓存前确保没有正在进行的更新", "修复系统文件时不要中断操作"],
  "suggestion": "建议先运行Windows更新疑难解答，如果问题仍然存在，再清除更新缓存。"
}
      `.trim()
    }
  };

  const lowerPrompt = prompt.toLowerCase();
  
  for (const [key, pattern] of Object.entries(analysisPatterns)) {
    if (pattern.keywords.some(k => lowerPrompt.includes(k.toLowerCase()))) {
      return pattern.response;
    }
  }

  return `
{
  "primaryCause": "根据提供的信息分析，系统可能存在以下问题：系统服务异常、软件冲突、资源不足或配置错误",
  "secondaryCauses": ["系统服务异常", "软件冲突", "资源不足", "配置错误"],
  "solutions": [
    {
      "title": "运行系统诊断",
      "steps": ["打开设置", "进入更新和安全", "选择疑难解答", "选择合适的诊断工具运行"],
      "estimatedTime": "15分钟",
      "difficulty": "easy",
      "successRate": 0.75
    },
    {
      "title": "检查系统日志",
      "steps": ["按下Win+R键打开运行", "输入eventvwr.msc", "展开Windows日志", "查看系统日志中的错误信息"],
      "estimatedTime": "10分钟",
      "difficulty": "medium",
      "successRate": 0.80
    },
    {
      "title": "重启相关服务",
      "steps": ["按下Win+R键打开运行", "输入services.msc", "找到相关服务", "右键点击重新启动"],
      "estimatedTime": "5分钟",
      "difficulty": "easy",
      "successRate": 0.70
    }
  ],
  "precautions": ["备份重要数据", "关闭不必要的程序"],
  "suggestion": "建议先运行系统诊断工具，然后检查系统日志定位具体问题。"
}
  `.trim();
};

const callCustomAPI = async (prompt) => {
  try {
    const response = await axios.post(
      aiSettings.apiUrl,
      {
        model: aiSettings.model,
        prompt,
        max_tokens: aiSettings.maxTokens,
        temperature: aiSettings.temperature
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.apiKey}`
        },
        timeout: aiSettings.timeout
      }
    );

    if (response.data && response.data.result) {
      return response.data.result;
    } else if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].text) {
      return response.data.choices[0].text.trim();
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('调用自定义AI API失败:', error.message);
    throw error;
  }
};

const searchLocalKnowledgeBase = async (query, topK = 5) => {
  const results = {
    cases: [],
    documents: [],
    hasEnoughData: false
  };

  try {
    const caseResults = await Case.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { symptoms: { $in: query.split(' ').filter(s => s.length > 2) } },
        { tags: { $in: query.split(' ').filter(s => s.length > 2) } }
      ]
    })
    .select('id title description symptoms tags category status author createdAt')
    .limit(topK)
    .lean();

    results.cases = caseResults.map(c => ({
      type: 'case',
      id: c.id,
      title: c.title,
      description: c.description,
      symptoms: c.symptoms,
      tags: c.tags,
      category: c.category,
      status: c.status,
      author: c.author,
      createdAt: c.createdAt
    }));

    const docResults = await Document.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: query.split(' ').filter(s => s.length > 2) } }
      ]
    })
    .select('_id title description category type tags createdAt')
    .limit(topK)
    .lean();

    results.documents = docResults.map(d => ({
      type: 'document',
      id: d._id.toString(),
      title: d.title,
      description: d.description,
      category: d.category,
      tags: d.tags,
      createdAt: d.createdAt
    }));

    const totalResults = results.cases.length + results.documents.length;
    results.hasEnoughData = totalResults >= 2;

  } catch (error) {
    console.error('搜索本地知识库失败:', error.message);
  }

  return results;
};

const generateAnswerFromLocal = (question, localResults) => {
  let context = '';
  let sources = [];

  if (localResults.cases.length > 0) {
    context += '【相关故障案例】\n';
    localResults.cases.forEach((c, index) => {
      context += `${index + 1}. [${c.title}]\n症状: ${c.symptoms.join('、')}\n描述: ${c.description.substring(0, 150)}...\n\n`;
      sources.push({
        id: c.id,
        title: c.title,
        type: 'case',
        relevance: Math.random() * 0.3 + 0.7
      });
    });
  }

  if (localResults.documents.length > 0) {
    context += '【相关知识库文档】\n';
    localResults.documents.forEach((d, index) => {
      context += `${index + 1}. [${d.title}]\n分类: ${d.category}\n摘要: ${d.description.substring(0, 150)}...\n\n`;
      sources.push({
        id: d.id,
        title: d.title,
        type: 'document',
        relevance: Math.random() * 0.3 + 0.7
      });
    });
  }

  return { context, sources };
};

const getSmartQAPrompt = (question, localContext = '', useLocalOnly = false) => {
  const systemPrompt = `你是萌萌的运维人网站专属桌面运维AI，所有对话严格遵循以下执行规则：

一、前置内容校验（最先执行）
1. 用户发送纯闲聊、打招呼、无电脑故障相关提问（如你能看到我吗、在吗、你好、聊天互动类内容），固定回复：我仅提供电脑故障诊断相关服务，闲聊类问题无法解答，请描述你的电脑故障问题。
2. 用户提问不属于桌面运维范畴（服务器、代码开发、硬件拆机维修、生活闲聊等），统一使用兜底话术：当前暂无该故障标准化解决方案，请前往网站【故障诊断】板块提交工单，可申请工程师远程协助。

二、知识库应答规范
1. 优先调取知识库内Windows蓝屏、软件报错、网络、打印机、运维工具、远程协助排障文档，仅使用文档内实操步骤，禁止编造任何修复方案；
2. 知识库无匹配故障时，固定输出兜底话术：当前暂无该故障标准化解决方案，可以联网查询可靠方案
3. 回答结构统一：故障成因→分步修复操作→风险提示→对应网站功能板块指引；
4. 用户询问工具，仅推荐本站工具分享平台收录的运维工具，附带网站工具板块指引；
5. 高危操作（修改注册表、格式化、系统重置、组策略深度修改等）必须醒目标注风险警告，告知操作前备份数据。

三、输出约束
禁止输出服务器运维、程序开发、硬件拆机维修等无关内容，超出桌面运维业务范围统一执行兜底回复；禁止自行生成通用排障步骤（重启、查日志这类通用话术不允许主动输出）。

${useLocalOnly ? '知识库内容：\n' + (localContext || '暂无相关知识库内容') : (localContext ? '参考信息（请优先基于此回答，如果信息不足可以补充你的专业知识）：\n' + localContext : '')}

用户问题：${question}

请根据以上规则进行回答。`;

  return systemPrompt.trim();
};

const getDiagnosisPrompt = (symptoms, deviceType, brand, model, errorCode, additionalInfo) => {
  return `【症状描述】
${symptoms.join('、')}

【设备信息】
- 设备类型：${deviceType || '未知'}
- 设备品牌：${brand || '未知'}
- 设备型号：${model || '未知'}
- 错误代码：${errorCode || '无'}
- 补充信息：${additionalInfo || '无'}

严格输出以下JSON结构，禁止增加任何额外文字：
{
  "primaryCause": "详细分析问题根本原因",
  "secondaryCauses": ["次要原因1","次要原因2"],
  "solutions": [
    {
      "title": "方案标题",
      "steps": ["分步操作，含Windows菜单路径/命令"],
      "estimatedTime": "耗时",
      "difficulty": "easy/medium/hard",
      "successRate": 0~1小数
    }
  ],
  "precautions": ["高危操作提醒备份"],
  "suggestion": "综合排查建议"
}
要求：原因深入、步骤带具体操作、方案按成功率从高到低排序，高危操作标注数据备份提醒。
  `.trim();
};

const getKnowledgeQAPrompt = (question, documents) => {
  let context = '';
  if (documents && documents.length > 0) {
    context = documents.map(doc => `
文档标题：${doc.title}
文档分类：${doc.category}
文档摘要：${doc.description || doc.content.substring(0, 200)}
    `.trim()).join('\n\n');
  }

  return `
你是一位专业的IT知识库助手，请基于提供的知识库内容回答用户问题。

知识库参考内容：
${context || '暂无相关文档'}

用户问题：${question}

请根据知识库内容给出详细、准确的回答。如果知识库中没有相关信息，请明确说明并提供一般性建议。

回答要求：
1. 基于知识库内容进行回答
2. 引用相关文档时注明来源
3. 回答要清晰、有条理
4. 语言要简洁易懂

请直接给出答案，不需要解释思考过程。
  `.trim();
};

const getDocumentSummaryPrompt = (content, length = 'medium') => {
  const lengthDesc = {
    short: '简短（约100字）',
    medium: '中等（约200字）',
    long: '详细（约300字）'
  };

  return `
请对以下文档内容进行摘要：

文档内容：
${content.substring(0, 2000)}

要求：
1. 摘要长度：${lengthDesc[length]}
2. 提取关键点（不超过5个）
3. 保持原意不变
4. 语言简洁清晰

请按照以下JSON格式输出：
{
  "summary": "文档摘要内容",
  "keyPoints": ["关键点1", "关键点2", "关键点3"]
}
  `.trim();
};

const getExperimentAnalysisPrompt = (faultType, logs, metrics) => {
  let logText = '';
  if (logs && logs.length > 0) {
    logText = logs.map(log => `[${log.timestamp}] ${log.level}: ${log.message}`).join('\n');
  }

  let metricsText = '';
  if (metrics) {
    metricsText = JSON.stringify(metrics, null, 2);
  }

  return `
你是一位专业的IT系统实验分析专家，请分析以下实验数据：

故障类型：${faultType}

实验日志：
${logText || '暂无日志'}

性能指标：
${metricsText || '暂无指标'}

请按照以下JSON格式输出分析结果：
{
  "rootCause": {
    "primary": "主要根因",
    "secondary": ["次要原因1", "次要原因2"],
    "confidence": 置信度(0-1)
  },
  "issues": [
    {
      "severity": "严重程度（critical/warning/info）",
      "description": "问题描述"
    }
  ],
  "recommendations": [
    {
      "priority": "优先级（high/medium/low）",
      "action": "建议操作",
      "expectedImpact": "预期影响"
    }
  ],
  "suggestedFix": "综合解决方案"
}
  `.trim();
};

module.exports = {
  loadAISettings,
  clearAISettingsCache,
  callAI,
  callDoubaoAPI,
  callOpenAIAPI,
  searchLocalKnowledgeBase,
  generateAnswerFromLocal,
  getSmartQAPrompt,
  getDiagnosisPrompt,
  getKnowledgeQAPrompt,
  getDocumentSummaryPrompt,
  getExperimentAnalysisPrompt
};
