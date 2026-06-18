import type { SchedulerConfig, Logger, LogLevel } from './types';

const defaultConfig: SchedulerConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
  },
  storage: {
    chunkSize: 5 * 1024 * 1024,
    minMultipartSize: 4 * 1024 * 1024,
    maxFileSize: {
      image: 20 * 1024 * 1024,
      video: 200 * 1024 * 1024,
      archive: 2 * 1024 * 1024 * 1024,
      document: 50 * 1024 * 1024,
    },
    allowedTypes: {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'],
      video: ['video/mp4', 'video/quicktime', 'video/mpeg', 'video/x-msvideo', 'video/avi', 'video/webm'],
      archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/octet-stream'],
      document: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp',
        'text/plain', 'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/html', 'application/json',
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      ],
    },
  },
  logging: {
    enabled: import.meta.env.VITE_LOGGING_ENABLED === 'true' || true,
    level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
  },
};

class ConfigManager {
  private config: SchedulerConfig;
  private logger: Logger;

  constructor() {
    this.config = { ...defaultConfig };
    this.logger = this.createLogger();
    this.loadEnvConfig();
  }

  private createLogger(): Logger {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logging.level);

    const createLogMethod = (level: LogLevel) => (...args: unknown[]) => {
      if (!this.config.logging.enabled) return;
      const levelIndex = levels.indexOf(level);
      if (levelIndex >= currentLevelIndex) {
        console[level]('[Scheduler]', ...args);
      }
    };

    return {
      debug: createLogMethod('debug'),
      info: createLogMethod('info'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
    };
  }

  private loadEnvConfig(): void {
    if (import.meta.env.VITE_API_URL) {
      this.config.api.baseUrl = import.meta.env.VITE_API_URL;
    }

    if (import.meta.env.VITE_API_TIMEOUT) {
      const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT, 10);
      if (!isNaN(timeout)) {
        this.config.api.timeout = timeout;
      }
    }

    if (import.meta.env.VITE_API_RETRY_COUNT) {
      const retryCount = parseInt(import.meta.env.VITE_API_RETRY_COUNT, 10);
      if (!isNaN(retryCount)) {
        this.config.api.retryCount = retryCount;
      }
    }

    if (import.meta.env.VITE_API_RETRY_DELAY) {
      const retryDelay = parseInt(import.meta.env.VITE_API_RETRY_DELAY, 10);
      if (!isNaN(retryDelay)) {
        this.config.api.retryDelay = retryDelay;
      }
    }

    if (import.meta.env.VITE_LOG_LEVEL) {
      const level = import.meta.env.VITE_LOG_LEVEL as LogLevel;
      if (['debug', 'info', 'warn', 'error'].includes(level)) {
        this.config.logging.level = level;
      }
    }

    if (import.meta.env.VITE_LOGGING_ENABLED !== undefined) {
      this.config.logging.enabled = import.meta.env.VITE_LOGGING_ENABLED === 'true';
    }

    this.logger.info('Configuration loaded successfully', {
      apiBaseUrl: this.config.api.baseUrl,
      loggingLevel: this.config.logging.level,
    });
  }

  getConfig(): Readonly<SchedulerConfig> {
    return this.config;
  }

  getApiConfig(): Readonly<SchedulerConfig['api']> {
    return this.config.api;
  }

  getStorageConfig(): Readonly<SchedulerConfig['storage']> {
    return this.config.storage;
  }

  getLoggingConfig(): Readonly<SchedulerConfig['logging']> {
    return this.config.logging;
  }

  getLogger(): Logger {
    return this.logger;
  }

  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Configuration updated', newConfig);
  }
}

export const configManager = new ConfigManager();

export const logger = configManager.getLogger();

export const apiConfig = configManager.getApiConfig();

export const storageConfig = configManager.getStorageConfig();
