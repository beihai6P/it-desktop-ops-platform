const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');

let aiSettings = null;

const loadAISettings = async () => {
  try {
    const settings = await SystemSettings.findOne();
    if (settings && settings.aiSettings) {
      aiSettings = settings.aiSettings;
    } else {
      aiSettings = {
        enabled: true,
        provider: 'doubao',
        apiKey: '',
        apiUrl: 'https://ark.cn-beijing.volces.com/api/text/text',
        model: 'doubao-pro',
        maxTokens: 4096,
        temperature: 0.7,
        timeout: 30000
      };
    }
  } catch (error) {
    aiSettings = {
      enabled: true,
      provider: 'doubao',
      apiKey: '',
      apiUrl: 'https://ark.cn-beijing.volces.com/api/text/text',
      model: 'doubao-pro',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000
    };
  }
};

const callDoubaoAPI = async (prompt) => {
  if (!aiSettings) {
    await loadAISettings();
  }

  if (!aiSettings.enabled || !aiSettings.apiKey) {
    throw new Error('AI服务未启用或未配置API密钥');
  }

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
      throw new Error('AI API返回格式不正确');
    }
  } catch (error) {
    console.error('调用豆包API失败:', error.message);
    throw error;
  }
};

const callOpenAIAPI = async (prompt) => {
  if (!aiSettings) {
    await loadAISettings();
  }

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
  if (!aiSettings) {
    await loadAISettings();
  }

  switch (aiSettings.provider) {
    case 'doubao':
      return await callDoubaoAPI(prompt);
    case 'openai':
      return await callOpenAIAPI(prompt);
    case 'custom':
      return await callDoubaoAPI(prompt);
    default:
      return await callDoubaoAPI(prompt);
  }
};

const getDiagnosisPrompt = (symptoms, deviceType, brand, model, errorCode, additionalInfo) => {
  return `
你是一位专业的IT运维故障诊断专家，请基于用户提供的症状信息进行分析：

症状列表：${symptoms.join('、')}
设备类型：${deviceType || '未知'}
设备品牌：${brand || '未知'}
设备型号：${model || '未知'}
错误代码：${errorCode || '无'}
补充信息：${additionalInfo || '无'}

请按照以下结构输出诊断结果（JSON格式）：
{
  "primaryCause": "主要根因分析",
  "secondaryCauses": ["次要原因1", "次要原因2"],
  "solutions": [
    {
      "title": "解决方案标题",
      "steps": ["步骤1", "步骤2", "步骤3"],
      "estimatedTime": "预计时间",
      "difficulty": "难度（easy/medium/hard）",
      "successRate": 成功率(0-1)
    }
  ],
  "precautions": ["注意事项1", "注意事项2"],
  "suggestion": "综合建议"
}
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
  callAI,
  callDoubaoAPI,
  callOpenAIAPI,
  getDiagnosisPrompt,
  getKnowledgeQAPrompt,
  getDocumentSummaryPrompt,
  getExperimentAnalysisPrompt
};
