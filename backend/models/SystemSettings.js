const mongoose = require('mongoose');

const NotificationSettingsSchema = new mongoose.Schema({
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  mentionNotifications: {
    type: Boolean,
    default: true
  },
  commentNotifications: {
    type: Boolean,
    default: true
  },
  systemAlertNotifications: {
    type: Boolean,
    default: true
  },
  dailyDigest: {
    type: Boolean,
    default: true
  },
  weeklyDigest: {
    type: Boolean,
    default: false
  }
});

const SecuritySettingsSchema = new mongoose.Schema({
  sessionTimeout: {
    type: Number,
    default: 30
  },
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  passwordExpirationDays: {
    type: Number,
    default: 90
  },
  maxLoginAttempts: {
    type: Number,
    default: 5
  },
  sessionTimeoutWarning: {
    type: Boolean,
    default: true
  },
  requireStrongPasswords: {
    type: Boolean,
    default: true
  }
});

const AppearanceSettingsSchema = new mongoose.Schema({
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'light'
  },
  accentColor: {
    type: String,
    default: '#3B82F6'
  },
  fontSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  sidebarCollapsed: {
    type: Boolean,
    default: false
  },
  animationsEnabled: {
    type: Boolean,
    default: true
  }
});

const DataRetentionSettingsSchema = new mongoose.Schema({
  logRetentionDays: {
    type: Number,
    default: 90
  },
  backupFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  autoCleanupEnabled: {
    type: Boolean,
    default: true
  },
  cleanupIntervalDays: {
    type: Number,
    default: 7
  },
  maxStorageMB: {
    type: Number,
    default: 10240
  }
});

const IntegrationSettingsSchema = new mongoose.Schema({
  emailIntegration: {
    type: Boolean,
    default: true
  },
  slackIntegration: {
    type: Boolean,
    default: false
  },
  microsoftTeamsIntegration: {
    type: Boolean,
    default: true
  },
  apiAccessEnabled: {
    type: Boolean,
    default: true
  },
  webhookEnabled: {
    type: Boolean,
    default: true
  }
});

const AISettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  provider: {
    type: String,
    enum: ['doubao', 'openai', 'custom'],
    default: 'doubao'
  },
  apiKey: {
    type: String,
    default: ''
  },
  apiUrl: {
    type: String,
    default: 'https://ark.cn-beijing.volces.com/api/text/text'
  },
  model: {
    type: String,
    default: 'doubao-pro'
  },
  maxTokens: {
    type: Number,
    default: 4096
  },
  temperature: {
    type: Number,
    default: 0.7
  },
  timeout: {
    type: Number,
    default: 30000
  }
});

const SystemSettingsSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  organizationName: {
    type: String,
    required: [true, '请输入组织名称'],
    trim: true
  },
  organizationLogo: {
    type: String
  },
  timezone: {
    type: String,
    default: 'Asia/Shanghai'
  },
  language: {
    type: String,
    default: 'zh-CN'
  },
  notifications: NotificationSettingsSchema,
  security: SecuritySettingsSchema,
  appearance: AppearanceSettingsSchema,
  dataRetention: DataRetentionSettingsSchema,
  integrations: IntegrationSettingsSchema,
  aiSettings: AISettingsSchema,
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);