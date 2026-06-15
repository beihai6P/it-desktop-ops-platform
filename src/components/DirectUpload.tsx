/**
 * 前端直传火山引擎对象存储组件
 * 使用预签名URL直接上传，不经过后端中转
 */

import { useState, useCallback } from 'react';
import { Upload, Progress } from 'antd';
import { UploadOutlined, CheckCircleOutlined, AlertCircleOutlined, FileZip, FileImage, FileVideo } from '@ant-design/icons';

interface FileItem {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  fileId?: string;
  presignedUrl?: string;
  error?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

const DirectUpload = ({ onUploadComplete, category = 'archive', accessLevel = 'private' }: {
  onUploadComplete?: (fileId: string, fileName: string) => void;
  category?: string;
  accessLevel?: string;
}) => {
  const [fileList, setFileList] = useState<FileItem[]>([]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage />;
    if (type.startsWith('video/')) return <FileVideo />;
    return <FileZip />;
  };

  const getFileSizeText = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const validateFile = (file: File) => {
    const allowedTypes: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      video: ['video/mp4', 'video/quicktime'],
      archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    };

    const categoryTypes = allowedTypes[category] || [];
    if (!categoryTypes.includes(file.type)) {
      return { valid: false, message: `不支持的文件类型，仅支持: ${categoryTypes.join(', ')}` };
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

  const getPresignedUrl = async (file: File): Promise<{ fileId: string; presignedUrl: string }> => {
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
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || '获取预签名URL失败');
    }

    return {
      fileId: data.fileId,
      presignedUrl: data.presignedUrl,
    };
  };

  const uploadFileDirectly = async (fileItem: FileItem, file: File) => {
    try {
      // 获取预签名URL
      const { fileId, presignedUrl } = await getPresignedUrl(file);

      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'uploading', fileId, presignedUrl } : item
      ));

      // 直接上传到火山引擎
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

      // 获取ETag
      const etag = response.headers.get('ETag');

      // 确认上传完成
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

  const uploadLargeFile = async (fileItem: FileItem, file: File) => {
    try {
      const token = localStorage.getItem('token');
      const parts = Math.ceil(file.size / CHUNK_SIZE);

      // 初始化分片上传
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
        }),
      });

      const initData = await initResponse.json();
      if (!initData.success) {
        throw new Error(initData.message || '初始化分片上传失败');
      }

      const { fileId, uploadId, partUrls } = initData;

      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'uploading', fileId } : item
      ));

      // 上传所有分片
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

      // 完成分片上传
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

  const handleUpload = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      const newItem: FileItem = {
        uid: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'error',
        progress: 0,
        error: validation.message,
      };
      setFileList(prev => [...prev, newItem]);
      return false;
    }

    const newItem: FileItem = {
      uid: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
    };

    setFileList(prev => [...prev, newItem]);

    // 根据文件大小选择上传方式
    if (file.size > CHUNK_SIZE) {
      await uploadLargeFile(newItem, file);
    } else {
      await uploadFileDirectly(newItem, file);
    }

    return false; // 阻止默认上传行为
  }, [category, accessLevel, onUploadComplete]);

  const handleRemove = useCallback((uid: string) => {
    setFileList(prev => prev.filter(item => item.uid !== uid));
  }, []);

  const handleClearError = useCallback((uid: string) => {
    setFileList(prev => prev.filter(item => item.uid !== uid));
  }, []);

  return (
    <div className="direct-upload">
      <Upload
        beforeUpload={handleUpload}
        fileList={[]}
        customRequest={() => {}}
        accept={category === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' :
                 category === 'video' ? 'video/mp4,video/quicktime' :
                 '.zip,.rar,.7z'}
      >
        <button className="upload-btn">
          <UploadOutlined />
          选择文件
        </button>
      </Upload>

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

            {item.status === 'uploading' && (
              <div className="upload-progress">
                <Progress
                  percent={item.progress}
                  showInfo={false}
                  strokeWidth={4}
                />
                <span className="progress-text">{item.progress}%</span>
              </div>
            )}

            {item.status === 'done' && (
              <div className="upload-status done">
                <CheckCircleOutlined />
                <span>上传成功</span>
              </div>
            )}

            {item.status === 'error' && (
              <div className="upload-status error">
                <AlertCircleOutlined />
                <span>{item.error}</span>
                <button onClick={() => handleClearError(item.uid)}>移除</button>
              </div>
            )}

            {item.status === 'pending' && (
              <div className="upload-status pending">
                <span>准备上传...</span>
              </div>
            )}

            {(item.status === 'pending' || item.status === 'done') && (
              <button onClick={() => handleRemove(item.uid)} className="remove-btn">
                移除
              </button>
            )}
          </div>
        ))}
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
        }

        .upload-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          margin-bottom: 8px;
          background: #fafafa;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .file-icon {
          font-size: 20px;
          color: #1890ff;
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
        }

        .file-size {
          font-size: 12px;
          color: #999;
        }

        .upload-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 150px;
        }

        .progress-text {
          font-size: 12px;
          color: #666;
          min-width: 35px;
        }

        .upload-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }

        .upload-status.done {
          color: #52c41a;
        }

        .upload-status.error {
          color: #ff4d4f;
          gap: 8px;
        }

        .upload-status.error button {
          background: none;
          border: 1px solid #ff4d4f;
          color: #ff4d4f;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .upload-status.pending {
          color: #1890ff;
        }

        .remove-btn {
          background: none;
          border: 1px solid #d9d9d9;
          color: #666;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .remove-btn:hover {
          background: #f5f5f5;
        }
      `}</style>
    </div>
  );
};

export default DirectUpload;