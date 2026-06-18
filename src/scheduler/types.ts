export interface SchedulerConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryCount: number;
    retryDelay: number;
  };
  storage: {
    chunkSize: number;
    minMultipartSize: number;
    maxFileSize: {
      image: number;
      video: number;
      archive: number;
      document: number;
    };
    allowedTypes: {
      image: string[];
      video: string[];
      archive: string[];
      document: string[];
    };
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: Record<string, unknown>;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
  responseType?: 'json' | 'blob' | 'text';
  withCredentials?: boolean;
}

export interface UploadFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'hashing' | 'checking' | 'uploading' | 'done' | 'error' | 'duplicate';
  progress: number;
  fileId?: string;
  presignedUrl?: string;
  error?: string;
  sha256?: string;
  existingFile?: {
    fileId: string;
    originalName: string;
    size: number;
    uploadedAt: string;
  };
}

export interface PresignedResult {
  success: boolean;
  fileId?: string;
  presignedUrl?: string;
  duplicate?: boolean;
  existingFile?: {
    fileId: string;
    originalName: string;
    size: number;
    uploadedAt: string;
  };
  message?: string;
  uploadId?: string;
  partUrls?: Array<{ partNumber: number; url: string }>;
}

export interface UploadSession {
  uploadId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  category: string;
  accessLevel: string;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  sha256?: string;
  expiresAt: Date;
}

export interface DownloadOptions {
  fileId: string;
  range?: { start: number; end: number };
  onProgress?: (progress: number) => void;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, { count: number; size: number }>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}
