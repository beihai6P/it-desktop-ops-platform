import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Database, Shield, Bell, Globe, Save, RefreshCw, Brain, DatabaseIcon, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { settingsAPI } from '../services/api';
import { scheduler } from '@scheduler';
import type { SystemSettings } from '../types';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings>({
    id: '',
    organizationName: '运维管理平台',
    siteName: 'IT运维平台',
    siteDescription: '智能化桌面运维管理解决方案',
    defaultLanguage: 'zh-CN',
    timezone: 'Asia/Shanghai',
    security: {
      enableTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
    },
    notifications: {
      enableNotifications: true,
      enableEmailNotifications: true,
      enablePushNotifications: false,
    },
    createdAt: '',
    updatedAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    provider: 'doubao',
    apiKey: '',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/text/text',
    model: 'doubao-pro',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000,
  });
  const [dataRetention, setDataRetention] = useState({
    userDataRetention: 365,
    logRetention: 90,
    backupFrequency: 'daily',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      const data = response.data || response;
      if (data) {
        setSettings(data);
        if (data.security) {
          setSettings(prev => ({
            ...prev,
            security: { ...prev.security, ...data.security }
          }));
        }
        if (data.notifications) {
          setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, ...data.notifications }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await settingsAPI.updateSettings({
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        defaultLanguage: settings.defaultLanguage,
        timezone: settings.timezone,
      });
      await settingsAPI.updateSecurity({
        enableTwoFactor: settings.security.enableTwoFactor,
        sessionTimeout: settings.security.sessionTimeout,
        maxLoginAttempts: settings.security.maxLoginAttempts,
      });
      await settingsAPI.updateNotifications({
        enableNotifications: settings.notifications.enableNotifications,
        enableEmailNotifications: settings.notifications.enableEmailNotifications,
        enablePushNotifications: settings.notifications.enablePushNotifications,
      });
      await settingsAPI.updateAISettings({
        enabled: aiSettings.enabled,
        provider: aiSettings.provider,
        apiKey: aiSettings.apiKey,
        apiUrl: aiSettings.apiUrl,
        model: aiSettings.model,
        maxTokens: aiSettings.maxTokens,
        temperature: aiSettings.temperature,
        timeout: aiSettings.timeout,
      });
      await settingsAPI.updateDataRetention({
        logRetentionDays: dataRetention.logRetention,
        backupFrequency: dataRetention.backupFrequency,
        autoCleanupEnabled: true,
        cleanupIntervalDays: 7,
        maxStorageMB: 10240,
      });
      setSaveMessage('success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleReset = () => {
    setSettings({
      id: '',
      organizationName: '运维管理平台',
      siteName: 'IT运维平台',
      siteDescription: '智能化桌面运维管理解决方案',
      defaultLanguage: 'zh-CN',
      timezone: 'Asia/Shanghai',
      security: {
        enableTwoFactor: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
      },
      notifications: {
        enableNotifications: true,
        enableEmailNotifications: true,
        enablePushNotifications: false,
      },
      createdAt: '',
      updatedAt: '',
    });
    setAiSettings({
      enabled: true,
      provider: 'doubao',
      apiKey: '',
      apiUrl: 'https://ark.cn-beijing.volces.com/api/text/text',
      model: 'doubao-pro',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000,
    });
    setDataRetention({
      userDataRetention: 365,
      logRetention: 90,
      backupFrequency: 'daily',
    });
  };

  const tabs = [
    { id: 'general', label: '常规设置', icon: SettingsIcon },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'ai', label: 'AI设置', icon: Brain },
    { id: 'data', label: '数据保留', icon: DatabaseIcon },
    { id: 'system', label: '系统状态', icon: Server },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">系统设置</h2>
          <p className="text-sm text-text-muted mt-1">配置平台各项参数</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`mb-4 p-4 rounded-xl flex items-center gap-2 ${
          saveMessage === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {saveMessage === 'success' ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>设置保存成功</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              <span>保存失败，请重试</span>
            </>
          )}
        </div>
      )}

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:bg-gray-50 hover:text-theme-text'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-theme-text">常规设置</h3>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">平台名称</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">平台描述</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">默认语言</label>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">时区</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="Asia/Shanghai">Asia/Shanghai</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-theme-text">安全设置</h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-theme-text">双因素认证</p>
                  <p className="text-sm text-text-muted">启用后登录需要额外验证</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.enableTwoFactor}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      security: { ...settings.security, enableTwoFactor: e.target.checked } 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">会话超时时间（分钟）</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    security: { ...settings.security, sessionTimeout: parseInt(e.target.value) || 0 } 
                  })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">最大登录尝试次数</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) || 0 } 
                  })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-theme-text">通知设置</h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-theme-text">启用通知</p>
                  <p className="text-sm text-text-muted">接收平台通知消息</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.enableNotifications}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      notifications: { ...settings.notifications, enableNotifications: e.target.checked } 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-theme-text">邮件通知</p>
                  <p className="text-sm text-text-muted">通过邮件接收通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.enableEmailNotifications}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      notifications: { ...settings.notifications, enableEmailNotifications: e.target.checked } 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-theme-text">推送通知</p>
                  <p className="text-sm text-text-muted">通过浏览器推送接收通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.enablePushNotifications}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      notifications: { ...settings.notifications, enablePushNotifications: e.target.checked } 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-theme-text">AI设置</h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-theme-text">启用AI功能</p>
                  <p className="text-sm text-text-muted">启用后可使用AI诊断助手等功能</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiSettings.enabled}
                    onChange={(e) => setAiSettings({ ...aiSettings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">AI服务提供商</label>
                <select
                  value={aiSettings.provider}
                  onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="doubao">豆包 (Doubao)</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">API密钥</label>
                <input
                  type="password"
                  value={aiSettings.apiKey}
                  onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                  placeholder="请输入API密钥"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">API端点URL</label>
                <input
                  type="text"
                  value={aiSettings.apiUrl}
                  onChange={(e) => setAiSettings({ ...aiSettings, apiUrl: e.target.value })}
                  placeholder="请输入API端点URL"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">模型名称</label>
                <input
                  type="text"
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                  placeholder="请输入模型名称"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">最大Token数</label>
                  <input
                    type="number"
                    value={aiSettings.maxTokens}
                    onChange={(e) => setAiSettings({ ...aiSettings, maxTokens: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">温度参数</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={aiSettings.temperature}
                    onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">超时时间(ms)</label>
                  <input
                    type="number"
                    value={aiSettings.timeout}
                    onChange={(e) => setAiSettings({ ...aiSettings, timeout: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-theme-text">数据保留设置</h3>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">用户数据保留期限（天）</label>
                <input
                  type="number"
                  value={dataRetention.userDataRetention}
                  onChange={(e) => setDataRetention({ ...dataRetention, userDataRetention: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">日志保留期限（天）</label>
                <input
                  type="number"
                  value={dataRetention.logRetention}
                  onChange={(e) => setDataRetention({ ...dataRetention, logRetention: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">自动备份频率</label>
                <select
                  value={dataRetention.backupFrequency}
                  onChange={(e) => setDataRetention({ ...dataRetention, backupFrequency: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="hourly">每小时</option>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-theme-text">系统状态</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">服务器状态</p>
                      <p className="text-sm text-green-600">运行中</p>
                    </div>
                  </div>
                  <div className="text-sm text-green-700">
                    <p>CPU: 24%</p>
                    <p>内存: 1.2GB / 4GB</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">数据库状态</p>
                      <p className="text-sm text-blue-600">连接正常</p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p>连接池: 8/20</p>
                    <p>响应时间: 12ms</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-purple-800">API状态</p>
                      <p className="text-sm text-purple-600">运行正常</p>
                    </div>
                  </div>
                  <div className="text-sm text-purple-700">
                    <p>平均响应: 5ms</p>
                    <p>今日请求: 12,345</p>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-800">AI服务</p>
                      <p className="text-sm text-orange-600">已启用</p>
                    </div>
                  </div>
                  <div className="text-sm text-orange-700">
                    <p>模型: GPT-4</p>
                    <p>今日调用: 234次</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-text-muted" />
                  <div>
                    <p className="font-medium text-theme-text">API 端点</p>
                    <p className="text-sm text-text-muted">{scheduler.config.api.baseUrl}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
