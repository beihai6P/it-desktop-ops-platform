import { useState, useCallback, useRef } from 'react';
import {
  Upload as UploadIcon,
  CheckCircle,
  FileText,
  Image,
  Video,
  Clock,
  Loader2,
  CloudUpload,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface FileItem {
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

const CHUNK_SIZE = 5 * 1024 * 1024;

const DirectUpload = ({ onUploadComplete, category = 'archive', accessLevel = 'private' }: {
  onUploadComplete?: (fileId: string, fileName: string) => void;
  category?: string;
  accessLevel?: string;
}) => {
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [duplicateModal, setDuplicateModal] = useState<{
    visible: boolean;
    item?: FileItem;
  }>({ visible: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  const getFileSizeText = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const calculateSHA256 = async (file: File): Promise<string | null> => {
    try {
      const crypto = window.crypto || (window as any).msCrypto;
      
      const maxHashSize = 50 * 1024 * 1024;
      
      if (file.size > maxHashSize) {
        return null;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(digest));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('计算SHA256失败:', error);
      return null;
    }
  };

  const validateFile = (file: File) => {
    const allowedExtensions: Record<string, string[]> = {
      image: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      video: ['.mp4', '.mov'],
      archive: ['.zip', '.rar', '.7z'],
    };

    const allowedTypes: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/pjpeg', 'image/x-png'],
      video: ['video/mp4', 'video/quicktime', 'video/mpeg', 'video/x-msvideo'],
      archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 
                'application/octet-stream', 'application/x-zip-compressed'],
    };

    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const categoryExtensions = allowedExtensions[category] || [];
    const categoryTypes = allowedTypes[category] || [];

    if (!categoryExtensions.includes(ext) && !categoryTypes.includes(file.type)) {
      return { valid: false, message: `不支持的文件类型，仅支持: ${categoryExtensions.join(', ')}` };
    }

    const sizeLimits: Record<string, number> = {
      image: 20 * 1024 * 1024,
      video: 200 * 1024 * 1024,
      archive: 2 * 1024 * 1024 * 1024,
    };

    const maxSize = sizeLimits[category] || 2 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, message: `文件大小超过限制（最大${getFileSizeText(maxSize)}）` };
    }

    return { valid: true, message: '' };
  };

interface PresignedResult {
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
}

  const getPresignedUrl = async (file: File, sha256: string | null): Promise<PresignedResult> => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/presigned/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        category,
        accessLevel,
        sha256,
      }),
    });

    const data = await response.json();
    return data;
  };

  const uploadFileDirectly = async (fileItem: FileItem, file: File, sha256: string | null) => {
    try {
      const result = await getPresignedUrl(file, sha256);
      
      if (!result.success && result.duplicate) {
        setFileList(prev => prev.map(item =>
          item.uid === fileItem.uid ? { 
            ...item, 
            status: 'duplicate', 
            existingFile: result.existingFile 
          } : item
        ));
        return;
      }

      const { fileId, presignedUrl } = result;

      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'uploading', fileId, presignedUrl, progress: 0 } : item
      ));

      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const etag = response.headers.get('ETag');

      const token = localStorage.getItem('token');
      const confirmResponse = await fetch('/api/presigned/confirm-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileId,
          etag,
          hash: { sha256, md5: '' },
        }),
      });

      const confirmData = await confirmResponse.json();
      if (!confirmData.success) {
        throw new Error(confirmData.message || '确认上传失败');
      }

      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'done', progress: 100 } : item
      ));

      if (onUploadComplete) {
        onUploadComplete(fileId, file.name);
      }

    } catch (error) {
      console.error('上传失败:', error);
      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'error', error: (error as Error).message } : item
      ));
    }
  };

  const uploadLargeFile = async (fileItem: FileItem, file: File, sha256: string | null) => {
    try {
      const token = localStorage.getItem('token');
      const parts = Math.ceil(file.size / CHUNK_SIZE);

      const initResponse = await fetch('/api/presigned/multipart/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          parts,
          category,
          accessLevel,
          sha256,
        }),
      });

      const initData = await initResponse.json();
      
      if (!initData.success && initData.duplicate) {
        setFileList(prev => prev.map(item =>
          item.uid === fileItem.uid ? { 
            ...item, 
            status: 'duplicate', 
            existingFile: initData.existingFile 
          } : item
        ));
        return;
      }

      const { fileId, uploadId, partUrls } = initData;

      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'uploading', fileId, progress: 0 } : item
      ));

      const partResults = [];
      let uploadedBytes = 0;

      for (let i = 0; i < parts; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const partUrl = partUrls[i];
        const response = await fetch(partUrl, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!response.ok) {
          throw new Error(`分片${i + 1}上传失败`);
        }

        const etag = response.headers.get('ETag');
        partResults.push({
          partNumber: i + 1,
          etag: etag?.replace(/"/g, '') || '',
        });

        uploadedBytes += chunk.size;
        const progress = Math.round((uploadedBytes / file.size) * 100);

        setFileList(prev => prev.map(item =>
          item.uid === fileItem.uid ? { ...item, progress } : item
        ));
      }

      const completeResponse = await fetch('/api/presigned/multipart/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileId,
          uploadId,
          parts: partResults,
          hash: { sha256, md5: '' },
        }),
      });

      const completeData = await completeResponse.json();
      if (!completeData.success) {
        throw new Error(completeData.message || '完成分片上传失败');
      }

      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'done', progress: 100 } : item
      ));

      if (onUploadComplete) {
        onUploadComplete(fileId, file.name);
      }

    } catch (error) {
      console.error('分片上传失败:', error);
      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'error', error: (error as Error).message } : item
      ));
    }
  };

  const handleFilesSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const validation = validateFile(file);
      if (!validation.valid) {
        const newItem: FileItem = {
          uid: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          progress: 0,
          error: validation.message,
        };
        setFileList(prev => [...prev, newItem]);
        continue;
      }

      const newItem: FileItem = {
        uid: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'hashing',
        progress: 0,
      };

      setFileList(prev => [...prev, newItem]);

      try {
        const sha256 = await calculateSHA256(file);

        if (file.size > CHUNK_SIZE) {
          setFileList(prev => prev.map(item =>
            item.uid === newItem.uid ? { ...item, sha256, status: 'uploading', progress: 0 } : item
          ));
          await uploadLargeFile(newItem, file, sha256);
        } else {
          if (sha256) {
            setFileList(prev => prev.map(item =>
              item.uid === newItem.uid ? { ...item, sha256, status: 'checking' } : item
            ));
          } else {
            setFileList(prev => prev.map(item =>
              item.uid === newItem.uid ? { ...item, sha256: null, status: 'uploading', progress: 0 } : item
            ));
          }
          await uploadFileDirectly(newItem, file, sha256);
        }
      } catch (error) {
        console.error('上传流程失败:', error);
        setFileList(prev => prev.map(item =>
          item.uid === newItem.uid ? { ...item, status: 'error', error: (error as Error).message } : item
        ));
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [category, accessLevel, onUploadComplete]);

  const handleRemove = useCallback((uid: string) => {
    setFileList(prev => prev.filter(item => item.uid !== uid));
  }, []);

  const handleRetry = useCallback((uid: string) => {
    const item = fileList.find(i => i.uid === uid);
    if (item) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = category === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' :
                     category === 'video' ? 'video/mp4,video/quicktime' :
                     '.zip,.rar,.7z';
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files[0]) {
          const newItem: FileItem = {
            uid: Date.now().toString() + Math.random(),
            name: files[0].name,
            size: files[0].size,
            type: files[0].type,
            status: 'hashing',
            progress: 0,
          };
          setFileList(prev => prev.map(i => i.uid === uid ? newItem : i));
          handleFilesSelected({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
        }
      };
      input.click();
    }
  }, [fileList, category, handleFilesSelected]);

  const handleDuplicateConfirm = useCallback((item: FileItem) => {
    if (onUploadComplete && item.existingFile) {
      onUploadComplete(item.existingFile.fileId, item.existingFile.originalName);
    }
    handleRemove(item.uid);
    setDuplicateModal({ visible: false });
  }, [onUploadComplete, handleRemove]);

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'hashing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'checking':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'uploading':
        return <CloudUpload className="w-5 h-5 text-green-500" />;
      case 'done':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'duplicate':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return '等待上传';
      case 'hashing':
        return '计算文件指纹...';
      case 'checking':
        return '检查重复文件...';
      case 'uploading':
        return '上传中';
      case 'done':
        return '上传完成';
      case 'error':
        return '上传失败';
      case 'duplicate':
        return '文件已存在';
      default:
        return '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="direct-upload">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={category === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' :
                 category === 'video' ? 'video/mp4,video/quicktime' :
                 '.zip,.rar,.7z'}
        onChange={handleFilesSelected}
        className="hidden"
      />

      <button className="upload-btn" onClick={handleButtonClick}>
        <UploadIcon className="w-5 h-5" />
        选择文件
      </button>

      <div className="upload-list">
        {fileList.map(item => (
          <div key={item.uid} className={`upload-item ${item.status}`}>
            <div className="file-info">
              <span className="file-icon">{getFileIcon(item.type)}</span>
              <div className="file-details">
                <span className="file-name">{item.name}</span>
                <span className="file-size">{getFileSizeText(item.size)}</span>
              </div>
            </div>

            <div className="status-section">
              {getStatusIcon(item.status)}
              <span className="status-text">{getStatusText(item.status)}</span>
            </div>

            {item.status === 'uploading' && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                </div>
                <span className="progress-text">{item.progress}%</span>
              </div>
            )}

            {item.status === 'hashing' && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div className="progress-fill indeterminate"></div>
                </div>
                <span className="progress-text">处理中...</span>
              </div>
            )}

            {item.status === 'error' && (
              <div className="error-details">
                <span className="error-text">{item.error}</span>
                <button onClick={() => handleRetry(item.uid)} className="retry-btn">
                  重试
                </button>
              </div>
            )}

            {item.status === 'duplicate' && (
              <div className="duplicate-actions">
                <button onClick={() => setDuplicateModal({ visible: true, item })} className="use-existing-btn">
                  使用已存在文件
                </button>
                <button onClick={() => handleRemove(item.uid)} className="cancel-btn">
                  取消
                </button>
              </div>
            )}

            {(item.status === 'done' || item.status === 'pending') && (
              <button onClick={() => handleRemove(item.uid)} className="remove-btn">
                移除
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={`modal-overlay ${duplicateModal.visible ? 'visible' : ''}`}>
        <div className="modal-content">
          <h3 className="modal-title">文件已存在</h3>
          {duplicateModal.item && (
            <div className="duplicate-modal-content">
              <p>检测到相同的文件已存在于服务器：</p>
              <div className="file-info-card">
                <FileText className="icon" />
                <div className="info">
                  <span className="name">{duplicateModal.item.existingFile?.originalName}</span>
                  <span className="size">{getFileSizeText(duplicateModal.item.existingFile?.size || 0)}</span>
                  <span className="upload-time">上传时间：{new Date(duplicateModal.item.existingFile?.uploadedAt).toLocaleString()}</span>
                </div>
              </div>
              <p className="tip">是否直接使用已存在的文件，无需重新上传？</p>
            </div>
          )}
          <div className="modal-footer">
            <button onClick={() => setDuplicateModal({ visible: false })} className="modal-btn cancel">
              取消
            </button>
            <button onClick={() => duplicateModal.item && handleDuplicateConfirm(duplicateModal.item)} className="modal-btn confirm">
              确认使用已存在文件
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .direct-upload {
          width: 100%;
        }

        .upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #1890ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .upload-btn:hover {
          background: #40a9ff;
        }

        .upload-list {
          margin-top: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .upload-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          margin-bottom: 12px;
          background: #fafafa;
          transition: all 0.3s;
        }

        .upload-item:hover {
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .file-icon {
          font-size: 24px;
          color: #1890ff;
          flex-shrink: 0;
        }

        .file-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .file-name {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #333;
        }

        .file-size {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }

        .status-section {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 100px;
          justify-content: center;
        }

        .status-text {
          font-size: 12px;
          color: #666;
        }

        .upload-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 180px;
          flex-shrink: 0;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: #e8e8e8;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #52c41a;
          transition: width 0.3s;
        }

        .progress-fill.indeterminate {
          width: 100%;
          animation: progress-indeterminate 1.5s infinite;
        }

        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-text {
          font-size: 12px;
          color: #666;
          min-width: 35px;
          text-align: right;
        }

        .error-details {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ff4d4f;
        }

        .error-text {
          font-size: 12px;
          color: #ff4d4f;
        }

        .retry-btn {
          background: none;
          border: 1px solid #ff4d4f;
          color: #ff4d4f;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .retry-btn:hover {
          background: #fff2f0;
        }

        .duplicate-actions {
          display: flex;
          gap: 8px;
        }

        .use-existing-btn {
          background: #52c41a;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .use-existing-btn:hover {
          background: #73d13d;
        }

        .cancel-btn {
          background: none;
          border: 1px solid #d9d9d9;
          color: #666;
          padding: 6px 16px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .cancel-btn:hover {
          background: #f5f5f5;
        }

        .remove-btn {
          background: none;
          border: 1px solid #d9d9d9;
          color: #666;
          padding: 6px 16px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .remove-btn:hover {
          background: #f5f5f5;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
        }

        .modal-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
        }

        .duplicate-modal-content {
          padding: 8px 0;
        }

        .file-info-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f6ffed;
          border-radius: 8px;
          margin: 12px 0;
        }

        .file-info-card .icon {
          font-size: 32px;
          color: #52c41a;
        }

        .file-info-card .info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .file-info-card .name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .file-info-card .size {
          font-size: 12px;
          color: #999;
        }

        .file-info-card .upload-time {
          font-size: 12px;
          color: #999;
        }

        .tip {
          margin-top: 12px;
          font-size: 13px;
          color: #666;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-btn {
          padding: 8px 20px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          border: none;
        }

        .modal-btn.cancel {
          background: #f5f5f5;
          color: #666;
        }

        .modal-btn.cancel:hover {
          background: #e8e8e8;
        }

        .modal-btn.confirm {
          background: #1890ff;
          color: white;
        }

        .modal-btn.confirm:hover {
          background: #40a9ff;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DirectUpload;