import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Send, Plus, Trash2, Monitor, Wifi, HardDrive, Printer, Cloud, Shield, FileText, Cpu, Save, BookOpen, ChevronRight, Image, XCircle } from 'lucide-react';
import type { Case, CaseCategory, CaseTemplate } from '@/types';
import DirectUpload from './DirectUpload';
import { apiUpload } from '@/scheduler';

interface CaseSubmitProps {
  onClose: () => void;
  onSubmit: (data: Case) => void;
}

const deviceTypes = [
  { id: 'desktop', name: '台式机', icon: Monitor },
  { id: 'laptop', name: '笔记本', icon: Wifi },
  { id: 'virtual', name: '虚拟桌面', icon: Cloud },
  { id: 'printer', name: '打印机', icon: Printer },
  { id: 'server', name: '服务器', icon: Cpu },
  { id: 'hardware', name: '其他硬件', icon: HardDrive },
];

const systemVersions = [
  { id: 'win7', name: 'Windows 7' },
  { id: 'win10', name: 'Windows 10' },
  { id: 'win11', name: 'Windows 11' },
  { id: 'macos', name: 'MacOS' },
  { id: 'server2019', name: 'Windows Server 2019' },
  { id: 'server2022', name: 'Windows Server 2022' },
  { id: 'virtual', name: '虚拟机' },
];

const categories: { id: CaseCategory; name: string; icon: React.ElementType }[] = [
  { id: 'system', name: '系统故障', icon: Monitor },
  { id: 'network', name: '网络问题', icon: Wifi },
  { id: 'hardware', name: '硬件外设', icon: HardDrive },
  { id: 'printer', name: '打印设备', icon: Printer },
  { id: 'software', name: '办公软件', icon: FileText },
  { id: 'virtual', name: '虚拟机虚拟化', icon: Cloud },
  { id: 'domain', name: '域认证企业环境', icon: Shield },
];

// 故障模板
const caseTemplates: CaseTemplate[] = [
  {
    id: 'template-blue',
    name: '蓝屏故障模板',
    description: '适用于Windows蓝屏故障的排查报告',
    category: 'system',
    symptoms: ['蓝屏错误', '系统崩溃', '重启循环'],
    steps: [
      { step: 1, title: '记录蓝屏信息', description: '记录蓝屏错误代码和停止码', commands: [], expectedResult: '' },
      { step: 2, title: '分析Dump文件', description: '使用WinDbg分析蓝屏dump文件', commands: ['!analyze -v'], expectedResult: '定位问题原因' },
      { step: 3, title: '排查驱动问题', description: '更新或回滚最近安装的驱动', commands: [], expectedResult: '驱动问题解决' },
      { step: 4, title: '检查硬件', description: '检查内存、硬盘等硬件是否正常', commands: ['memtest.exe'], expectedResult: '硬件检测通过' },
    ]
  },
  {
    id: 'template-printer',
    name: '打印机脱机模板',
    description: '适用于打印机脱机故障的排查报告',
    category: 'printer',
    symptoms: ['打印机脱机', '无法打印', '打印队列卡住'],
    steps: [
      { step: 1, title: '检查打印机状态', description: '确认打印机已开机并连接', commands: [], expectedResult: '打印机在线' },
      { step: 2, title: '重启打印服务', description: '重启Print Spooler服务', commands: ['net stop spooler', 'net start spooler'], expectedResult: '服务重启成功' },
      { step: 3, title: '清理打印队列', description: '清除卡住的打印任务', commands: ['del /q %SystemRoot%\\System32\\spool\\PRINTERS\\*.*'], expectedResult: '队列清空' },
      { step: 4, title: '重新安装驱动', description: '卸载并重新安装打印机驱动', commands: [], expectedResult: '驱动安装成功' },
    ]
  },
  {
    id: 'template-office',
    name: '办公软件崩溃模板',
    description: '适用于Office等办公软件崩溃故障',
    category: 'software',
    symptoms: ['Office崩溃', 'Word卡死', 'Excel无响应'],
    steps: [
      { step: 1, title: '清理Office缓存', description: '删除Office缓存文件夹', commands: ['rmdir /s /q %LOCALAPPDATA%\\Microsoft\\Office\\16.0\\Cache'], expectedResult: '缓存清理完成' },
      { step: 2, title: '禁用加载项', description: '进入安全模式禁用冲突加载项', commands: [], expectedResult: '加载项禁用成功' },
      { step: 3, title: '修复Office安装', description: '使用Office修复工具', commands: [], expectedResult: 'Office修复完成' },
      { step: 4, title: '更新Office', description: '安装最新Office更新', commands: [], expectedResult: 'Office更新完成' },
    ]
  },
  {
    id: 'template-network',
    name: '网络故障模板',
    description: '适用于网络连接问题的排查报告',
    category: 'network',
    symptoms: ['网络连接问题', 'DNS故障', '连接超时'],
    steps: [
      { step: 1, title: '检查物理连接', description: '检查网线、路由器状态', commands: [], expectedResult: '物理连接正常' },
      { step: 2, title: '刷新网络配置', description: '释放并重新获取IP地址', commands: ['ipconfig /release', 'ipconfig /renew'], expectedResult: 'IP获取成功' },
      { step: 3, title: '刷新DNS缓存', description: '清除本地DNS缓存', commands: ['ipconfig /flushdns'], expectedResult: 'DNS缓存刷新' },
      { step: 4, title: '测试网络连通性', description: '测试网关和DNS连通性', commands: ['ping 192.168.1.1', 'nslookup www.google.com'], expectedResult: '网络连通正常' },
    ]
  }
];

// 快捷症状标签
const quickSymptoms = [
  '系统无法正常关机', 'Office崩溃', '网络连接问题', 'DNS故障',
  '打印机脱机', '虚拟机卡顿', '蓝屏错误', '更新失败',
  '认证失败', '连接超时', '无法打印', '应用无响应',
  '开机慢', '运行缓慢', '驱动问题', '权限不足'
];

export default function CaseSubmit({ onClose, onSubmit }: CaseSubmitProps) {
  const [formData, setFormData] = useState({
    title: '',
    errorCode: '-',
    category: 'system' as CaseCategory,
    systemVersion: '',
    deviceType: '',
    brand: '',
    model: '',
    symptoms: [''],
    causeAnalysis: '',
    troubleshooting: '',
    troubleshootingImages: [] as Array<{ file: File; preview: string; fileId?: string; fileName: string; url?: string }>,
    solution: '',
    solutionImages: [] as Array<{ file: File; preview: string; fileId?: string; fileName: string; url?: string }>,
    causeAnalysisImages: [] as Array<{ file: File; preview: string; fileId?: string; fileName: string; url?: string }>,
    steps: [{ step: 1, title: '', description: '', commands: [''], expectedResult: '' }],
    tags: [''],
    visibility: 'public' as 'public' | 'private',
    attachments: [] as Array<{ fileId: string; fileName: string }>,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSaveIndicator, setAutoSaveIndicator] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileId: string; fileName: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // 草稿键名
  const DRAFT_KEY = 'case-submit-draft';

  // 加载草稿
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setFormData({
          ...draft,
          troubleshootingImages: draft.troubleshootingImages || [],
          solutionImages: draft.solutionImages || [],
          causeAnalysisImages: draft.causeAnalysisImages || [],
        });
      } catch {
        console.error('Failed to load draft');
      }
    }
  }, []);

  // 自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      setAutoSaveIndicator(true);
      setTimeout(() => setAutoSaveIndicator(false), 2000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // 应用模板
  const applyTemplate = useCallback((template: CaseTemplate) => {
    setFormData(prev => ({
      ...prev,
      category: template.category,
      symptoms: [...template.symptoms, ''],
      steps: template.steps.map(s => ({ 
        ...s, 
        commands: s.commands.length > 0 ? [...s.commands] : [''],
        expectedResult: s.expectedResult || ''
      })),
    }));
    setSelectedTemplate(template.name);
    setShowTemplateModal(false);
  }, []);

  // 清除模板
  const clearTemplate = useCallback(() => {
    setSelectedTemplate('');
    setFormData(prev => ({
      ...prev,
      symptoms: [''],
      steps: [{ step: 1, title: '', description: '', commands: [''], expectedResult: '' }],
    }));
  }, []);

  // 表单更新方法
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSymptomChange = (index: number, value: string) => {
    const newSymptoms = [...formData.symptoms];
    newSymptoms[index] = value;
    setFormData((prev) => ({ ...prev, symptoms: newSymptoms }));
  };

  const addSymptom = () => {
    setFormData((prev) => ({ ...prev, symptoms: [...prev.symptoms, ''] }));
  };

  const removeSymptom = (index: number) => {
    if (formData.symptoms.length > 1) {
      const newSymptoms = formData.symptoms.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, symptoms: newSymptoms }));
    }
  };

  const addQuickSymptom = (symptom: string) => {
    if (!formData.symptoms.includes(symptom)) {
      setFormData((prev) => ({ ...prev, symptoms: [...prev.symptoms.filter(s => s.trim()), symptom, ''] }));
    }
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData((prev) => ({ ...prev, steps: newSteps }));
  };

  const handleCommandChange = (stepIndex: number, cmdIndex: number, value: string) => {
    const newSteps = [...formData.steps];
    const commands = [...(newSteps[stepIndex].commands || [])];
    commands[cmdIndex] = value;
    newSteps[stepIndex] = { ...newSteps[stepIndex], commands };
    setFormData((prev) => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    const newStep = {
      step: formData.steps.length + 1,
      title: '',
      description: '',
      commands: [''],
      expectedResult: '',
    };
    setFormData((prev) => ({ ...prev, steps: [...prev.steps, newStep] }));
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, step: i + 1 }));
      setFormData((prev) => ({ ...prev, steps: newSteps }));
    }
  };

  const addCommand = (stepIndex: number) => {
    const newSteps = [...formData.steps];
    const commands = [...(newSteps[stepIndex].commands || []), ''];
    newSteps[stepIndex] = { ...newSteps[stepIndex], commands };
    setFormData((prev) => ({ ...prev, steps: newSteps }));
  };

  const removeCommand = (stepIndex: number, cmdIndex: number) => {
    const newSteps = [...formData.steps];
    const commands = (newSteps[stepIndex].commands || []).filter((_, i) => i !== cmdIndex);
    newSteps[stepIndex] = { ...newSteps[stepIndex], commands };
    setFormData((prev) => ({ ...prev, steps: newSteps }));
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData((prev) => ({ ...prev, tags: newTags }));
  };

  const addTag = () => {
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, ''] }));
  };

  const removeTag = (index: number) => {
    if (formData.tags.length > 1) {
      const newTags = formData.tags.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, tags: newTags }));
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入故障标题';
    }

    const validSymptoms = formData.symptoms.filter((s) => s.trim());
    if (validSymptoms.length === 0) {
      newErrors.symptoms = '请至少填写一个故障症状';
    }

    if (!formData.causeAnalysis.trim()) {
      newErrors.causeAnalysis = '请输入原因分析';
    }

    if (!formData.solution.trim()) {
      newErrors.solution = '请填写解决方案';
    }

    const validSteps = formData.steps.filter((step) => step.title.trim());
    if (validSteps.length === 0) {
      newErrors.steps = '请至少填写一个排查步骤';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUploadComplete = useCallback((fileId: string, fileName: string) => {
    setUploadedFiles(prev => [...prev, { fileId, fileName }]);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, { fileId, fileName }]
    }));
  }, []);

  const handleRemoveAttachment = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  }, []);

  const handleTroubleshootingImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        fileName: file.name,
      }));
      setFormData(prev => ({
        ...prev,
        troubleshootingImages: [...prev.troubleshootingImages, ...newFiles]
      }));
    }
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  const handleRemoveTroubleshootingImage = useCallback((index: number) => {
    setFormData(prev => {
      const image = prev.troubleshootingImages[index];
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return {
        ...prev,
        troubleshootingImages: prev.troubleshootingImages.filter((_, i) => i !== index)
      };
    });
  }, []);

  const handleCauseAnalysisImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        fileName: file.name,
      }));
      setFormData(prev => ({
        ...prev,
        causeAnalysisImages: [...prev.causeAnalysisImages, ...newFiles]
      }));
    }
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  const handleRemoveCauseAnalysisImage = useCallback((index: number) => {
    setFormData(prev => {
      const image = prev.causeAnalysisImages[index];
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return {
        ...prev,
        causeAnalysisImages: prev.causeAnalysisImages.filter((_, i) => i !== index)
      };
    });
  }, []);

  const handleSolutionImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        fileName: file.name,
      }));
      setFormData(prev => ({
        ...prev,
        solutionImages: [...prev.solutionImages, ...newFiles]
      }));
    }
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  const handleRemoveSolutionImage = useCallback((index: number) => {
    setFormData(prev => {
      const image = prev.solutionImages[index];
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return {
        ...prev,
        solutionImages: prev.solutionImages.filter((_, i) => i !== index)
      };
    });
  }, []);

  // 提交表单
  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    
    if (!validateForm()) {
      const missingFields = Object.keys(errors).map(key => {
        const fieldNames: Record<string, string> = {
          title: '故障标题',
          symptoms: '故障症状',
          causeAnalysis: '原因分析',
          solution: '解决方案',
          steps: '排查步骤',
        };
        return fieldNames[key] || key;
      });
      
      if (missingFields.length > 0) {
        const message = `请补充以下必填字段：\n\n${missingFields.join('\n• ')}`;
        alert(message);
      }
      return;
    }
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const validSymptoms = formData.symptoms.filter((s) => s.trim());
    const validSteps = formData.steps.map((step, index) => ({
      step: index + 1,
      title: step.title,
      description: step.description,
      commands: (step.commands || []).filter((c) => c.trim()),
      expectedResult: step.expectedResult,
    })).filter((step) => step.title.trim());
    const validTags = formData.tags.filter((t) => t.trim());

    const caseData = {
      title: formData.title,
      description: formData.causeAnalysis || formData.title,
      category: formData.category,
      severity: 'medium',
      errorCode: formData.errorCode || '-',
      deviceType: formData.deviceType || '其他',
      brand: formData.brand || '未知',
      model: formData.model || '未知',
      systemVersion: systemVersions.find(v => v.id === formData.systemVersion)?.name || '',
      status: formData.visibility === 'private' ? 'pending' : 'resolved',
      symptoms: validSymptoms,
      causeAnalysis: formData.causeAnalysis,
      troubleshooting: formData.troubleshooting,
      solution: formData.solution,
      steps: validSteps,
      tags: validTags,
      difficulty: 'medium',
      visibility: formData.visibility === 'private' ? 'private' : 'public',
      attachments: uploadedFiles,
    };

    try {
      console.log('[案例提交] 开始提交，附件数量:', uploadedFiles.length);
      console.log('[案例提交] 附件信息:', JSON.stringify(uploadedFiles));
      
      const submitFormData = new FormData();
      submitFormData.append('data', JSON.stringify(caseData));
      
      formData.troubleshootingImages?.forEach((img) => {
        if (img.file) {
          submitFormData.append('troubleshootingImages', img.file);
        }
      });
      
      formData.causeAnalysisImages?.forEach((img) => {
        if (img.file) {
          submitFormData.append('causeAnalysisImages', img.file);
        }
      });
      
      formData.solutionImages?.forEach((img) => {
        if (img.file) {
          submitFormData.append('solutionImages', img.file);
        }
      });
      
      const response = await apiUpload('/cases', submitFormData);

      console.log('[案例提交] 响应:', response);
      
      if (response.success) {
        const result = response.data;
        console.log('[案例提交] 成功:', result);
        const submitData: Case = {
          ...result,
          views: 0,
          likes: 0,
          comments: 0,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          author: '当前用户',
          authorId: 'current-user',
          relatedCases: [],
          verification: false,
          quality: validSteps.length >= 3 ? 'verified' : 'standard',
        };
        localStorage.removeItem(DRAFT_KEY);
        setUploadedFiles([]);
        onSubmit(submitData);
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        let errorText = '';
        try {
          const error = await response.json();
          errorText = error.errors?.[0]?.msg || error.message || '未知错误';
        } catch {
          errorText = await response.text();
        }
        console.error('[案例提交] 失败:', response.status, errorText);
        alert(`提交失败: ${errorText}`);
      }
    } catch (error) {
      const err = error as Error;
      console.error('[案例提交] 异常:', err.name, err.message);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        alert('网络连接失败，请检查后端服务是否正常运行');
      } else if (err.name === 'AbortError') {
        alert('请求超时，请重试');
      } else {
        alert(`提交失败: ${error.message || '未知错误'}`);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // 预览草稿
  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    setAutoSaveIndicator(true);
    setTimeout(() => setAutoSaveIndicator(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <h2 className="text-xl font-bold text-theme-text">提交故障案例</h2>
            <p className="text-sm text-text-muted mt-1">分享你的故障排查经验，帮助更多运维小伙伴</p>
          </div>
          <div className="flex items-center gap-3">
            {autoSaveIndicator && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Save className="w-4 h-4" />
                已自动保存
              </span>
            )}
            <button
              onClick={saveDraft}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
            >
              <Save className="w-4 h-4" />
              保存草稿
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 故障模板选择 */}
            <div className="bg-gradient-to-r from-primary/5 to-blue-50/50 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-theme-text">快速填写模板</p>
                    <p className="text-sm text-text-muted">选择模板可自动填充通用排查步骤</p>
                  </div>
                </div>
                {selectedTemplate ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                      {selectedTemplate}
                    </span>
                    <button
                      onClick={clearTemplate}
                      className="text-sm text-text-muted hover:text-red-500"
                    >
                      清除模板
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    选择模板
                  </button>
                )}
              </div>
            </div>

            {/* 分区1：基础信息 */}
            <div className="border-b border-primary/10 pb-6">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">1</span>
                基础信息
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">故障标题 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="示例：Win11更新后开机蓝屏0x0000007B"
                  className={`w-full px-4 py-3 bg-theme-bg border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.title ? 'border-red-300 focus:ring-red-300' : 'border-primary/20 focus:ring-primary/30'
                  }`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">故障分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">系统版本</label>
                  <select
                    value={formData.systemVersion}
                    onChange={(e) => handleInputChange('systemVersion', e.target.value)}
                    className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                  >
                    <option value="">请选择系统版本</option>
                    {systemVersions.map((version) => (
                      <option key={version.id} value={version.id}>{version.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">错误代码</label>
                  <input
                    type="text"
                    value={formData.errorCode}
                    onChange={(e) => handleInputChange('errorCode', e.target.value)}
                    placeholder="如：0x80070005，无则填-"
                    className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">设备类型</label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => handleInputChange('deviceType', e.target.value)}
                    className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                  >
                    <option value="">请选择设备类型</option>
                    {deviceTypes.map((device) => (
                      <option key={device.id} value={device.name}>{device.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">品牌</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="如：Dell、HP"
                    className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">型号</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="如：OptiPlex 7090"
                    className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* 分区2：故障现象 */}
            <div className="border-b border-primary/10 pb-6">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">2</span>
                故障现象 <span className="text-red-500">*</span>
              </h3>
              
              <div className="bg-yellow-50 rounded-xl p-4 mb-4 border border-yellow-200">
                <p className="text-sm text-yellow-800 font-medium mb-2">请完整填写以下信息，方便同行看懂你的故障：</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>1. 触发故障的操作（打开软件/开机/打印/连WiFi等）</li>
                  <li>2. 完整报错弹窗文字、蓝屏代码、提示信息</li>
                  <li>3. 故障出现频率（偶尔一次/每次操作必现/批量设备故障）</li>
                  <li>4. 你已经自行尝试过哪些排查操作（重启、重装驱动、改组策略等）</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">症状描述</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => addQuickSymptom(symptom)}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {formData.symptoms.map((symptom, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={symptom}
                      onChange={(e) => handleSymptomChange(index, e.target.value)}
                      placeholder={`症状 ${index + 1}`}
                      className={`flex-1 px-4 py-2 bg-theme-bg border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.symptoms ? 'border-red-300 focus:ring-red-300' : 'border-primary/20 focus:ring-primary/30'
                      }`}
                    />
                    <button
                      onClick={() => removeSymptom(index)}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                      disabled={formData.symptoms.length === 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addSymptom}
                  className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加症状
                </button>
              </div>
              {errors.symptoms && <p className="mt-1 text-sm text-red-500">{errors.symptoms}</p>}
            </div>

            {/* 分区3：排查与解决方案 */}
            <div className="border-b border-primary/10 pb-6">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">3</span>
                排查与解决方案
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">我的排查过程</label>
                  <textarea
                    value={formData.troubleshooting}
                    onChange={(e) => handleInputChange('troubleshooting', e.target.value)}
                    placeholder="记录你一步步测试、定位问题的操作..."
                    rows={3}
                    className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-theme-text mb-2 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      插入图片
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-primary/20 rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                      <Image className="w-8 h-8 text-text-muted mb-2" />
                      <span className="text-sm text-text-muted">点击选择图片</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleTroubleshootingImageChange}
                        className="hidden"
                      />
                    </label>
                    {formData.troubleshootingImages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.troubleshootingImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img.preview || img.url}
                              alt={img.fileName}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleRemoveTroubleshootingImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">原因分析 <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.causeAnalysis}
                    onChange={(e) => handleInputChange('causeAnalysis', e.target.value)}
                    placeholder="分析故障根因，如：驱动版本不兼容、组策略配置错误、系统文件损坏等..."
                    rows={3}
                    className={`w-full px-4 py-3 bg-theme-bg border rounded-xl focus:outline-none focus:ring-2 resize-none ${
                      errors.causeAnalysis ? 'border-red-300 focus:ring-red-300' : 'border-primary/20 focus:ring-primary/30'
                    }`}
                  />
                  {errors.causeAnalysis && <p className="mt-1 text-sm text-red-500">{errors.causeAnalysis}</p>}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-theme-text mb-2 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      插入图片
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-primary/20 rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                      <Image className="w-8 h-8 text-text-muted mb-2" />
                      <span className="text-sm text-text-muted">点击选择图片</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCauseAnalysisImageChange}
                        className="hidden"
                      />
                    </label>
                    {(formData.causeAnalysisImages || []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.causeAnalysisImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img.preview || img.url}
                              alt={img.fileName}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleRemoveCauseAnalysisImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">最终根治方案 <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.solution}
                    onChange={(e) => handleInputChange('solution', e.target.value)}
                    placeholder="完整可复用修复步骤，支持粘贴CMD/PowerShell脚本、注册表路径..."
                    rows={3}
                    className={`w-full px-4 py-3 bg-theme-bg border rounded-xl focus:outline-none focus:ring-2 resize-none ${
                      errors.solution ? 'border-red-300 focus:ring-red-300' : 'border-primary/20 focus:ring-primary/30'
                    }`}
                  />
                  {errors.solution && <p className="mt-1 text-sm text-red-500">{errors.solution}</p>}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-theme-text mb-2 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      插入图片
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-primary/20 rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                      <Image className="w-8 h-8 text-text-muted mb-2" />
                      <span className="text-sm text-text-muted">点击选择图片</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSolutionImageChange}
                        className="hidden"
                      />
                    </label>
                    {(formData.solutionImages || []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.solutionImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img.preview || img.url}
                              alt={img.fileName}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleRemoveSolutionImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-theme-text mb-2">排查步骤 <span className="text-red-500">*</span></label>
                <div className="space-y-4">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="p-4 bg-theme-bg rounded-xl border border-primary/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                            {step.step}
                          </span>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                            placeholder="步骤标题"
                            className="px-3 py-1 border-b border-primary/20 bg-transparent focus:outline-none focus:border-primary"
                          />
                        </div>
                        <button
                          onClick={() => removeStep(index)}
                          className="p-1 text-text-muted hover:text-red-500 transition-colors"
                          disabled={formData.steps.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        value={step.description}
                        onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                        placeholder="详细描述此步骤..."
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-3"
                      />

                      {(step.commands || []).map((cmd, cmdIndex) => (
                        <div key={cmdIndex} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={cmd}
                            onChange={(e) => handleCommandChange(index, cmdIndex, e.target.value)}
                            placeholder="命令或代码..."
                            className="flex-1 px-3 py-2 bg-black/90 text-green-400 rounded-lg text-sm font-mono focus:outline-none"
                          />
                          <button
                            onClick={() => removeCommand(index, cmdIndex)}
                            className="p-2 text-text-muted hover:text-red-500 transition-colors"
                            disabled={(step.commands || []).length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addCommand(index)}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        添加命令
                      </button>

                      <input
                        type="text"
                        value={step.expectedResult || ''}
                        onChange={(e) => handleStepChange(index, 'expectedResult', e.target.value)}
                        placeholder="预期结果（可选）"
                        className="w-full mt-3 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm focus:outline-none border border-green-200"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addStep}
                    className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加步骤
                  </button>
                </div>
                {errors.steps && <p className="mt-2 text-sm text-red-500">{errors.steps}</p>}
              </div>
            </div>

            {/* 分区4：补充设置 */}
            <div>
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">4</span>
                补充设置
              </h3>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">自定义标签</label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => handleTagChange(index, e.target.value)}
                        placeholder="标签"
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => removeTag(index)}
                        className="p-1 text-text-muted hover:text-red-500 transition-colors"
                        disabled={formData.tags.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addTag}
                    className="flex items-center gap-1 px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加标签
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2">多个标签用回车或逗号分隔，如：Office,打印机,脱机</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-theme-text mb-2">可见范围</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.visibility === 'public'}
                      onChange={() => handleInputChange('visibility', 'public')}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">公开（所有人可见）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.visibility === 'private'}
                      onChange={() => handleInputChange('visibility', 'private')}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">仅存为私人草稿</span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-theme-text mb-2">附件上传</label>
                <div className="border-2 border-dashed border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-colors">
                  <DirectUpload 
                    onUploadComplete={handleFileUploadComplete} 
                    category="document" 
                    accessLevel="private"
                  />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-theme-bg rounded-lg">
                        <FileText className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-theme-text truncate max-w-32">{file.fileName}</span>
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-text-muted hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 border-t border-primary/10 flex items-center justify-between">
          <div className="text-sm text-text-muted">
            <span className="text-red-500">*</span> 表示必填项
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-theme-bg text-text-muted rounded-xl hover:bg-primary/10 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-colors shadow-lg ${
                isSubmitting 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary-dark shadow-primary/30'
              }`}
            >
              <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? '发布中...' : '发布案例'}
            </button>
          </div>
        </div>
      </div>

      {/* 模板选择弹窗 */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-theme-text">选择故障模板</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-primary/10 rounded-lg"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="space-y-3">
              {caseTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="w-full p-4 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors text-left border border-primary/10 hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-theme-text">{template.name}</p>
                      <p className="text-sm text-text-muted mt-1">{template.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.symptoms.map((symptom) => (
                      <span key={symptom} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}