export * from './types';
export * from './config';
export * from './api';
export * from './storage';

import { configManager, logger } from './config';
import { apiScheduler } from './api';
import { storageScheduler } from './storage';

class Scheduler {
  private static instance: Scheduler;

  private constructor() {}

  static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
      logger.info('Scheduler initialized', {
        apiBaseUrl: configManager.getApiConfig().baseUrl,
      });
    }
    return Scheduler.instance;
  }

  get config() {
    return configManager.getConfig();
  }

  get api() {
    return apiScheduler;
  }

  get storage() {
    return storageScheduler;
  }

  get log() {
    return logger;
  }
}

export const scheduler = Scheduler.getInstance();

export default Scheduler;
