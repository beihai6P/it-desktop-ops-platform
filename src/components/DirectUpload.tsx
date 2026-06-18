import { useState, useRef } from 'react';
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
import { storageScheduler } from '@/scheduler';

interface FileItem {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'duplicate';
  progress: number;
  fileId?: string;
  error?: string;
  existingFile?: {
    fileId: string;
    originalName: string;
    size: number;
    uploadedAt: string;
  };
}

const DirectUpload = ({ onUploadComplete, category = 'archive', accessLevel = 'private', multiple = true }: {
  onUploadComplete?: (fileId: string, fileName: string, url?: string) => void;
  category?: string;
  accessLevel?: string;
  multiple?: boolean;
}) => {
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedDuplicateItem, setSelectedDuplicateItem] = useState<FileItem | null>(null);
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newItems: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newItems.push({
        uid: Date.now().toString() + '-' + i,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
      });
    }

    setFileList(prev => [...prev, ...newItems]);
    event.target.value = '';
  };

  const uploadFile = async (fileItem: FileItem, file: File) => {
    try {
      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'uploading', progress: 0 } : item
      ));

      const result = await storageScheduler.uploadFile(
        file,
        category,
        accessLevel,
        (progress) => {
          setFileList(prev => prev.map(item =>
            item.uid === fileItem.uid ? { ...item, progress } : item
          ));
        }
      );

      const resultData = result as unknown as Record<string, unknown>;

      if (resultData.duplicate && resultData.existingFile) {
        setFileList(prev => prev.map(item =>
          item.uid === fileItem.uid ? {
            ...item,
            status: 'duplicate',
            existingFile: resultData.existingFile as FileItem['existingFile']
          } : item
        ));
        return;
      }

      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'done', progress: 100, fileId: resultData.fileId as string } : item
      ));

      if (onUploadComplete) {
        onUploadComplete(resultData.fileId as string, file.name, resultData.downloadUrl as string | undefined);
      }

    } catch (error) {
      console.error('上传失败:', error);
      setFileList(prev => prev.map(item =>
        item.uid === fileItem.uid ? { ...item, status: 'error', error: (error as Error).message } : item
      ));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (!files) return;

    const newItems: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newItems.push({
        uid: Date.now().toString() + '-' + i,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
      });
    }

    setFileList(prev => [...prev, ...newItems]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUploadAll = async () => {
    const pendingItems = fileList.filter(item => item.status === 'pending' || item.status === 'error');
    
    for (const item of pendingItems) {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.accept = item.type || '';
      document.body.appendChild(input);
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          await uploadFile(item, file);
        }
        document.body.removeChild(input);
      };
      
      input.click();
    }
  };

  const handleUploadSingle = async (uid: string) => {
    const item = fileList.find(f => f.uid === uid);
    if (!item || item.status !== 'pending') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        await uploadFile(item, file);
      }
      document.body.removeChild(input);
    };

    input.click();
  };

  const handleRemove = (uid: string) => {
    setFileList(prev => prev.filter(item => item.uid !== uid));
  };

  const handleRetry = async (uid: string) => {
    const item = fileList.find(f => f.uid === uid);
    if (!item) return;

    setFileList(prev => prev.map(i =>
      i.uid === uid ? { ...i, status: 'pending', progress: 0, error: undefined } : i
    ));
  };

  const handleConfirmDuplicate = (item: FileItem) => {
    if (!item.existingFile) return;

    setFileList(prev => prev.map(i =>
      i.uid === item.uid ? { ...i, status: 'done', progress: 100, fileId: item.existingFile!.fileId } : i
    ));

    if (onUploadComplete && item.existingFile) {
      onUploadComplete(item.existingFile.fileId, item.name);
    }

    setShowDuplicateModal(false);
    setSelectedDuplicateItem(null);
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setSelectedDuplicateItem(null);
  };

  const pendingCount = fileList.filter(f => f.status === 'pending').length;
  const uploadingCount = fileList.filter(f => f.status === 'uploading').length;

  return (
    <div className="w-full">
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-blue-400"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          className="hidden"
          onChange={handleFileSelect}
          accept={category === 'image' ? 'image/*' : category === 'video' ? 'video/*' : undefined}
        />
        <CloudUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {fileList.length > 0 ? '以下是你已选择的文件' : '拖拽文件到此处或点击上传'}
        </p>
        <p className="text-sm text-gray-500">
          支持 JPG, PNG, PDF, DOC, ZIP 等格式
        </p>
      </div>

      {fileList.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">共 {fileList.length} 个文件</span>
            {pendingCount > 0 && (
              <button
                onClick={handleUploadAll}
                disabled={uploadingCount > 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {uploadingCount > 0 ? '上传中...' : '全部上传'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {fileList.map(item => (
              <div
                key={item.uid}
                className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100">
                  {item.status === 'done' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : item.status === 'error' ? (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  ) : item.status === 'duplicate' ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  ) : item.status === 'uploading' ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  ) : (
                    getFileIcon(item.type)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">{getFileSizeText(item.size)}</p>
                  {item.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">{item.progress}%</span>
                    </div>
                  )}
                  {item.error && (
                    <p className="text-sm text-red-500 mt-1">{item.error}</p>
                  )}
                  {item.status === 'duplicate' && item.existingFile && (
                    <p className="text-sm text-yellow-600 mt-1">
                      已存在相同文件: {item.existingFile.originalName} ({getFileSizeText(item.existingFile.size)})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUploadSingle(item.uid)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        title="上传"
                      >
                        <UploadIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.uid)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                  {item.status === 'uploading' && (
                    <Clock className="w-5 h-5 text-blue-500" />
                  )}
                  {item.status === 'done' && (
                    <button
                      onClick={() => handleRemove(item.uid)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title="删除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {item.status === 'error' && (
                    <>
                      <button
                        onClick={() => handleRetry(item.uid)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        title="重试"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.uid)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                  {item.status === 'duplicate' && (
                    <>
                      <button
                        onClick={() => { setSelectedDuplicateItem(item); setShowDuplicateModal(true); }}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        使用已有文件
                      </button>
                      <button
                        onClick={() => handleRemove(item.uid)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDuplicateModal && selectedDuplicateItem && selectedDuplicateItem.existingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认使用已有文件</h3>
            <p className="text-gray-600 mb-4">
              检测到相同文件已存在于服务器上：
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium">{selectedDuplicateItem.existingFile.originalName}</p>
              <p className="text-sm text-gray-500">
                大小: {getFileSizeText(selectedDuplicateItem.existingFile.size)}
              </p>
              <p className="text-sm text-gray-500">
                上传时间: {selectedDuplicateItem.existingFile.uploadedAt}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDuplicate}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmDuplicate(selectedDuplicateItem)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                确认使用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectUpload;
