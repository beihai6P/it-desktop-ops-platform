const SystemSettings = require('../models/SystemSettings');
const { clearAISettingsCache } = require('../services/aiService');

const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    
    // 如果没有设置，创建一个默认设置
    if (!settings) {
      settings = await SystemSettings.create({
        id: 'settings-001',
        organizationName: '运维管理平台',
        timezone: 'Asia/Shanghai',
        language: 'zh-CN',
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          mentionNotifications: true,
          commentNotifications: true,
          systemAlertNotifications: true,
          dailyDigest: true,
          weeklyDigest: false
        },
        security: {
          sessionTimeout: 30,
          twoFactorAuth: false,
          passwordExpirationDays: 90,
          maxLoginAttempts: 5,
          sessionTimeoutWarning: true,
          requireStrongPasswords: true
        },
        appearance: {
          theme: 'light',
          accentColor: '#3B82F6',
          fontSize: 'medium',
          sidebarCollapsed: false,
          animationsEnabled: true
        },
        dataRetention: {
          logRetentionDays: 90,
          backupFrequency: 'daily',
          autoCleanupEnabled: true,
          cleanupIntervalDays: 7,
          maxStorageMB: 10240
        },
        integrations: {
          emailIntegration: true,
          slackIntegration: false,
          microsoftTeamsIntegration: true,
          apiAccessEnabled: true,
          webhookEnabled: true
        },
        aiSettings: {
          enabled: true,
          provider: 'doubao',
          apiKey: '',
          apiUrl: 'https://ark.cn-beijing.volces.com/api/text/text',
          model: 'doubao-pro',
          maxTokens: 4096,
          temperature: 0.7,
          timeout: 30000
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateSettings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    console.log('[Settings] 收到设置更新请求:', JSON.stringify(req.body, null, 2));

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        id: 'settings-001',
        organizationName: '运维管理平台'
      });
    }

    const updatedSettings = await SystemSettings.findOneAndUpdate(
      {},
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    console.log('[Settings] 设置更新成功，AI配置:', updatedSettings.aiSettings);

    clearAISettingsCache();

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    const settings = await SystemSettings.findOne();

    if (!settings) {
      return res.status(404).json({ message: '系统设置不存在' });
    }

    settings.notifications = { ...settings.notifications, ...req.body };
    settings.updatedAt = Date.now();
    await settings.save();

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateSecuritySettings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    const settings = await SystemSettings.findOne();

    if (!settings) {
      return res.status(404).json({ message: '系统设置不存在' });
    }

    settings.security = { ...settings.security, ...req.body };
    settings.updatedAt = Date.now();
    await settings.save();

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateAppearanceSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();

    if (!settings) {
      return res.status(404).json({ message: '系统设置不存在' });
    }

    settings.appearance = { ...settings.appearance, ...req.body };
    settings.updatedAt = Date.now();
    await settings.save();

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateDataRetentionSettings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    const settings = await SystemSettings.findOne();

    if (!settings) {
      return res.status(404).json({ message: '系统设置不存在' });
    }

    settings.dataRetention = { ...settings.dataRetention, ...req.body };
    settings.updatedAt = Date.now();
    await settings.save();

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateIntegrationSettings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    const settings = await SystemSettings.findOne();

    if (!settings) {
      return res.status(404).json({ message: '系统设置不存在' });
    }

    settings.integrations = { ...settings.integrations, ...req.body };
    settings.updatedAt = Date.now();
    await settings.save();

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateAISettings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        id: 'settings-001',
        organizationName: '运维管理平台',
        aiSettings: req.body
      });
    } else {
      settings.aiSettings = { ...settings.aiSettings, ...req.body };
      settings.updatedAt = Date.now();
      await settings.save();
    }

    clearAISettingsCache();

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updateAppearanceSettings,
  updateDataRetentionSettings,
  updateIntegrationSettings,
  updateAISettings
};