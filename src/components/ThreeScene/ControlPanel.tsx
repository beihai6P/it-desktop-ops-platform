import { 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut,
  Move3d,
  Wrench,
  Info
} from 'lucide-react';
import { useState } from 'react';
import { categories, type CasePart } from './caseModel';

interface ControlPanelProps {
  selectedPartId: string | null;
  onPartSelect: (partId: string | null) => void;
  parts: CasePart[];
  onPartsUpdate: (parts: CasePart[]) => void;
  onResetView: () => void;
}

export default function ControlPanel({
  selectedPartId,
  onPartSelect,
  parts,
  onPartsUpdate,
  onResetView,
}: ControlPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string>('parts');
  const [filterCategory, setFilterCategory] = useState<string>('全部');

  const selectedPart = parts.find((p) => p.id === selectedPartId);

  const filteredParts = filterCategory === '全部'
    ? parts
    : parts.filter((p) => p.category === filterCategory);

  const togglePart = (partId: string) => {
    const updatedParts = parts.map((part) =>
      part.id === partId ? { ...part, disassembled: !part.disassembled } : part
    );
    onPartsUpdate(updatedParts);
  };

  const disassembleAll = () => {
    const updatedParts = parts.map((part) => ({ ...part, disassembled: true }));
    onPartsUpdate(updatedParts);
  };

  const assembleAll = () => {
    const updatedParts = parts.map((part) => ({ ...part, disassembled: false }));
    onPartsUpdate(updatedParts);
  };

  const SectionHeader = ({ title, icon: Icon, sectionId }: { title: string; icon: typeof Eye; sectionId: string }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === sectionId ? '' : sectionId)}
      className="w-full flex items-center justify-between p-3 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-medium text-theme-text">{title}</span>
      </div>
      {expandedSection === sectionId ? (
        <ChevronUp className="w-4 h-4 text-text-muted" />
      ) : (
        <ChevronDown className="w-4 h-4 text-text-muted" />
      )}
    </button>
  );

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Move3d className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-theme-text">3D机箱拆解</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={disassembleAll}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
        >
          <Wrench className="w-4 h-4" />
          全部拆解
        </button>
        <button
          onClick={assembleAll}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          全部组装
        </button>
      </div>

      <SectionHeader title="部件列表" icon={Eye} sectionId="parts" />
      {expandedSection === 'parts' && (
        <div className="space-y-2">
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-theme-bg text-text-muted hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredParts.map((part) => (
              <div
                key={part.id}
                onClick={() => onPartSelect(part.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                  selectedPartId === part.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `#${part.color.toString(16).padStart(6, '0')}` }}
                  />
                  <span className="text-sm text-theme-text">{part.name}</span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePart(part.id);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    part.disassembled
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-green-500 hover:bg-green-50'
                  }`}
                >
                  {part.disassembled ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionHeader title="视图控制" icon={ZoomIn} sectionId="view" />
      {expandedSection === 'view' && (
        <div className="space-y-2">
          <button
            onClick={onResetView}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-theme-bg rounded-lg hover:bg-primary/10 transition-colors text-sm text-theme-text"
          >
            <RotateCcw className="w-4 h-4" />
            重置视角
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-theme-bg rounded-lg hover:bg-primary/10 transition-colors text-sm text-theme-text"
            >
              <ZoomIn className="w-4 h-4" />
              放大
            </button>
            <button
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-theme-bg rounded-lg hover:bg-primary/10 transition-colors text-sm text-theme-text"
            >
              <ZoomOut className="w-4 h-4" />
              缩小
            </button>
          </div>
        </div>
      )}

      {selectedPart && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-theme-text">{selectedPart.name}</h4>
          </div>
          <p className="text-sm text-text-muted mb-3">{selectedPart.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">类别:</span>
              <span className="text-theme-text">{selectedPart.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted">状态:</span>
              <span
                className={
                  selectedPart.disassembled
                    ? 'text-red-500'
                    : 'text-green-500'
                }
              >
                {selectedPart.disassembled ? '已拆解' : '已组装'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}