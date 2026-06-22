import type { RequestOptions, ApiResponse } from './types';
import { configManager, logger } from './config';

class ApiScheduler {
  private baseUrl: string;
  private timeout: number;
  private retryCount: number;
  private retryDelay: number;

  constructor() {
    const apiConfig = configManager.getApiConfig();
    this.baseUrl = apiConfig.baseUrl;
    this.timeout = apiConfig.timeout;
    this.retryCount = apiConfig.retryCount;
    this.retryDelay = apiConfig.retryDelay;
  }

  private getAuthToken(): string | null {
    try {
      const token = localStorage.getItem('token');
      return token || null;
    } catch {
      return null;
    }
  }

  private async fetchWithRetry(options: RequestOptions, attempt: number = 1): Promise<Response> {
    const { method, url, data, params, headers = {}, timeout = this.timeout } = options;

    let fullUrl: URL | string;
    const requestUrl = url.startsWith('/') ? `${this.baseUrl}${url}` : url;

    if (requestUrl.startsWith('http://') || requestUrl.startsWith('https://')) {
      const urlObj = new URL(requestUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          urlObj.searchParams.set(key, String(value));
        });
      }
      fullUrl = urlObj;
    } else {
      fullUrl = requestUrl;
      if (params) {
        const paramObj: Record<string, string> = {};
        Object.entries(params).forEach(([key, value]) => {
          paramObj[key] = String(value);
        });
        const paramString = new URLSearchParams(paramObj).toString();
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + paramString;
      }
    }

    const token = this.getAuthToken();
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const mergedHeaders = { ...defaultHeaders, ...headers };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const responseUrl = typeof fullUrl === 'string' ? fullUrl : fullUrl.toString();
      const response = await fetch(responseUrl, {
        method,
        headers: mergedHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 500 && attempt < this.retryCount) {
        logger.warn(`Request failed with status ${response.status}, retrying (${attempt}/${this.retryCount})`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
        return this.fetchWithRetry(options, attempt + 1);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (attempt < this.retryCount) {
        logger.warn(`Request failed with error: ${(error as Error).message}, retrying (${attempt}/${this.retryCount})`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
        return this.fetchWithRetry(options, attempt + 1);
      }

      throw error;
    }
  }

  async request<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
    logger.debug('API request', { method: options.method, url: options.url });

    try {
      const response = await this.fetchWithRetry(options);
      const responseText = await response.text();

      let data: ApiResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          success: response.ok,
          message: responseText,
        } as ApiResponse<T>;
      }

      if (!response.ok) {
        logger.error('API request failed', {
          status: response.status,
          url: options.url,
          message: data.message || data.error,
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        return {
          success: false,
          error: data.error || data.message || `Request failed with status ${response.status}`,
          code: response.status,
        };
      }

      logger.debug('API request succeeded', { url: options.url });
      
      if (data.data === undefined) {
        return {
          success: true,
          ...data,
          data: data as unknown,
        } as ApiResponse<T>;
      }
      
      return data as ApiResponse<T>;
    } catch (error) {
      logger.error('API request error', { url: options.url, error: (error as Error).message });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async get<T = unknown>(url: string, params?: Record<string, string | number | boolean>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params, headers });
  }

  async post<T = unknown>(url: string, data?: Record<string, unknown>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  async put<T = unknown>(url: string, data?: Record<string, unknown>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers });
  }

  async delete<T = unknown>(url: string, params?: Record<string, string | number | boolean>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, params, headers });
  }

  async patch<T = unknown>(url: string, data?: Record<string, unknown>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, headers });
  }

  async upload<T = unknown>(url: string, formData: FormData, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    logger.debug('Upload request', { url });

    try {
      const token = this.getAuthToken();
      const defaultHeaders: Record<string, string> = {};

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const mergedHeaders = { ...defaultHeaders, ...headers };

      const fullUrl = url.startsWith('/') ? `${this.baseUrl}${url}` : url;
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: mergedHeaders,
        body: formData,
      });

      const responseText = await response.text();

      let data: ApiResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          success: response.ok,
          message: responseText,
        } as ApiResponse<T>;
      }

      if (!response.ok) {
        logger.error('Upload failed', {
          status: response.status,
          url,
          message: data.message || data.error,
        });
        return {
          success: false,
          error: data.error || data.message || `Upload failed with status ${response.status}`,
          code: response.status,
        };
      }

      logger.debug('Upload succeeded', { url });
      return data as ApiResponse<T>;
    } catch (error) {
      logger.error('Upload error', { url, error: (error as Error).message });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async download(url: string, params?: Record<string, string | number | boolean>, onProgress?: (progress: number) => void): Promise<Blob | null> {
    logger.debug('Download request', { url });

    try {
      const token = this.getAuthToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fullUrl = new URL(url.startsWith('/') ? `${this.baseUrl}${url}` : url);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          fullUrl.searchParams.set(key, String(value));
        });
      }

      const response = await fetch(fullUrl.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        logger.error('Download failed', {
          status: response.status,
          url,
        });
        return null;
      }

      const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
      const reader = response.body?.getReader();
      if (!reader) {
        logger.error('Failed to get response body reader');
        return null;
      }

      const chunks: BlobPart[] = [];
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

      const blob = new Blob(chunks);
      logger.debug('Download succeeded', { url, size: blob.size });
      return blob;
    } catch (error) {
      logger.error('Download error', { url, error: (error as Error).message });
      return null;
    }
  }

  async downloadPost(url: string, body?: unknown, onProgress?: (progress: number) => void): Promise<{ blob: Blob; filename: string } | null> {
    logger.debug('Download POST request', { url });

    try {
      const token = this.getAuthToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fullUrl = url.startsWith('/') ? `${this.baseUrl}${url}` : url;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });

      if (!response.ok) {
        logger.error('Download POST failed', {
          status: response.status,
          url,
        });
        return null;
      }

      const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      
      if (contentDisposition) {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]*)/);
        if (utf8Match) {
          filename = decodeURIComponent(utf8Match[1]);
        } else {
          const asciiMatch = contentDisposition.match(/filename="?([^";]*)"?/);
          if (asciiMatch) {
            filename = asciiMatch[1];
          }
        }
      }

      const reader = response.body?.getReader();
      if (!reader) {
        logger.error('Failed to get response body reader');
        return null;
      }

      const chunks: BlobPart[] = [];
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

      const blob = new Blob(chunks, { type: contentType });
      logger.debug('Download POST succeeded', { url, size: blob.size, filename });
      return { blob, filename };
    } catch (error) {
      logger.error('Download POST error', { url, error: (error as Error).message });
      return null;
    }
  }
}

export const apiScheduler = new ApiScheduler();

export const apiRequest = apiScheduler.request.bind(apiScheduler);
export const apiGet = apiScheduler.get.bind(apiScheduler);
export const apiPost = apiScheduler.post.bind(apiScheduler);
export const apiPut = apiScheduler.put.bind(apiScheduler);
export const apiDelete = apiScheduler.delete.bind(apiScheduler);
export const apiPatch = apiScheduler.patch.bind(apiScheduler);
export const apiUpload = apiScheduler.upload.bind(apiScheduler);
export const apiDownload = apiScheduler.download.bind(apiScheduler);
export const apiDownloadPost = apiScheduler.downloadPost.bind(apiScheduler);
