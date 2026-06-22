/**
 * 统一存储适配器 - 支持火山引擎对象存储和本地存储
 */

const { getStorageService: getVolcengineStorage } = require('./volcengineStorage');
const { getLocalStorageService } = require('./localStorage');

class StorageAdapter {
  constructor() {
    this.type = process.env.STORAGE_TYPE || 'local';
    
    if (this.type === 'volcengine') {
      try {
        this.storage = getVolcengineStorage();
        console.log('[存储适配器] 使用火山引擎对象存储');
      } catch (error) {
        console.warn(`[存储适配器] 火山引擎存储初始化失败: ${error.message}`);
        console.warn('[存储适配器] 回退到本地存储');
        this.type = 'local';
        this.storage = getLocalStorageService();
      }
    } else {
      this.storage = getLocalStorageService();
      console.log('[存储适配器] 使用本地文件存储');
    }
  }

  async init() {
    console.log(`[存储适配器] 初始化${this.type === 'volcengine' ? '火山引擎' : '本地'}存储...`);
    if (this.type === 'volcengine') {
      try {
        await this.storage.initBucket();
        console.log(`[存储适配器] ✅ 火山引擎存储初始化成功`);
      } catch (error) {
        console.warn(`[存储适配器] ⚠️ 火山引擎存储初始化失败: ${error.message}`);
        console.warn(`[存储适配器] ⚠️ 回退到本地存储`);
        this.type = 'local';
        this.storage = getLocalStorageService();
        await this.storage.init();
        console.log(`[存储适配器] ✅ 本地存储初始化成功`);
      }
    } else {
      await this.storage.init();
      console.log(`[存储适配器] ✅ 本地存储初始化成功`);
    }
  }

  getType() {
    return this.type;
  }

  async putObject(key, data, options = {}) {
    return await this.storage.putObject(key, data, options);
  }

  async initMultipartUpload(key, options = {}) {
    return await this.storage.initiateMultipartUpload ? this.storage.initiateMultipartUpload(key, options) : this.storage.initMultipartUpload(key, options);
  }

  async uploadPart(key, partNumber, uploadId, data) {
    return await this.storage.uploadPart(key, partNumber, uploadId, data);
  }

  async completeMultipartUpload(key, uploadId, parts) {
    return await this.storage.completeMultipartUpload(key, uploadId, parts);
  }

  async abortMultipartUpload(key, uploadId) {
    return await this.storage.abortMultipartUpload(key, uploadId);
  }

  async getObjectStream(key, range = null) {
    return await this.storage.getObjectStream(key, range);
  }

  async getObjectInfo(key) {
    return await this.storage.getObjectInfo(key);
  }

  async deleteObject(key) {
    return await this.storage.deleteObject(key);
  }

  getObjectUrl(key, expiresIn = 3600) {
    return this.storage.getObjectUrl ? this.storage.getObjectUrl(key, expiresIn) : this.storage.getSignedUrl(key, expiresIn);
  }

  /**
   * 生成预签名URL（支持各种操作类型）
   * @param {object} options - 选项
   * @param {string} options.key - 对象键
   * @param {string} options.operation - 操作类型: put, get, uploadPart
   * @param {string} [options.contentType] - 内容类型（用于put操作）
   * @param {number} [options.expiresIn] - 过期时间（秒）
   * @param {string} [options.uploadId] - 分片上传ID（用于uploadPart）
   * @param {number} [options.partNumber] - 分片编号（用于uploadPart）
   */
  async getPresignedUrl(options) {
    return await this.storage.getPresignedUrl(options);
  }

  async objectExists(key) {
    const info = await this.getObjectInfo(key);
    return info !== null;
  }
}

let instance = null;

function getStorageAdapter() {
  if (!instance) {
    instance = new StorageAdapter();
  }
  return instance;
}

module.exports = {
  StorageAdapter,
  getStorageAdapter,
};
