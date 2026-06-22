/**
 * 本地文件存储服务
 * 作为火山引擎存储的备选方案
 */

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

class LocalStorage {
  constructor(config = {}) {
    this.storageRoot = config.storageRoot || process.env.STORAGE_ROOT || './storage';
    this.type = 'local';
    
    if (!fs.existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
    }
    
    console.log('=== 本地文件存储配置 ===');
    console.log('Storage Root:', this.storageRoot);
  }

  async init() {
    console.log('[存储适配器] 初始化本地文件存储...');
    if (!fs.existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
    }
    console.log('[存储适配器] ✅ 本地文件存储初始化成功');
    return true;
  }

  getType() {
    return this.type;
  }

  getObjectPath(key) {
    const safeKey = key.replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');
    return path.join(this.storageRoot, safeKey);
  }

  async putObject(key, data, options = {}) {
    try {
      const filePath = this.getObjectPath(key);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      if (Buffer.isBuffer(data)) {
        fs.writeFileSync(filePath, data);
      } else if (typeof data === 'string') {
        fs.writeFileSync(filePath, data, 'utf8');
      } else if (data instanceof Readable) {
        const writeStream = fs.createWriteStream(filePath);
        await new Promise((resolve, reject) => {
          data.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      } else {
        throw new Error('不支持的数据类型');
      }
      
      console.log(`✅ 文件上传成功: ${key}`);
      
      return {
        success: true,
        etag: this.generateEtag(filePath),
        key,
        url: `/api/storage/download/${encodeURIComponent(key)}`,
      };
    } catch (error) {
      console.error(`❌ 文件上传失败: ${key}`, error);
      throw new Error(`文件上传失败: ${error.message}`);
    }
  }

  generateEtag(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const mtime = stats.mtime.getTime().toString();
      const size = stats.size.toString();
      return `"${size}-${mtime}"`;
    } catch {
      return `"${Date.now()}"`;
    }
  }

  async initMultipartUpload(key, options = {}) {
    const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[存储] 初始化分片上传 - key: ${key}, uploadId: ${uploadId}`);
    
    return {
      uploadId,
      key,
    };
  }

  async uploadPart(key, partNumber, uploadId, data) {
    try {
      const partDir = path.join(this.storageRoot, '.multipart', uploadId);
      if (!fs.existsSync(partDir)) {
        fs.mkdirSync(partDir, { recursive: true });
      }
      
      const partPath = path.join(partDir, `part-${partNumber}`);
      
      if (Buffer.isBuffer(data)) {
        fs.writeFileSync(partPath, data);
      } else if (data instanceof Readable) {
        const writeStream = fs.createWriteStream(partPath);
        await new Promise((resolve, reject) => {
          data.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      }
      
      const stats = fs.statSync(partPath);
      const etag = `"${stats.size}-${stats.mtime.getTime()}"`;
      
      return {
        etag: etag.replace(/"/g, ''),
        partNumber,
      };
    } catch (error) {
      console.error(`❌ 分片上传失败:`, error);
      throw new Error(`分片上传失败: ${error.message}`);
    }
  }

  async completeMultipartUpload(key, uploadId, parts) {
    try {
      console.log(`[存储] 合并分片 - key: ${key}, uploadId: ${uploadId}`);
      
      const partDir = path.join(this.storageRoot, '.multipart', uploadId);
      const filePath = this.getObjectPath(key);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const sortedParts = parts.sort((a, b) => a.partNumber - b.partNumber);
      
      const writeStream = fs.createWriteStream(filePath);
      
      for (const part of sortedParts) {
        const partPath = path.join(partDir, `part-${part.partNumber}`);
        if (fs.existsSync(partPath)) {
          const partData = fs.readFileSync(partPath);
          writeStream.write(partData);
        }
      }
      
      writeStream.close();
      
      fs.rmSync(partDir, { recursive: true, force: true });
      
      return {
        success: true,
        etag: this.generateEtag(filePath),
        key,
        url: `/api/storage/download/${encodeURIComponent(key)}`,
      };
    } catch (error) {
      console.error('❌ 合并分片失败:', error);
      throw new Error(`合并分片失败: ${error.message}`);
    }
  }

  async abortMultipartUpload(key, uploadId) {
    try {
      const partDir = path.join(this.storageRoot, '.multipart', uploadId);
      if (fs.existsSync(partDir)) {
        fs.rmSync(partDir, { recursive: true, force: true });
      }
      return { success: true };
    } catch (error) {
      console.error('❌ 取消分片上传失败:', error);
      throw new Error(`取消分片上传失败: ${error.message}`);
    }
  }

  async getObjectStream(key, range = null) {
    try {
      const filePath = this.getObjectPath(key);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在');
      }
      
      const stats = fs.statSync(filePath);
      const stream = fs.createReadStream(filePath);
      
      return {
        stream,
        contentLength: stats.size,
        contentRange: null,
        contentType: 'application/octet-stream',
        etag: this.generateEtag(filePath),
        lastModified: stats.mtime,
      };
    } catch (error) {
      console.error(`❌ 获取文件失败: ${key}`, error);
      throw new Error(`获取文件失败: ${error.message}`);
    }
  }

  async getObjectInfo(key) {
    try {
      const filePath = this.getObjectPath(key);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const stats = fs.statSync(filePath);
      
      return {
        contentLength: stats.size,
        contentType: 'application/octet-stream',
        etag: this.generateEtag(filePath),
        lastModified: stats.mtime,
        storageClass: 'STANDARD',
      };
    } catch (error) {
      if (error.message.includes('不存在')) {
        return null;
      }
      throw error;
    }
  }

  async deleteObject(key) {
    try {
      const filePath = this.getObjectPath(key);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ 文件删除成功: ${key}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error(`❌ 文件删除失败: ${key}`, error);
      throw new Error(`文件删除失败: ${error.message}`);
    }
  }

  getObjectUrl(key, expiresIn = 3600) {
    return `/api/storage/download/${encodeURIComponent(key)}`;
  }

  async getPresignedUrl(options) {
    const { key, operation, expiresIn = 3600 } = options;
    
    console.log(`[存储] 生成预签名URL - operation: ${operation}, key: ${key}`);
    
    if (operation === 'get') {
      return `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/storage/download/${encodeURIComponent(key)}`;
    }
    
    throw new Error('本地存储不支持预签名URL上传，请使用后端代理');
  }

  async objectExists(key) {
    const info = await this.getObjectInfo(key);
    return info !== null;
  }
}

let instance = null;

function getLocalStorageService() {
  if (!instance) {
    instance = new LocalStorage();
  }
  return instance;
}

module.exports = {
  LocalStorage,
  getLocalStorageService,
};
