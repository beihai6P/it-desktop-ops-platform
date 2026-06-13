const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');

// 存储根目录
const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(process.cwd(), 'storage');
const TOOLS_DIR = path.join(STORAGE_ROOT, 'tools');
const TEMP_DIR = path.join(STORAGE_ROOT, 'temp');
const CHUNKS_DIR = path.join(STORAGE_ROOT, 'chunks');

// 允许的文件类型
const ALLOWED_EXTENSIONS = {
  tool: ['.exe', '.msi', '.zip', '.rar', '.7z', '.tar', '.gz', '.deb', '.rpm', '.dmg', '.pkg', '.apk', '.ipa'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
  video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
  other: ['.json', '.xml', '.yaml', '.yml', '.csv', '.log']
};

// MIME类型映射
const MIME_TYPES = {
  '.exe': 'application/octet-stream',
  '.msi': 'application/x-msi',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.deb': 'application/vnd.debian.binary-package',
  '.rpm': 'application/x-rpm',
  '.dmg': 'application/x-apple-diskimage',
  '.pkg': 'application/octet-stream',
  '.apk': 'application/vnd.android.package-archive',
  '.ipa': 'application/octet-stream',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.mkv': 'video/x-matroska',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.yaml': 'application/x-yaml',
  '.yml': 'application/x-yaml',
  '.csv': 'text/csv',
  '.log': 'text/plain'
};

// 文件大小限制（字节）
const FILE_SIZE_LIMITS = {
  tool: 500 * 1024 * 1024,      // 500MB
  document: 100 * 1024 * 1024,  // 100MB
  image: 50 * 1024 * 1024,      // 50MB
  video: 1024 * 1024 * 1024,    // 1GB
  other: 50 * 1024 * 1024       // 50MB
};

// 分片大小（5MB）
const CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * 初始化存储目录
 */
async function initStorage() {
  const dirs = [STORAGE_ROOT, TOOLS_DIR, TEMP_DIR, CHUNKS_DIR];
  
  for (const dir of dirs) {
    try {
      await fs.promises.mkdir(dir, { recursive: true });
      console.log(`存储目录已初始化: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

/**
 * 获取文件的MIME类型
 * @param {string} filename - 文件名
 * @returns {string} MIME类型
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 扩展名（小写，带点）
 */
function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

/**
 * 验证文件类型
 * @param {string} filename - 文件名
 * @param {string} category - 文件分类
 * @returns {boolean} 是否有效
 */
function validateFileType(filename, category = 'tool') {
  const ext = getExtension(filename);
  const allowedExts = ALLOWED_EXTENSIONS[category] || ALLOWED_EXTENSIONS.other;
  return allowedExts.includes(ext);
}

/**
 * 获取文件大小限制
 * @param {string} category - 文件分类
 * @returns {number} 大小限制（字节）
 */
function getFileSizeLimit(category = 'tool') {
  return FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.other;
}

/**
 * 计算文件MD5哈希
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} MD5哈希值
 */
async function calculateMD5(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * 计算文件SHA256哈希
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} SHA256哈希值
 */
async function calculateSHA256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * 计算Buffer的MD5哈希
 * @param {Buffer} buffer - 数据Buffer
 * @returns {string} MD5哈希值
 */
function calculateBufferMD5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * 计算Buffer的SHA256哈希
 * @param {Buffer} buffer - 数据Buffer
 * @returns {string} SHA256哈希值
 */
function calculateBufferSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * 获取文件大小
 * @param {string} filePath - 文件路径
 * @returns {Promise<number>} 文件大小（字节）
 */
async function getFileSize(filePath) {
  const stats = await fs.promises.stat(filePath);
  return stats.size;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * 生成存储路径
 * @param {string} category - 文件分类
 * @param {string} storageName - 存储文件名
 * @returns {string} 存储路径
 */
function getStoragePath(category, storageName) {
  const categoryDir = category === 'tool' ? TOOLS_DIR : path.join(STORAGE_ROOT, category);
  return path.join(categoryDir, storageName);
}

/**
 * 保存文件到存储
 * @param {Buffer|Stream} fileData - 文件数据
 * @param {string} storagePath - 存储路径
 * @returns {Promise<void>}
 */
async function saveFile(fileData, storagePath) {
  // 确保目录存在
  const dir = path.dirname(storagePath);
  await fs.promises.mkdir(dir, { recursive: true });
  
  if (Buffer.isBuffer(fileData)) {
    await fs.promises.writeFile(storagePath, fileData);
  } else {
    // 流式写入
    const writeStream = fs.createWriteStream(storagePath);
    await pipeline(fileData, writeStream);
  }
}

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * 移动文件
 * @param {string} source - 源路径
 * @param {string} destination - 目标路径
 * @returns {Promise<void>}
 */
async function moveFile(source, destination) {
  const dir = path.dirname(destination);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.rename(source, destination);
}

/**
 * 复制文件
 * @param {string} source - 源路径
 * @param {string} destination - 目标路径
 * @returns {Promise<void>}
 */
async function copyFile(source, destination) {
  const dir = path.dirname(destination);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.copyFile(source, destination);
}

/**
 * 创建读取流
 * @param {string} filePath - 文件路径
 * @param {Object} options - 选项
 * @returns {ReadStream}
 */
function createReadStream(filePath, options = {}) {
  return fs.createReadStream(filePath, options);
}

/**
 * 解析Range请求头
 * @param {string} rangeHeader - Range头值
 * @param {number} fileSize - 文件大小
 * @returns {Array<{start: number, end: number}>} 范围数组
 */
function parseRangeHeader(rangeHeader, fileSize) {
  if (!rangeHeader) {
    return null;
  }
  
  const ranges = [];
  const rangeParts = rangeHeader.replace(/bytes=/, '').split(',');
  
  for (const part of rangeParts) {
    const range = part.trim().split('-');
    
    let start, end;
    
    if (range[0] === '') {
      // 格式: -500 (最后500字节)
      end = fileSize - 1;
      start = Math.max(0, end - parseInt(range[1], 10) + 1);
    } else if (range[1] === '') {
      // 格式: 500- (从500字节到结束)
      start = parseInt(range[0], 10);
      end = fileSize - 1;
    } else {
      // 格式: 500-1000
      start = parseInt(range[0], 10);
      end = parseInt(range[1], 10);
    }
    
    // 验证范围
    if (start >= 0 && start < fileSize && end >= start && end < fileSize) {
      ranges.push({ start, end });
    }
  }
  
  return ranges.length > 0 ? ranges : null;
}

/**
 * 生成ETag
 * @param {string} hash - 文件哈希
 * @param {number} size - 文件大小
 * @param {Date} modifiedTime - 修改时间
 * @returns {string} ETag值
 */
function generateETag(hash, size, modifiedTime) {
  return `"${hash.substring(0, 16)}-${size}-${modifiedTime.getTime()}"`;
}

/**
 * 生成下载令牌
 * @param {string} fileId - 文件ID
 * @param {string} userId - 用户ID
 * @param {number} expiresIn - 过期时间（秒）
 * @returns {string} 下载令牌
 */
function generateDownloadToken(fileId, userId, expiresIn = 3600) {
  const payload = `${fileId}:${userId}:${Date.now()}`;
  const secret = process.env.JWT_SECRET || 'storage-secret-key';
  const hash = crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .substring(0, 32);
  
  const token = Buffer.from(JSON.stringify({
    f: fileId,
    u: userId,
    e: Date.now() + expiresIn * 1000,
    h: hash
  })).toString('base64url');
  
  return token;
}

/**
 * 验证下载令牌
 * @param {string} token - 下载令牌
 * @returns {Object|null} 解析后的数据或null
 */
function verifyDownloadToken(token) {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64url').toString());
    
    // 检查是否过期
    if (data.e < Date.now()) {
      return null;
    }
    
    // 验证签名
    const secret = process.env.JWT_SECRET || 'storage-secret-key';
    const payload = `${data.f}:${data.u}:${data.e - 3600000}`;
    const expectedHash = crypto.createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .substring(0, 32);
    
    if (data.h !== expectedHash) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * 生成签名URL
 * @param {string} fileId - 文件ID
 * @param {string} userId - 用户ID
 * @param {number} expiresIn - 过期时间（秒）
 * @returns {string} 签名URL参数
 */
function generateSignedUrl(fileId, userId, expiresIn = 3600) {
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  const secret = process.env.JWT_SECRET || 'storage-secret-key';
  const stringToSign = `${fileId}:${userId}:${expires}`;
  const signature = crypto.createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex');
  
  return `fileId=${fileId}&userId=${userId}&expires=${expires}&signature=${signature}`;
}

/**
 * 验证签名URL
 * @param {string} fileId - 文件ID
 * @param {string} userId - 用户ID
 * @param {number} expires - 过期时间戳
 * @param {string} signature - 签名
 * @returns {boolean} 是否有效
 */
function verifySignedUrl(fileId, userId, expires, signature) {
  // 检查是否过期
  if (expires < Math.floor(Date.now() / 1000)) {
    return false;
  }
  
  const secret = process.env.JWT_SECRET || 'storage-secret-key';
  const stringToSign = `${fileId}:${userId}:${expires}`;
  const expectedSignature = crypto.createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * 获取存储目录统计信息
 * @returns {Promise<Object>} 统计信息
 */
async function getStorageStats() {
  const stats = {
    totalSize: 0,
    totalFiles: 0,
    byCategory: {}
  };
  
  const categories = ['tools', 'documents', 'images', 'videos', 'others'];
  
  for (const category of categories) {
    const categoryPath = path.join(STORAGE_ROOT, category);
    
    try {
      await fs.promises.access(categoryPath);
      const files = await fs.promises.readdir(categoryPath);
      let categorySize = 0;
      
      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const fileStat = await fs.promises.stat(filePath);
        
        if (fileStat.isFile()) {
          categorySize += fileStat.size;
          stats.totalFiles++;
        }
      }
      
      stats.byCategory[category] = {
        size: categorySize,
        count: files.length
      };
      stats.totalSize += categorySize;
    } catch {
      stats.byCategory[category] = { size: 0, count: 0 };
    }
  }
  
  return stats;
}

/**
 * 清理临时文件
 * @param {number} maxAge - 最大年龄（毫秒）
 * @returns {Promise<number>} 清理的文件数
 */
async function cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) {
  let cleanedCount = 0;
  const now = Date.now();
  
  try {
    const files = await fs.promises.readdir(TEMP_DIR);
    
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stat = await fs.promises.stat(filePath);
      
      if (now - stat.mtimeMs > maxAge) {
        await deleteFile(filePath);
        cleanedCount++;
      }
    }
  } catch (error) {
    console.error('清理临时文件失败:', error);
  }
  
  return cleanedCount;
}

/**
 * 清理过期的分片
 * @param {number} maxAge - 最大年龄（毫秒）
 * @returns {Promise<number>} 清理的分片数
 */
async function cleanupChunks(maxAge = 24 * 60 * 60 * 1000) {
  let cleanedCount = 0;
  const now = Date.now();
  
  try {
    const uploadDirs = await fs.promises.readdir(CHUNKS_DIR);
    
    for (const uploadId of uploadDirs) {
      const uploadPath = path.join(CHUNKS_DIR, uploadId);
      const stat = await fs.promises.stat(uploadPath);
      
      if (now - stat.mtimeMs > maxAge) {
        await fs.promises.rm(uploadPath, { recursive: true, force: true });
        cleanedCount++;
      }
    }
  } catch (error) {
    console.error('清理分片失败:', error);
  }
  
  return cleanedCount;
}

/**
 * 合并分片文件
 * @param {string} uploadId - 上传ID
 * @param {number} totalChunks - 总分片数
 * @param {string} outputPath - 输出路径
 * @returns {Promise<void>}
 */
async function mergeChunks(uploadId, totalChunks, outputPath) {
  const uploadDir = path.join(CHUNKS_DIR, uploadId);
  const writeStream = fs.createWriteStream(outputPath);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(uploadDir, `chunk_${i}`);
    const chunkData = await fs.promises.readFile(chunkPath);
    
    await new Promise((resolve, reject) => {
      writeStream.write(chunkData, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
  
  await new Promise((resolve) => writeStream.end(resolve));
  
  // 清理分片
  await fs.promises.rm(uploadDir, { recursive: true, force: true });
}

/**
 * 保存分片
 * @param {string} uploadId - 上传ID
 * @param {number} chunkIndex - 分片索引
 * @param {Buffer} chunkData - 分片数据
 * @returns {Promise<string>} 分片路径
 */
async function saveChunk(uploadId, chunkIndex, chunkData) {
  const uploadDir = path.join(CHUNKS_DIR, uploadId);
  await fs.promises.mkdir(uploadDir, { recursive: true });
  
  const chunkPath = path.join(uploadDir, `chunk_${chunkIndex}`);
  await fs.promises.writeFile(chunkPath, chunkData);
  
  return chunkPath;
}

/**
 * 检查分片是否存在
 * @param {string} uploadId - 上传ID
 * @param {number} chunkIndex - 分片索引
 * @returns {Promise<boolean>}
 */
async function chunkExists(uploadId, chunkIndex) {
  const chunkPath = path.join(CHUNKS_DIR, uploadId, `chunk_${chunkIndex}`);
  return fileExists(chunkPath);
}

/**
 * 获取已上传的分片列表
 * @param {string} uploadId - 上传ID
 * @returns {Promise<number[]>} 已上传的分片索引列表
 */
async function getUploadedChunks(uploadId) {
  const uploadDir = path.join(CHUNKS_DIR, uploadId);
  
  try {
    const files = await fs.promises.readdir(uploadDir);
    return files
      .filter(f => f.startsWith('chunk_'))
      .map(f => parseInt(f.split('_')[1], 10))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

module.exports = {
  // 常量
  STORAGE_ROOT,
  TOOLS_DIR,
  TEMP_DIR,
  CHUNKS_DIR,
  CHUNK_SIZE,
  ALLOWED_EXTENSIONS,
  MIME_TYPES,
  FILE_SIZE_LIMITS,
  
  // 初始化
  initStorage,
  
  // 文件操作
  saveFile,
  deleteFile,
  moveFile,
  copyFile,
  fileExists,
  getFileSize,
  createReadStream,
  
  // 哈希计算
  calculateMD5,
  calculateSHA256,
  calculateBufferMD5,
  calculateBufferSHA256,
  
  // 文件信息
  getMimeType,
  getExtension,
  validateFileType,
  getFileSizeLimit,
  formatFileSize,
  getStoragePath,
  
  // Range处理
  parseRangeHeader,
  generateETag,
  
  // 令牌和签名
  generateDownloadToken,
  verifyDownloadToken,
  generateSignedUrl,
  verifySignedUrl,
  
  // 存储
  getStorageStats,
  cleanupTempFiles,
  cleanupChunks,
  
  // 分片上传
  saveChunk,
  chunkExists,
  getUploadedChunks,
  mergeChunks
};