const SystemSettings = require('../models/SystemSettings');

const getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
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