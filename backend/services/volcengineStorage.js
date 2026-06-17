/**
 * 火山引擎对象存储服务
 * 使用TOS (Tinder Object Storage) SDK
 */

const { TosClient } = require('@volcengine/tos-sdk');
const { Readable } = require('stream');

class VolcengineStorage {
  constructor(config = {}) {
    // 火山引擎对象存储配置（从环境变量读取）
    this.accessKeyId = config.accessKeyId || process.env.VOLC_ACCESS_KEY_ID;
    this.secretAccessKey = config.secretAccessKey || process.env.VOLC_SECRET_ACCESS_KEY;
    this.region = config.region || process.env.VOLC_REGION || 'cn-beijing';
    this.endpoint = config.endpoint || process.env.VOLC_ENDPOINT || 'tos-cn-beijing.volces.com';
    this.bucket = config.bucket || process.env.VOLC_BUCKET;

    // 验证配置
    if (!this.accessKeyId || !this.secretAccessKey || !this.bucket) {
      throw new Error('火山引擎对象存储配置不完整，请设置VOLC_ACCESS_KEY_ID、VOLC_SECRET_ACCESS_KEY和VOLC_BUCKET环境变量');
    }

    this.client = new TosClient({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.secretAccessKey,
      region: this.region,
      endpoint: this.endpoint,
    });

    console.log('=== 火山引擎对象存储配置 ===');
    console.log('Region:', this.region);
    console.log('Endpoint:', this.endpoint);
    console.log('Bucket:', this.bucket);
  }

  /**
   * 初始化存储桶
   */
  async initBucket() {
    try {
      // 尝试上传一个小文件来验证Bucket是否可用（headBucket有问题，但putObject正常）
      console.log(`检查存储桶 ${this.bucket}...`);
      const testKey = 'init-test-' + Date.now() + '.txt';
      try {
        await this.client.putObject({
          bucket: this.bucket,
          key: testKey,
          body: Buffer.from('test'),
        });
        // 删除测试文件
        await this.client.deleteObject({
          bucket: this.bucket,
          key: testKey,
        });
        console.log(`✅ 存储桶 ${this.bucket} 可用`);
        return true;
      } catch (err) {
        console.error(`❌ 存储桶 ${this.bucket} 不可用: ${err.message}`);
        console.error(`❌ 请检查Bucket名称、AccessKey和网络连接`);
        throw new Error(`存储桶不可用: ${err.message}`);
      }
    } catch (error) {
      console.error('❌ 初始化存储桶失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取对象的公共URL
   * @param {string} key - 对象键
   */
  getObjectUrl(key) {
    return `https://${this.bucket}.${this.endpoint}/${key}`;
  }

  /**
   * 上传文件
   * @param {string} key - 对象键
   * @param {Buffer|Stream|string} data - 文件数据
   * @param {object} options - 上传选项
   */
  async putObject(key, data, options = {}) {
    try {
      const params = {
        bucket: this.bucket,
        key,
        body: data,
      };

      if (options.contentType) {
        params.contentType = options.contentType;
      }

      if (options.contentLength) {
        params.contentLength = options.contentLength;
      }

      if (options.acl) {
        params.acl = options.acl;
      }

      const result = await this.client.putObject(params);
      console.log(`✅ 文件上传成功: ${key}`);
      return {
        success: true,
        etag: result.etag,
        key,
        url: this.getObjectUrl(key),
      };
    } catch (error) {
      console.error(`❌ 文件上传失败: ${key}`, error);
      throw new Error(`文件上传失败: ${error.message}`);
    }
  }

  /**
   * 上传分片
   * @param {string} key - 对象键
   * @param {number} partNumber - 分片编号（1-based）
   * @param {string} uploadId - 初始化返回的上传ID
   * @param {Buffer|Stream} data - 分片数据
   */
  async uploadPart(key, partNumber, uploadId, data) {
    try {
      const result = await this.client.uploadPart({
        bucket: this.bucket,
        key,
        uploadId,
        partNumber,
        body: data,
      });
      
      console.log(`[存储] uploadPart 返回结果:`, JSON.stringify(result));
      
      const etag = result.data?.etag || result.etag || result.headers?.etag || result.headers?.['etag'];
      
      return {
        etag: etag ? etag.replace(/"/g, '') : null,
        partNumber,
      };
    } catch (error) {
      console.error(`❌ 分片上传失败:`, error);
      throw new Error(`分片上传失败: ${error.message}`);
    }
  }

  /**
   * 初始化分片上传
   */
  async initiateMultipartUpload(key, options = {}) {
    try {
      const result = await this.client.createMultipartUpload({
        bucket: this.bucket,
        key,
        contentType: options.contentType,
      });
      console.log('[存储] createMultipartUpload 返回类型:', typeof result);
      console.log('[存储] createMultipartUpload 返回键:', Object.keys(result));
      console.log('[存储] createMultipartUpload 返回值:', JSON.stringify(result, null, 2));
      
      const uploadId = result.uploadId || result.UploadId || result.data?.uploadId || result.data?.UploadId;
      console.log('[存储] 提取的 uploadId:', uploadId);
      
      return {
        uploadId: uploadId,
        key,
      };
    } catch (error) {
      console.error('❌ 初始化分片上传失败:', error);
      throw new Error(`初始化分片上传失败: ${error.message}`);
    }
  }

  /**
   * 合并分片
   */
  async completeMultipartUpload(key, uploadId, parts) {
    try {
      const result = await this.client.completeMultipartUpload({
        bucket: this.bucket,
        key,
        uploadId,
        parts: parts.map(p => ({
          partNumber: p.partNumber,
          etag: p.etag,
        })),
      });
      return {
        success: true,
        etag: result.etag,
        key,
        url: this.getObjectUrl(key),
      };
    } catch (error) {
      console.error('❌ 合并分片失败:', error);
      throw new Error(`合并分片失败: ${error.message}`);
    }
  }

  /**
   * 取消分片上传
   */
  async abortMultipartUpload(key, uploadId) {
    try {
      await this.client.abortMultipartUpload({
        bucket: this.bucket,
        key,
        uploadId,
      });
      return { success: true };
    } catch (error) {
      console.error('❌ 取消分片上传失败:', error);
      throw new Error(`取消分片上传失败: ${error.message}`);
    }
  }

  /**
   * 获取文件流
   */
  async getObjectStream(key, range = null) {
    try {
      const params = {
        bucket: this.bucket,
        key,
      };

      if (range) {
        params.range = `bytes=${range.start}-${range.end}`;
      }

      const result = await this.client.getObject(params);
      
      // 根据SDK响应结构，数据在data中
      const { Readable } = require('stream');
      const stream = Readable.from([result.data]);
      
      return {
        stream,
        contentLength: result.data.length,
        contentRange: result.headers?.contentRange || null,
        contentType: result.headers?.contentType || 'application/octet-stream',
        etag: result.headers?.etag || '',
        lastModified: result.headers?.lastModified || new Date(),
      };
    } catch (error) {
      console.error(`❌ 获取文件失败: ${key}`, error);
      throw new Error(`获取文件失败: ${error.message}`);
    }
  }

  /**
   * 获取文件信息
   */
  async getObjectInfo(key) {
    try {
      // 使用getObject获取文件信息（headObject可能有问题）
      const result = await this.client.getObject({
        bucket: this.bucket,
        key,
      });
      
      return {
        contentLength: result.data.length,
        contentType: result.headers?.contentType || 'application/octet-stream',
        etag: result.headers?.etag || '',
        lastModified: result.headers?.lastModified || new Date(),
        storageClass: 'STANDARD',
      };
    } catch (error) {
      if (error.code === 'NoSuchKey' || error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 删除文件
   */
  async deleteObject(key) {
    try {
      await this.client.deleteObject({
        bucket: this.bucket,
        key,
      });
      console.log(`✅ 文件删除成功: ${key}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ 文件删除失败: ${key}`, error);
      throw new Error(`文件删除失败: ${error.message}`);
    }
  }

  /**
   * 批量删除文件
   */
  async deleteObjects(keys) {
    try {
      const result = await this.client.deleteMultiObjects({
        bucket: this.bucket,
        objects: keys.map(key => ({ key })),
      });
      return result;
    } catch (error) {
      console.error('❌ 批量删除失败:', error);
      throw new Error(`批量删除失败: ${error.message}`);
    }
  }

  /**
   * 生成预签名URL
   * @param {object} options - 选项
   * @param {string} options.key - 对象键
   * @param {string} options.operation - 操作类型: put, get, uploadPart
   * @param {string} [options.contentType] - 内容类型（用于put操作）
   * @param {number} [options.expiresIn] - 过期时间（秒）
   * @param {string} [options.uploadId] - 分片上传ID（用于uploadPart）
   * @param {number} [options.partNumber] - 分片编号（用于uploadPart）
   */
  async getPresignedUrl(options) {
    try {
      const { key, operation, contentType, expiresIn = 3600, uploadId, partNumber } = options;
      
      let method = 'GET';
      let params = {
        bucket: this.bucket,
        key,
        expires: expiresIn,
      };
      
      console.log(`[存储] 生成预签名URL - operation: ${operation}, key: ${key}, uploadId: ${uploadId}, partNumber: ${partNumber}`);
      
      switch (operation) {
        case 'put':
          method = 'PUT';
          if (contentType) {
            params.contentType = contentType;
          }
          break;
        case 'uploadPart':
          method = 'PUT';
          // 火山引擎TOS SDK要求 uploadId 和 partNumber 通过 query 参数传递
          params.query = {
            uploadId: String(uploadId),
            partNumber: String(partNumber),
          };
          params.contentType = 'application/octet-stream';
          console.log(`[存储] 分片上传参数 - uploadId: ${uploadId}, partNumber: ${partNumber}, contentType: application/octet-stream`);
          break;
        case 'get':
        default:
          method = 'GET';
          break;
      }
      
      console.log(`[存储] 调用 getPreSignedUrl - method: ${method}, params:`, JSON.stringify(params));
      
      // 火山引擎TOS SDK生成预签名URL（同步函数，返回string）
      const url = this.client.getPreSignedUrl({
        method,
        ...params,
      });
      
      console.log(`[存储] 预签名URL生成成功 - ${url.substring(0, 150)}...`);
      console.log(`[存储] 完整URL:`, url);
      
      // 分片上传：检查SDK是否正确生成了包含uploadId和partNumber的URL
      // 如果SDK没有正确生成，说明参数名可能不对，需要检查SDK文档
      let finalUrl = url;
      if (operation === 'uploadPart' && uploadId && partNumber) {
        // 检查URL是否已经包含这些参数
        const hasUploadId = url.includes('uploadId=') || url.includes('upload-id=') || url.includes('UploadId=');
        const hasPartNumber = url.includes('partNumber=') || url.includes('part-number=') || url.includes('PartNumber=');
        
        if (!hasUploadId || !hasPartNumber) {
          console.error(`[存储] ❌ SDK未正确生成包含uploadId和partNumber的预签名URL`);
          console.error(`[存储] ❌ hasUploadId: ${hasUploadId}, hasPartNumber: ${hasPartNumber}`);
          // 由于SDK生成的URL不包含必要参数，我们需要使用后端代理方式
          // 返回一个标记，让前端知道需要使用代理上传
          throw new Error('SDK生成的预签名URL不包含必要参数，请使用后端代理上传');
        }
      }
      
      // 验证URL是否包含必要的参数
      if (operation === 'uploadPart') {
        if (!finalUrl.includes('uploadId=')) {
          console.error(`[存储] ❌ 分片上传URL缺少uploadId参数`);
        }
        if (!finalUrl.includes('partNumber=')) {
          console.error(`[存储] ❌ 分片上传URL缺少partNumber参数`);
        }
      }
      
      return finalUrl;
    } catch (error) {
      console.error(`❌ 生成预签名URL失败: ${options.key}`, error);
      throw new Error(`生成预签名URL失败: ${error.message}`);
    }
  }

  /**
   * 初始化分片上传
   */
  async initMultipartUpload(key) {
    try {
      const result = await this.client.createMultipartUpload({
        bucket: this.bucket,
        key,
      });
      
      return result.uploadId;
    } catch (error) {
      console.error(`❌ 初始化分片上传失败: ${key}`, error);
      throw new Error(`初始化分片上传失败: ${error.message}`);
    }
  }

  /**
   * 完成分片上传
   */
  async completeMultipartUpload(key, uploadId, parts) {
    try {
      console.log(`[存储] completeMultipartUpload - key: ${key}, uploadId: ${uploadId}, parts:`, JSON.stringify(parts));
      
      const result = await this.client.completeMultipartUpload({
        bucket: this.bucket,
        key,
        uploadId,
        parts: parts.map(p => ({
          partNumber: p.partNumber,
          eTag: p.etag.startsWith('"') ? p.etag : `"${p.etag}"`,
        })),
      });
      
      console.log(`[存储] completeMultipartUpload 返回结果:`, JSON.stringify(result));
      
      const data = result.data || result;
      
      return {
        etag: data.etag || data.ETag,
        location: data.location || data.Location,
      };
    } catch (error) {
      console.error(`❌ 完成分片上传失败: ${key}`, error);
      throw new Error(`完成分片上传失败: ${error.message}`);
    }
  }

  /**
   * 取消分片上传
   */
  async abortMultipartUpload(key, uploadId) {
    try {
      await this.client.abortMultipartUpload({
        bucket: this.bucket,
        key,
        uploadId,
      });
      
      return { success: true };
    } catch (error) {
      console.error(`❌ 取消分片上传失败: ${key}`, error);
      throw new Error(`取消分片上传失败: ${error.message}`);
    }
  }
}

// 单例
let instance = null;

function getStorageService() {
  if (!instance) {
    instance = new VolcengineStorage();
  }
  return instance;
}

module.exports = {
  VolcengineStorage,
  getStorageService,
};
