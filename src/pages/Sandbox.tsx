import { useState } from 'react';
import { Layers, Move3d } from 'lucide-react';
import CaseDisassembly from '@/components/ThreeScene/CaseDisassembly';
import IntegratedLab from '@/components/FaultLab/IntegratedLab';

type TabType = 'disassembly' | 'fault';

export default function Sandbox() {
  const [activeTab, setActiveTab] = useState<TabType>('disassembly');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10">
        <div>
          <h2 className="text-xl font-bold text-theme-text">故障模拟沙盒实验室</h2>
          <p className="text-sm text-text-muted mt-1">安全可控的实验环境，用于技术演练与新人培训</p>
        </div>
      </div>

      <div className="flex gap-2 px-6 py-4 border-b border-primary/10">
        <button
          onClick={() => setActiveTab('disassembly')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'disassembly'
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-white/85 text-text-muted hover:bg-primary/10 hover:text-primary border border-primary/20'
          }`}
        >
          <Move3d className="w-5 h-5" />
          3D机箱拆解
        </button>
        <button
          onClick={() => setActiveTab('fault')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'fault'
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-white/85 text-text-muted hover:bg-primary/10 hover:text-primary border border-primary/20'
          }`}
        >
          <Layers className="w-5 h-5" />
          一体化故障仿真实验室
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === 'disassembly' && <CaseDisassembly />}
        {activeTab === 'fault' && <IntegratedLab />}
      </div>
    </div>
  );
}