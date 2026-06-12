import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Database,
  Plug,
  Globe,
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Brain
} from 'lucide-react';
import { SystemSettings } from '@/types';
import { settingsAPI } from '@/services/api';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings({
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
        },
        updatedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    if (!settings) return;
    const fields = field.split('.');
    if (fields.length === 1) {
      setSettings(prev => prev ? { ...prev, [field]: value } : null);
    } else if (fields.length === 2) {
      const [parent, child] = fields;
      setSettings(prev => prev ? ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof SystemSettings] as object),
          [child]: value
        }
      }) : null);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await settingsAPI.update(settings);
      setSaved(true);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = () => {
    loadSettings();
    setShowResetConfirm(false);
    setSaved(true);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data Retention', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'ai', label: 'AI Settings', icon: Brain },
  ];

  const timezones = [
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Australia/Sydney',
  ];

  const languages = [
    { value: 'zh-CN', label: 'Chinese (Simplified)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'ja-JP', label: 'Japanese' },
    { value: 'ko-KR', label: 'Korean' },
  ];

  const renderGeneralSettings = () => {
    if (!settings) return null;
    return (
      <div className="space-y-8">
        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Organization Information</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Organization Name</label>
              <input
                type="text"
                value={settings.organizationName}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Regional Settings</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-text-muted" />
                <span className="text-sm font-medium text-text-muted">Auto Daylight Saving</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.appearance.animationsEnabled}
                  onChange={(e) => handleInputChange('appearance.animationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-text-muted" />
                <span className="text-sm font-medium text-text-muted">Sidebar Collapsed</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.appearance.sidebarCollapsed}
                  onChange={(e) => handleInputChange('appearance.sidebarCollapsed', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => {
    if (!settings) return null;
    return (
      <div className="space-y-8">
        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser push notifications' },
              { key: 'mentionNotifications', label: 'Mention Notifications', desc: 'Get notified when mentioned' },
              { key: 'commentNotifications', label: 'Comment Notifications', desc: 'Get notified on comments' },
              { key: 'systemAlertNotifications', label: 'System Alerts', desc: 'Receive critical system alerts' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                <div>
                  <div className="font-medium text-theme-text">{item.label}</div>
                  <div className="text-sm text-text-muted">{item.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                    onChange={(e) => handleInputChange(`notifications.${item.key}`, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Digest Settings</h3>
          <div className="space-y-4">
            {[
              { key: 'dailyDigest', label: 'Daily Digest', desc: 'Receive daily summary email' },
              { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive weekly summary email' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                <div>
                  <div className="font-medium text-theme-text">{item.label}</div>
                  <div className="text-sm text-text-muted">{item.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                    onChange={(e) => handleInputChange(`notifications.${item.key}`, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSecuritySettings = () => {
    if (!settings) return null;
    return (
      <div className="space-y-8">
        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Password Policy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Two-Factor Authentication</div>
                <div className="text-sm text-text-muted">Require 2FA for all users</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleInputChange('security.twoFactorAuth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Require Strong Passwords</div>
                <div className="text-sm text-text-muted">Enforce password complexity requirements</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.requireStrongPasswords}
                  onChange={(e) => handleInputChange('security.requireStrongPasswords', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Session Timeout Warning</div>
                <div className="text-sm text-text-muted">Warn users before session expiration</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.sessionTimeoutWarning}
                  onChange={(e) => handleInputChange('security.sessionTimeoutWarning', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-text-muted mb-2">Password Expiration Days</label>
            <input
              type="number"
              min="7"
              max="365"
              value={settings.security.passwordExpirationDays}
              onChange={(e) => handleInputChange('security.passwordExpirationDays', parseInt(e.target.value))}
              className="w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-text-muted mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              min="5"
              max="120"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleInputChange('security.sessionTimeout', parseInt(e.target.value))}
              className="w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-text-muted mb-2">Max Login Attempts</label>
            <input
              type="number"
              min="3"
              max="10"
              value={settings.security.maxLoginAttempts}
              onChange={(e) => handleInputChange('security.maxLoginAttempts', parseInt(e.target.value))}
              className="w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderAppearanceSettings = () => {
    if (!settings) return null;
    return (
      <div className="space-y-8">
        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Theme Settings</h3>
          <div className="grid grid-cols-3 gap-4">
            {['light', 'dark', 'system'].map(theme => (
              <button
                key={theme}
                onClick={() => handleInputChange('appearance.theme', theme)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.appearance.theme === theme
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-capitalize font-medium text-theme-text">{theme}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Interface Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Animations</div>
                <div className="text-sm text-text-muted">Enable interface animations</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.appearance.animationsEnabled}
                  onChange={(e) => handleInputChange('appearance.animationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Sidebar Collapsed</div>
                <div className="text-sm text-text-muted">Collapse sidebar by default</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.appearance.sidebarCollapsed}
                  onChange={(e) => handleInputChange('appearance.sidebarCollapsed', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Customization</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Accent Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.appearance.accentColor}
                  onChange={(e) => handleInputChange('appearance.accentColor', e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={settings.appearance.accentColor}
                  onChange={(e) => handleInputChange('appearance.accentColor', e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Font Size</label>
              <select
                value={settings.appearance.fontSize}
                onChange={(e) => handleInputChange('appearance.fontSize', e.target.value)}
                className="w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDataSettings = () => {
    if (!settings) return null;
    return (
      <div className="space-y-8">
        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Data Retention Policy</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Log Retention Period (Days)</label>
              <input
                type="number"
                min="30"
                max="3650"
                value={settings.dataRetention.logRetentionDays}
                onChange={(e) => handleInputChange('dataRetention.logRetentionDays', parseInt(e.target.value))}
                className="w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
              <p className="text-sm text-text-muted mt-2">Automatically delete logs older than the specified days</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Cleanup Interval (Days)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.dataRetention.cleanupIntervalDays}
                onChange={(e) => handleInputChange('dataRetention.cleanupIntervalDays', parseInt(e.target.value))}
                className="w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Max Storage (MB)</label>
              <input
                type="number"
                min="100"
                max="10000"
                value={settings.dataRetention.maxStorageMB}
                onChange={(e) => handleInputChange('dataRetention.maxStorageMB', parseInt(e.target.value))}
                className="w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Auto-cleanup</div>
                <div className="text-sm text-text-muted">Automatically clean up old data</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataRetention.autoCleanupEnabled}
                  onChange={(e) => handleInputChange('dataRetention.autoCleanupEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Backup Settings</h3>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Backup Frequency</label>
            <div className="grid grid-cols-3 gap-4">
              {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                <button
                  key={freq}
                  onClick={() => handleInputChange('dataRetention.backupFrequency', freq)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.dataRetention.backupFrequency === freq
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-capitalize font-medium text-theme-text">{freq}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIntegrationSettings = () => {
    if (!settings) return null;
    return (
      <div className="space-y-8">
        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">Third-party Integrations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Slack Integration</div>
                <div className="text-sm text-text-muted">Connect with Slack workspace</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.integrations.slackIntegration}
                  onChange={(e) => handleInputChange('integrations.slackIntegration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Email Integration</div>
                <div className="text-sm text-text-muted">Connect email notifications</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.integrations.emailIntegration}
                  onChange={(e) => handleInputChange('integrations.emailIntegration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Microsoft Teams Integration</div>
                <div className="text-sm text-text-muted">Connect with Microsoft Teams</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.integrations.microsoftTeamsIntegration}
                  onChange={(e) => handleInputChange('integrations.microsoftTeamsIntegration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div>
                <div className="font-medium text-theme-text">Webhooks</div>
                <div className="text-sm text-text-muted">Enable outgoing webhooks</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.integrations.webhookEnabled}
                  onChange={(e) => handleInputChange('integrations.webhookEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">API Settings</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
            <div>
              <div className="font-medium text-theme-text">API Access</div>
              <div className="text-sm text-text-muted">Enable API access for integrations</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.integrations.apiAccessEnabled}
                onChange={(e) => handleInputChange('integrations.apiAccessEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderAISettings = () => {
    if (!settings) return null;
    return (
      <div className="space-y-8">
        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">AI Service Status</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
            <div>
              <div className="font-medium text-theme-text">AI Service Enabled</div>
              <div className="text-sm text-text-muted">Enable AI-powered features</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.aiSettings?.enabled ?? true}
                onChange={(e) => handleInputChange('aiSettings.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">AI Provider</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'doubao', label: 'Doubao', desc: 'ByteDance Doubao API' },
              { value: 'openai', label: 'OpenAI', desc: 'OpenAI GPT API' },
              { value: 'custom', label: 'Custom', desc: 'Custom API endpoint' },
            ].map(provider => (
              <button
                key={provider.value}
                onClick={() => handleInputChange('aiSettings.provider', provider.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  (settings.aiSettings?.provider ?? 'doubao') === provider.value
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-theme-text">{provider.label}</div>
                <div className="text-xs text-text-muted mt-1">{provider.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">API Configuration</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">API Key</label>
              <input
                type="password"
                value={settings.aiSettings?.apiKey ?? ''}
                onChange={(e) => handleInputChange('aiSettings.apiKey', e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
              <p className="text-sm text-text-muted mt-2">
                Your API key is stored securely and never exposed to the client.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">API URL</label>
              <input
                type="text"
                value={settings.aiSettings?.apiUrl ?? 'https://ark.cn-beijing.volces.com/api/text/text'}
                onChange={(e) => handleInputChange('aiSettings.apiUrl', e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Model Name</label>
              <input
                type="text"
                value={settings.aiSettings?.model ?? 'doubao-pro'}
                onChange={(e) => handleInputChange('aiSettings.model', e.target.value)}
                placeholder="Model name"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-6">AI Parameters</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Max Tokens</label>
              <input
                type="number"
                min="256"
                max="8192"
                value={settings.aiSettings?.maxTokens ?? 4096}
                onChange={(e) => handleInputChange('aiSettings.maxTokens', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
              <p className="text-xs text-text-muted mt-2">Maximum tokens per response</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Temperature</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.aiSettings?.temperature ?? 0.7}
                onChange={(e) => handleInputChange('aiSettings.temperature', parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
              <p className="text-xs text-text-muted mt-2">0 = deterministic, 2 = creative</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Timeout (ms)</label>
              <input
                type="number"
                min="5000"
                max="60000"
                value={settings.aiSettings?.timeout ?? 30000}
                onChange={(e) => handleInputChange('aiSettings.timeout', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
              <p className="text-xs text-text-muted mt-2">Request timeout in milliseconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-text">System Settings</h1>
            <p className="text-text-muted">Configure global settings for your organization</p>
          </div>
        </div>

        <div className="flex gap-6">
          <nav className="w-64 flex-shrink-0">
            <div className="bg-white/85 border border-primary/20 rounded-xl p-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex-1">
            <div className="bg-white/85 border border-primary/20 rounded-xl p-2 mb-6">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-theme-text">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-theme-text hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                  >
                    {saved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'appearance' && renderAppearanceSettings()}
            {activeTab === 'data' && renderDataSettings()}
            {activeTab === 'integrations' && renderIntegrationSettings()}
            {activeTab === 'ai' && renderAISettings()}
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-theme-text">Confirm Reset</h3>
            </div>
            <p className="text-text-muted mb-6">
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-text-muted hover:text-theme-text hover:bg-gray-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all"
              >
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;