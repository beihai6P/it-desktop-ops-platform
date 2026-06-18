import type { UploadFile, PresignedResult, UploadSession, DownloadOptions } from './types';
import { configManager, logger } from './config';
import { apiPost, apiGet, apiDelete } from './api';

class StorageScheduler {
  private chunkSize: number;
  private minMultipartSize: number;
  private uploadSessions: Map<string, UploadSession>;

  constructor() {
    const storageConfig = configManager.getStorageConfig();
    this.chunkSize = storageConfig.chunkSize;
    this.minMultipartSize = storageConfig.minMultipartSize;
    this.uploadSessions = new Map();
  }

  private calculateSHA256 = async (file: File): Promise<string | null> => {
    try {
      const cryptoObj = window.crypto || (window as unknown as { msCrypto?: Crypto }).msCrypto;
      const fileSize = file.size;

      if (fileSize > 10 * 1024 * 1024) {
        logger.info('Skipping client-side SHA256 calculation for large file (MB)');
        return null;
      }

      const arrayBuffer = await file.arrayBuffer();
      const digest = await cryptoObj.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(digest));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      logger.error('SHA256 calculation failed:', error);
      return null;
    }
  };

  private validateFile = (file: File, category: string): { valid: boolean; message: string } => {
    const storageConfig = configManager.getStorageConfig();
    const maxSize = storageConfig.maxFileSize[category as keyof typeof storageConfig.maxFileSize] || storageConfig.maxFileSize.archive;

    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const categoryTypes = storageConfig.allowedTypes[category as keyof typeof storageConfig.allowedTypes] || [];

    if (!categoryTypes.includes(file.type) && !this.getAllowedExtensions(category).includes(ext)) {
      return { valid: false, message: '不支持的文件类型' };
    }

    if (file.size > maxSize) {
      return { valid: false, message: '文件大小超过限制' };
    }

    return { valid: true, message: '' };
  };

  private getAllowedExtensions = (category: string): string[] => {
    const extensionMap: Record<string, string[]> = {
      image: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'],
      video: ['.mp4', '.mov', '.avi', '.webm'],
      archive: ['.zip', '.rar', '.7z'],
      document: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.txt', '.log', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.html', '.htm', '.json', '.zip', '.rar', '.7z'],
    };
    return extensionMap[category] || [];
  };

  private getFileSizeText = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  private createUploadFile = (file: File): UploadFile => ({
    uid: Date.now().toString() + Math.random(),
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'pending',
    progress: 0,
  });

  async getPresignedUrl(file: File, category: string, accessLevel: string, sha256?: string): Promise<PresignedResult> {
    logger.debug('Getting presigned URL', { filename: file.name, category, accessLevel });

    const response = await apiPost('/presigned/upload-url', {
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      category,
      accessLevel,
      sha256,
    });

    return response.data as PresignedResult;
  }

  async initMultipartUpload(file: File, category: string, accessLevel: string, sha256?: string): Promise<PresignedResult> {
    logger.debug('Initializing multipart upload', { filename: file.name, category, accessLevel });

    const parts = Math.max(2, Math.ceil(file.size / this.chunkSize));

    const response = await apiPost('/presigned/multipart/init', {
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      parts,
      category,
      accessLevel,
      sha256,
    });

    const result = response.data as PresignedResult;

    if (result.success && result.fileId && result.uploadId && result.partUrls) {
      const session: UploadSession = {
        uploadId: result.uploadId,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        category,
        accessLevel,
        chunkSize: this.chunkSize,
        totalChunks: result.partUrls.length,
        uploadedChunks: [],
        sha256,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
      this.uploadSessions.set(result.fileId, session);
    }

    return result;
  }

  async uploadChunk(file: File, fileId: string, partNumber: number, presignedUrl: string): Promise<{ etag: string; success: boolean }> {
    logger.debug('Uploading chunk', { fileId, partNumber });

    const session = this.uploadSessions.get(fileId);
    if (!session) {
      return { etag: '', success: false };
    }

    const start = (partNumber - 1) * session.chunkSize;
    const end = Math.min(start + session.chunkSize, session.fileSize);
    const chunk = file.slice(start, end);

    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: chunk,
      headers: {
        'Content-Type': '',
      },
    });

    if (!response.ok) {
      logger.error('Chunk upload failed', { partNumber, status: response.status });
      return { etag: '', success: false };
    }

    const etag = (response.headers.get('etag') || '').replace(/"/g, '');
    session.uploadedChunks.push(partNumber);

    return { etag, success: true };
  }

  async completeMultipartUpload(fileId: string, uploadId: string, parts: Array<{ partNumber: number; etag: string }>): Promise<PresignedResult> {
    logger.debug('Completing multipart upload', { fileId, uploadId, partsCount: parts.length });

    const response = await apiPost('/presigned/multipart/complete', {
      fileId,
      uploadId,
      partData: parts.map(p => ({ PartNumber: p.partNumber, ETag: p.etag })),
      hash: { sha256: '', md5: '' },
    });

    this.uploadSessions.delete(fileId);

    return response.data as PresignedResult;
  }

  async abortMultipartUpload(fileId: string): Promise<{ success: boolean; message: string }> {
    logger.debug('Aborting multipart upload', { fileId });

    const response = await apiDelete('/presigned/multipart/' + fileId);
    this.uploadSessions.delete(fileId);

    return { success: response.success, message: response.data?.message || '' };
  }

  async confirmUpload(fileId: string, etag: string, sha256?: string): Promise<PresignedResult> {
    logger.debug('Confirming upload', { fileId });

    const response = await apiPost('/presigned/confirm-upload', {
      fileId,
      etag,
      hash: { sha256, md5: '' },
    });

    return response.data as PresignedResult;
  }

  async uploadFileDirectly(file: File, category: string, accessLevel: string): Promise<UploadFile> {
    const uploadFile = this.createUploadFile(file);
    
    try {
      uploadFile.status = 'hashing';
      const sha256 = await this.calculateSHA256(file);
      uploadFile.sha256 = sha256;

      uploadFile.status = 'checking';
      const presignedResult = await this.getPresignedUrl(file, category, accessLevel, sha256);

      if (!presignedResult.success) {
        if (presignedResult.duplicate && presignedResult.existingFile) {
          uploadFile.status = 'duplicate';
          uploadFile.existingFile = presignedResult.existingFile;
        } else {
          uploadFile.status = 'error';
          uploadFile.error = presignedResult.message || '获取上传URL失败';
        }
        return uploadFile;
      }

      const { fileId, presignedUrl } = presignedResult;
      uploadFile.fileId = fileId;
      uploadFile.presignedUrl = presignedUrl;
      uploadFile.status = 'uploading';

      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const etag = response.headers.get('ETag');
      await this.confirmUpload(fileId!, etag!, sha256);

      uploadFile.status = 'done';
      uploadFile.progress = 100;

    } catch (error) {
      uploadFile.status = 'error';
      uploadFile.error = (error as Error).message;
      logger.error('Direct upload failed:', error);
    }

    return uploadFile;
  }

  async uploadLargeFile(file: File, category: string, accessLevel: string, onProgress?: (progress: number) => void): Promise<UploadFile> {
    const uploadFile = this.createUploadFile(file);
    
    try {
      uploadFile.status = 'hashing';
      const sha256 = await this.calculateSHA256(file);
      uploadFile.sha256 = sha256;

      uploadFile.status = 'uploading';
      const initResult = await this.initMultipartUpload(file, category, accessLevel, sha256);

      if (!initResult.success) {
        if (initResult.duplicate && initResult.existingFile) {
          uploadFile.status = 'duplicate';
          uploadFile.existingFile = initResult.existingFile;
        } else {
          uploadFile.status = 'error';
          uploadFile.error = initResult.message || '初始化分片上传失败';
        }
        return uploadFile;
      }

      const { fileId, uploadId, partUrls } = initResult;
      uploadFile.fileId = fileId;

      if (!fileId || !uploadId || !partUrls) {
        throw new Error('初始化分片上传失败：缺少必要参数');
      }

      const uploadedParts: Array<{ partNumber: number; etag: string }> = [];

      for (let i = 0; i < partUrls.length; i++) {
        const partItem = partUrls[i];
        const result = await this.uploadChunk(file, fileId, partItem.partNumber, partItem.url);

        if (!result.success) {
          throw new Error('分片上传失败');
        }

        uploadedParts.push({ partNumber: partItem.partNumber, etag: result.etag });

        const progress = Math.round(((i + 1) / partUrls.length) * 100);
        uploadFile.progress = progress;
        onProgress?.(progress);
      }

      await this.completeMultipartUpload(fileId, uploadId, uploadedParts);

      uploadFile.status = 'done';
      uploadFile.progress = 100;
      onProgress?.(100);

    } catch (error) {
      uploadFile.status = 'error';
      uploadFile.error = (error as Error).message;
      logger.error('Large file upload failed:', error);
    }

    return uploadFile;
  }

  async uploadFile(file: File, category: string, accessLevel: string, onProgress?: (progress: number) => void): Promise<UploadFile> {
    const validation = this.validateFile(file, category);
    if (!validation.valid) {
      return {
        ...this.createUploadFile(file),
        status: 'error',
        error: validation.message,
      };
    }

    if (file.size >= this.minMultipartSize * 2) {
      return this.uploadLargeFile(file, category, accessLevel, onProgress);
    } else {
      return this.uploadFileDirectly(file, category, accessLevel);
    }
  }

  async downloadFile(options: DownloadOptions): Promise<Blob | null> {
    logger.debug('Downloading file', { fileId: options.fileId });

    const { range, onProgress } = options;
    const headers: Record<string, string> = {};

    if (range) {
      headers['Range'] = 'bytes=' + range.start + '-' + range.end;
    }

    try {
      const response = await fetch('/api/presigned/download-url/', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        logger.error('Download failed', { status: response.status });
        return null;
      }

      const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
      const reader = response.body?.getReader();
      if (!reader) {
        logger.error('Failed to get response body reader');
        return null;
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (onProgress && contentLength > 0) {
          onProgress(Math.round((receivedLength / contentLength) * 100));
        }
      }

      return new Blob(chunks);
    } catch (error) {
      logger.error('Download error:', error);
      return null;
    }
  }

  async getFileInfo(fileId: string): Promise<{ success: boolean; data?: unknown; message?: string }> {
    const response = await apiGet('/storage/info/' + fileId);
    return response;
  }

  async listFiles(params?: { category?: string; accessLevel?: string; page?: number; limit?: number }): Promise<{ success: boolean; data?: unknown; message?: string }> {
    const response = await apiGet('/storage/files', params);
    return response;
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiDelete('/storage/files/' + fileId);
    return response;
  }

  getUploadSession(fileId: string): UploadSession | undefined {
    return this.uploadSessions.get(fileId);
  }

  cleanupExpiredSessions(): void {
    const now = new Date();
    this.uploadSessions.forEach((session, fileId) => {
      if (session.expiresAt < now) {
        this.uploadSessions.delete(fileId);
        logger.info('Cleaned up expired upload session', { fileId });
      }
    });
  }
}

export const storageScheduler = new StorageScheduler();

export const uploadFile = storageScheduler.uploadFile.bind(storageScheduler);
export const downloadFile = storageScheduler.downloadFile.bind(storageScheduler);
export const getFileInfo = storageScheduler.getFileInfo.bind(storageScheduler);
export const listFiles = storageScheduler.listFiles.bind(storageScheduler);
export const deleteFile = storageScheduler.deleteFile.bind(storageScheduler);
export const getPresignedUrl = storageScheduler.getPresignedUrl.bind(storageScheduler);
export const initMultipartUpload = storageScheduler.initMultipartUpload.bind(storageScheduler);
export const uploadChunk = storageScheduler.uploadChunk.bind(storageScheduler);
export const completeMultipartUpload = storageScheduler.completeMultipartUpload.bind(storageScheduler);
export const abortMultipartUpload = storageScheduler.abortMultipartUpload.bind(storageScheduler);
