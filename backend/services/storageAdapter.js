/**
 * 统一存储适配器 - 强制使用火山引擎对象存储
 */

const { getStorageService } = require('./volcengineStorage');

class StorageAdapter {
  constructor() {
    this.type = 'volcengine';
    this.volcengineStorage = getStorageService();
    console.log('[存储适配器] 强制使用火山引擎对象存储');
  }

  async init() {
    console.log('[存储适配器] 初始化火山引擎对象存储...');
    await this.volcengineStorage.initBucket();
    console.log('[存储适配器] ✅ 火山引擎对象存储初始化成功');
  }

  getType() {
    return this.type;
  }

  async putObject(key, data, options = {}) {
    return await this.volcengineStorage.putObject(key, data, options);
  }

  async initMultipartUpload(key, options = {}) {
    return await this.volcengineStorage.initiateMultipartUpload(key, options);
  }

  async uploadPart(key, partNumber, uploadId, data) {
    return await this.volcengineStorage.uploadPart(key, partNumber, uploadId, data);
  }

  async completeMultipartUpload(key, uploadId, parts) {
    return await this.volcengineStorage.completeMultipartUpload(key, uploadId, parts);
  }

  async abortMultipartUpload(key, uploadId) {
    return await this.volcengineStorage.abortMultipartUpload(key, uploadId);
  }

  async getObjectStream(key, range = null) {
    return await this.volcengineStorage.getObjectStream(key, range);
  }

  async getObjectInfo(key) {
    return await this.volcengineStorage.getObjectInfo(key);
  }

  async deleteObject(key) {
    return await this.volcengineStorage.deleteObject(key);
  }

  getObjectUrl(key, expiresIn = 3600) {
    return this.volcengineStorage.getSignedUrl(key, expiresIn);
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
