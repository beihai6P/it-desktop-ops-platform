import { useState } from 'react';
import { X, Send, Plus, Trash2, Monitor, Wifi, HardDrive, Printer } from 'lucide-react';
import type { Case } from '@/types';

interface CaseSubmitProps {
  onClose: () => void;
  onSubmit: (data: Case) => void;
}

const deviceTypes = [
  { id: 'desktop', name: '台式机', icon: Monitor },
  { id: 'laptop', name: '笔记本', icon: Wifi },
  { id: 'virtual', name: '虚拟桌面', icon: Monitor },
  { id: 'printer', name: '打印机', icon: Printer },
  { id: 'hardware', name: '其他硬件', icon: HardDrive },
];

const difficulties = [
  { id: 'easy', name: '简单' },
  { id: 'medium', name: '中等' },
  { id: 'hard', name: '困难' },
];

export default function CaseSubmit({ onClose, onSubmit }: CaseSubmitProps) {
  const [formData, setFormData] = useState({
    title: '',
    errorCode: '-',
    deviceType: '',
    brand: '',
    model: '',
    symptoms: [''],
    causeAnalysis: '',
    solution: '',
    steps: [{ step: 1, title: '', description: '', commands: [''], expectedResult: '' }],
    tags: [''],
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

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

  const handleSubmit = () => {
    const validSymptoms = formData.symptoms.filter((s) => s.trim());
    const validSteps = formData.steps.map((step, index) => ({
      step: index + 1,
      title: step.title,
      description: step.description,
      commands: (step.commands || []).filter((c) => c.trim()),
      expectedResult: step.expectedResult,
    })).filter((step) => step.title.trim());
    const validTags = formData.tags.filter((t) => t.trim());

    if (!formData.title.trim()) {
      alert('请输入故障标题');
      return;
    }

    if (validSymptoms.length === 0) {
      alert('请至少输入一个症状');
      return;
    }

    const submitData: Case = {
      id: `case-${Date.now()}`,
      title: formData.title,
      errorCode: formData.errorCode || '-',
      deviceType: formData.deviceType || '其他',
      brand: formData.brand || '未知',
      model: formData.model || '未知',
      status: 'pending',
      views: 0,
      createdAt: new Date().toISOString().split('T')[0] as unknown as string,
      updatedAt: new Date().toISOString().split('T')[0] as unknown as string,
      author: '当前用户',
      authorId: 'current-user',
      symptoms: validSymptoms,
      causeAnalysis: formData.causeAnalysis,
      solution: formData.solution,
      steps: validSteps,
      relatedCases: [],
      tags: validTags,
      difficulty: formData.difficulty,
      verification: false,
      likes: 0,
      comments: 0,
    };

    onSubmit(submitData);
    // 延迟关闭，确保发布成功提示能显示
    setTimeout(() => {
      onClose();
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div>
            <h2 className="text-xl font-bold text-theme-text">提交故障案例</h2>
            <p className="text-sm text-text-muted mt-1">分享你的故障排查经验</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">故障标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入故障标题，如：Windows 11 更新后关机失败"
                className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">难度等级</label>
                <div className="flex gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => handleInputChange('difficulty', diff.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.difficulty === diff.id
                          ? 'bg-primary text-white'
                          : 'bg-theme-bg text-text-muted hover:bg-primary/10'
                      }`}
                    >
                      {diff.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">症状描述 *</label>
              <div className="space-y-2">
                {formData.symptoms.map((symptom, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={symptom}
                      onChange={(e) => handleSymptomChange(index, e.target.value)}
                      placeholder={`症状 ${index + 1}`}
                      className="flex-1 px-4 py-2 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">原因分析</label>
              <textarea
                value={formData.causeAnalysis}
                onChange={(e) => handleInputChange('causeAnalysis', e.target.value)}
                placeholder="分析故障产生的原因..."
                rows={3}
                className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">解决方案</label>
              <textarea
                value={formData.solution}
                onChange={(e) => handleInputChange('solution', e.target.value)}
                placeholder="描述解决故障的方案..."
                rows={3}
                className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">排查步骤</label>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">标签</label>
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
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-primary/10 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-theme-bg text-text-muted rounded-xl hover:bg-primary/10 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Send className="w-4 h-4" />
            提交案例
          </button>
        </div>
      </div>
    </div>
  );
}