import { useState, useCallback } from 'react';
import ThreeScene from './ThreeScene';
import ControlPanel from './ControlPanel';
import { caseParts, type CasePart } from './caseModel';
import { Cpu, Info } from 'lucide-react';

export default function CaseDisassembly() {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [parts, setParts] = useState<CasePart[]>(caseParts);

  const handlePartSelect = useCallback((partId: string | null) => {
    setSelectedPartId(partId);
  }, []);

  const handlePartsUpdate = useCallback((updatedParts: CasePart[]) => {
    setParts(updatedParts);
  }, []);

  const handleResetView = useCallback(() => {
  }, []);

  const disassembledCount = parts.filter((p) => p.disassembled).length;
  const totalParts = parts.length;

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-theme-text">3D机箱拆解实验室</h3>
            <p className="text-sm text-text-muted">交互式3D硬件拆解与组装学习平台</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{disassembledCount}</p>
            <p className="text-xs text-text-muted">已拆解部件</p>
          </div>
          <div className="w-px h-10 bg-primary/20" />
          <div className="text-right">
            <p className="text-2xl font-bold text-theme-text">{totalParts}</p>
            <p className="text-xs text-text-muted">总部件数</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-[500px]">
          <ThreeScene
            selectedPartId={selectedPartId}
            onPartSelect={handlePartSelect}
            parts={parts}
          />
        </div>
        <div className="lg:col-span-1">
          <ControlPanel
            selectedPartId={selectedPartId}
            onPartSelect={handlePartSelect}
            parts={parts}
            onPartsUpdate={handlePartsUpdate}
            onResetView={handleResetView}
          />
        </div>
      </div>

      <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-theme-text mb-1">操作提示</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• 点击3D模型中的部件可以选中它</li>
              <li>• 使用鼠标拖拽可以旋转视角</li>
              <li>• 使用鼠标滚轮可以缩放视图</li>
              <li>• 通过控制面板可以拆解/组装单个或全部部件</li>
              <li>• 选中部件后会显示详细信息</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}