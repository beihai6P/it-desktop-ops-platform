import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, HardDrive, Monitor, Network, Plus, Trash2 } from 'lucide-react';

export interface CPUConfig {
  brand: 'Intel' | 'AMD' | 'Apple';
  model: string;
  cores: number;
  threads: number;
  baseClock: number;
  boostClock: number;
  hyperThreading: boolean;
}

export interface MemoryConfig {
  sizeMB: number;
  channels: number;
  type: 'DDR3' | 'DDR4' | 'DDR5' | 'LPDDR4' | 'LPDDR5';
  frequency: number;
  virtualMemoryMB: number;
}

export interface DiskConfig {
  id: string;
  type: 'HDD' | 'SSD' | 'NVMe';
  capacityGB: number;
  interface: 'SATA III' | 'PCIe 3.0 x4' | 'PCIe 4.0 x4' | 'PCIe 5.0 x4';
  rpm: number | null;
  partitionStyle: 'MBR' | 'GPT';
  iops: number;
  hasBadSectors: boolean;
  badSectorCount: number;
}

export interface GPUConfig {
  type: 'integrated' | 'NVIDIA' | 'AMD';
  model: string;
  vramGB: number;
}

export interface NetworkConfig {
  id: string;
  name: string;
  speed: '100Mbps' | '1Gbps' | '10Gbps';
  mac: string;
  latencyMs: number;
  packetLoss: number;
}

interface HardwareConfigProps {
  cpu: CPUConfig;
  memory: MemoryConfig;
  disks: DiskConfig[];
  gpu: GPUConfig;
  networks: NetworkConfig[];
  onCpuChange: (cpu: CPUConfig) => void;
  onMemoryChange: (memory: MemoryConfig) => void;
  onDisksChange: (disks: DiskConfig[]) => void;
  onGpuChange: (gpu: GPUConfig) => void;
  onNetworksChange: (networks: NetworkConfig[]) => void;
  locked: boolean;
  maxMemoryLimit: number | null;
}

const cpuModels: Record<string, string[]> = {
  Intel: [
    'Core i3-10100', 'Core i3-12100', 'Core i3-13100',
    'Core i5-10400', 'Core i5-12400', 'Core i5-13400', 'Core i5-14400',
    'Core i7-10700', 'Core i7-12700', 'Core i7-13700', 'Core i7-14700',
    'Core i9-10900', 'Core i9-12900', 'Core i9-13900', 'Core i9-14900',
    'Xeon E5-2690', 'Xeon Gold 6330', 'Xeon Platinum 8375C',
  ],
  AMD: [
    'Ryzen 3 5300G', 'Ryzen 3 7300U',
    'Ryzen 5 5600', 'Ryzen 5 7600', 'Ryzen 5 7600X',
    'Ryzen 7 5800X', 'Ryzen 7 7800X3D',
    'Ryzen 9 5900X', 'Ryzen 9 7900X', 'Ryzen 9 7950X',
    'Threadripper 3960X', 'Threadripper 5965WX',
    'EPYC 7373X', 'EPYC 7713',
  ],
  Apple: [
    'Apple M1', 'Apple M1 Pro', 'Apple M1 Max', 'Apple M1 Ultra',
    'Apple M2', 'Apple M2 Pro', 'Apple M2 Max', 'Apple M2 Ultra',
    'Apple M3', 'Apple M3 Pro', 'Apple M3 Max',
  ],
};

const gpuModels: Record<string, string[]> = {
  integrated: ['Intel UHD 630', 'Intel Iris Plus', 'AMD Radeon Vega 8', 'Apple M1 GPU'],
  NVIDIA: [
    'GeForce GTX 1050', 'GeForce GTX 1650', 'GeForce RTX 2060',
    'GeForce RTX 3060', 'GeForce RTX 3070', 'GeForce RTX 3080', 'GeForce RTX 3090',
    'GeForce RTX 4060', 'GeForce RTX 4070', 'GeForce RTX 4080', 'GeForce RTX 4090',
    'Quadro P4000', 'Quadro RTX 5000', 'A100', 'H100',
  ],
  AMD: [
    'Radeon RX 5500 XT', 'Radeon RX 5600 XT', 'Radeon RX 5700 XT',
    'Radeon RX 6600', 'Radeon RX 6600 XT', 'Radeon RX 6700 XT',
    'Radeon RX 6800', 'Radeon RX 6800 XT', 'Radeon RX 6900 XT',
    'Radeon RX 7600', 'Radeon RX 7700 XT', 'Radeon RX 7800 XT', 'Radeon RX 7900 XTX',
  ],
};

const memoryTypes = ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5'] as const;
const memoryFrequencies = [1333, 1600, 1866, 2133, 2400, 2666, 3000, 3200, 3600, 4000, 4266, 4800];

export default function HardwareConfig({
  cpu,
  memory,
  disks,
  gpu,
  networks,
  onCpuChange,
  onMemoryChange,
  onDisksChange,
  onGpuChange,
  onNetworksChange,
  locked,
  maxMemoryLimit,
}: HardwareConfigProps) {
  const [expanded, setExpanded] = useState(true);
  const [expandedSection, setExpandedSection] = useState<'cpu' | 'memory' | 'disk' | 'gpu' | 'network'>('cpu');

  const addDisk = () => {
    if (disks.length < 8) {
      onDisksChange([...disks, {
        id: `disk-${Date.now()}`,
        type: 'SSD',
        capacityGB: 512,
        interface: 'SATA III',
        rpm: null,
        partitionStyle: 'GPT',
        iops: 500,
        hasBadSectors: false,
        badSectorCount: 0,
      }]);
    }
  };

  const removeDisk = (id: string) => {
    onDisksChange(disks.filter(d => d.id !== id));
  };

  const addNetwork = () => {
    if (networks.length < 4) {
      onNetworksChange([...networks, {
        id: `net-${Date.now()}`,
        name: `网卡 ${networks.length + 1}`,
        speed: '1Gbps',
        mac: `00:11:22:33:44:${String(networks.length).padStart(2, '0')}`,
        latencyMs: 10,
        packetLoss: 0,
      }]);
    }
  };

  const removeNetwork = (id: string) => {
    onNetworksChange(networks.filter(n => n.id !== id));
  };

  return (
    <div className="border border-primary/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-theme-bg hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-theme-text">硬件配置</h4>
            <p className="text-xs text-text-muted">CPU/内存/硬盘/显卡/网卡 全自定义</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-primary/10">
          <div className="border-b border-primary/10">
            <button
              onClick={() => setExpandedSection('cpu')}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-theme-text">CPU配置</span>
              </div>
              {expandedSection === 'cpu' ? (
                <ChevronUp className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              )}
            </button>
            {expandedSection === 'cpu' && (
              <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">品牌</label>
                  <select
                    value={cpu.brand}
                    onChange={(e) => onCpuChange({ ...cpu, brand: e.target.value as 'Intel' | 'AMD' | 'Apple' })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="Intel">Intel</option>
                    <option value="AMD">AMD</option>
                    <option value="Apple">Apple</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">型号</label>
                  <select
                    value={cpu.model}
                    onChange={(e) => onCpuChange({ ...cpu, model: e.target.value })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {cpuModels[cpu.brand].map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">核心数</label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={cpu.cores}
                    onChange={(e) => onCpuChange({ ...cpu, cores: parseInt(e.target.value) || 1 })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">线程数</label>
                  <input
                    type="number"
                    min="1"
                    max="128"
                    value={cpu.threads}
                    onChange={(e) => onCpuChange({ ...cpu, threads: parseInt(e.target.value) || 1 })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">基础频率(GHz)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={cpu.baseClock}
                    onChange={(e) => onCpuChange({ ...cpu, baseClock: parseFloat(e.target.value) || 1.0 })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">睿频(GHz)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="6.0"
                    value={cpu.boostClock}
                    onChange={(e) => onCpuChange({ ...cpu, boostClock: parseFloat(e.target.value) || 1.0 })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cpu.hyperThreading}
                      onChange={(e) => onCpuChange({ ...cpu, hyperThreading: e.target.checked })}
                      disabled={locked}
                      className={`w-4 h-4 rounded ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <span className="text-sm text-theme-text">开启超线程</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="border-b border-primary/10">
            <button
              onClick={() => setExpandedSection('memory')}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-theme-text">内存配置</span>
              </div>
              {expandedSection === 'memory' ? (
                <ChevronUp className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              )}
            </button>
            {expandedSection === 'memory' && (
              <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">内存大小</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={maxMemoryLimit ? Math.min(512, maxMemoryLimit) : 512}
                      max={maxMemoryLimit || 1024 * 1024}
                      value={memory.sizeMB}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 512;
                        const limitedVal = maxMemoryLimit ? Math.min(val, maxMemoryLimit) : val;
                        onMemoryChange({ ...memory, sizeMB: limitedVal });
                      }}
                      disabled={locked}
                      className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">MB</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">内存类型</label>
                  <select
                    value={memory.type}
                    onChange={(e) => onMemoryChange({ ...memory, type: e.target.value as typeof memory.type })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {memoryTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">频率(MHz)</label>
                  <select
                    value={memory.frequency}
                    onChange={(e) => onMemoryChange({ ...memory, frequency: parseInt(e.target.value) })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {memoryFrequencies.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">通道数</label>
                  <select
                    value={memory.channels}
                    onChange={(e) => onMemoryChange({ ...memory, channels: parseInt(e.target.value) })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value={1}>单通道</option>
                    <option value={2}>双通道</option>
                    <option value={4}>四通道</option>
                    <option value={8}>八通道</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted mb-1">虚拟内存大小</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="65536"
                      value={memory.virtualMemoryMB}
                      onChange={(e) => onMemoryChange({ ...memory, virtualMemoryMB: parseInt(e.target.value) || 0 })}
                      disabled={locked}
                      className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">MB (0=系统管理)</span>
                  </div>
                </div>
                {maxMemoryLimit && (
                  <div className="col-span-2 text-xs text-red-500">
                    ⚠️ 当前系统限制最大内存: {maxMemoryLimit}MB
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-b border-primary/10">
            <button
              onClick={() => setExpandedSection('disk')}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-theme-text">硬盘配置</span>
                <span className="text-xs text-text-muted">({disks.length}/8块)</span>
              </div>
              {expandedSection === 'disk' ? (
                <ChevronUp className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              )}
            </button>
            {expandedSection === 'disk' && (
              <div className="px-4 pb-4 space-y-3">
                {disks.map((disk, index) => (
                  <div key={disk.id} className="border border-primary/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-theme-text">硬盘 {index + 1}</span>
                      {disks.length > 1 && (
                        <button
                          onClick={() => removeDisk(disk.id)}
                          disabled={locked}
                          className={`p-1 rounded hover:bg-red-50 text-red-500 transition-colors ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">类型</label>
                        <select
                          value={disk.type}
                          onChange={(e) => onDisksChange(disks.map(d => d.id === disk.id ? { ...d, type: e.target.value as 'HDD' | 'SSD' | 'NVMe' } : d))}
                          disabled={locked}
                          className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="HDD">HDD</option>
                          <option value="SSD">SSD</option>
                          <option value="NVMe">NVMe</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">容量</label>
                        <input
                          type="number"
                          min="128"
                          max="8192"
                          value={disk.capacityGB}
                          onChange={(e) => onDisksChange(disks.map(d => d.id === disk.id ? { ...d, capacityGB: parseInt(e.target.value) || 128 } : d))}
                          disabled={locked}
                          className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <span className="text-xs text-text-muted">GB</span>
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">接口</label>
                        <select
                          value={disk.interface}
                          onChange={(e) => onDisksChange(disks.map(d => d.id === disk.id ? { ...d, interface: e.target.value as typeof disk.interface } : d))}
                          disabled={locked}
                          className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="SATA III">SATA III</option>
                          <option value="PCIe 3.0 x4">PCIe 3.0 x4</option>
                          <option value="PCIe 4.0 x4">PCIe 4.0 x4</option>
                          <option value="PCIe 5.0 x4">PCIe 5.0 x4</option>
                        </select>
                      </div>
                      {disk.type === 'HDD' && (
                        <div>
                          <label className="block text-xs text-text-muted mb-1">转速</label>
                          <select
                            value={disk.rpm}
                            onChange={(e) => onDisksChange(disks.map(d => d.id === disk.id ? { ...d, rpm: parseInt(e.target.value) || 7200 } : d))}
                            disabled={locked}
                            className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <option value={5400}>5400 RPM</option>
                            <option value={7200}>7200 RPM</option>
                            <option value={10000}>10000 RPM</option>
                            <option value={15000}>15000 RPM</option>
                          </select>
                        </div>
                      )}
                      {disk.type !== 'HDD' && (
                        <div>
                          <label className="block text-xs text-text-muted mb-1">IOPS</label>
                          <input
                            type="number"
                            min="100"
                            max="1000000"
                            value={disk.iops}
                            onChange={(e) => onDisksChange(disks.map(d => d.id === disk.id ? { ...d, iops: parseInt(e.target.value) || 500 } : d))}
                            disabled={locked}
                            className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-text-muted mb-1">分区</label>
                        <select
                          value={disk.partitionStyle}
                          onChange={(e) => onDisksChange(disks.map(d => d.id === disk.id ? { ...d, partitionStyle: e.target.value as 'MBR' | 'GPT' } : d))}
                          disabled={locked}
                          className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="MBR">MBR</option>
                          <option value="GPT">GPT</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={disk.hasBadSectors}
                            onChange={(e) => onDisksChange(disks.map(d => d.id === disk.id ? { ...d, hasBadSectors: e.target.checked } : d))}
                            disabled={locked}
                            className={`w-3 h-3 rounded ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <span className="text-xs text-theme-text">坏道</span>
                        </label>
                        {disk.hasBadSectors && (
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={disk.badSectorCount}
                            onChange={(e) => onDisksChange(disks.map(d => d.id === disk.id ? { ...d, badSectorCount: parseInt(e.target.value) || 1 } : d))}
                            disabled={locked}
                            className={`w-16 px-2 py-1 bg-white border border-primary/20 rounded text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {disks.length < 8 && (
                  <button
                    onClick={addDisk}
                    disabled={locked}
                    className={`w-full flex items-center justify-center gap-2 py-2 border border-dashed border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">添加硬盘</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-b border-primary/10">
            <button
              onClick={() => setExpandedSection('gpu')}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-theme-text">显卡配置</span>
              </div>
              {expandedSection === 'gpu' ? (
                <ChevronUp className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              )}
            </button>
            {expandedSection === 'gpu' && (
              <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">类型</label>
                  <select
                    value={gpu.type}
                    onChange={(e) => onGpuChange({ ...gpu, type: e.target.value as 'integrated' | 'NVIDIA' | 'AMD' })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="integrated">核显</option>
                    <option value="NVIDIA">NVIDIA</option>
                    <option value="AMD">AMD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">型号</label>
                  <select
                    value={gpu.model}
                    onChange={(e) => onGpuChange({ ...gpu, model: e.target.value })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {gpuModels[gpu.type].map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">显存</label>
                  <select
                    value={gpu.vramGB}
                    onChange={(e) => onGpuChange({ ...gpu, vramGB: parseInt(e.target.value) })}
                    disabled={locked}
                    className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value={1}>1GB</option>
                    <option value={2}>2GB</option>
                    <option value={4}>4GB</option>
                    <option value={6}>6GB</option>
                    <option value={8}>8GB</option>
                    <option value={12}>12GB</option>
                    <option value={16}>16GB</option>
                    <option value={24}>24GB</option>
                    <option value={48}>48GB</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setExpandedSection('network')}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Network className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-theme-text">网络配置</span>
                <span className="text-xs text-text-muted">({networks.length}/4块)</span>
              </div>
              {expandedSection === 'network' ? (
                <ChevronUp className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              )}
            </button>
            {expandedSection === 'network' && (
              <div className="px-4 pb-4 space-y-3">
                {networks.map((net) => (
                  <div key={net.id} className="border border-primary/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-theme-text">{net.name}</span>
                      {networks.length > 1 && (
                        <button
                          onClick={() => removeNetwork(net.id)}
                          disabled={locked}
                          className={`p-1 rounded hover:bg-red-50 text-red-500 transition-colors ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">速率</label>
                        <select
                          value={net.speed}
                          onChange={(e) => onNetworksChange(networks.map(n => n.id === net.id ? { ...n, speed: e.target.value as '100Mbps' | '1Gbps' | '10Gbps' } : n))}
                          disabled={locked}
                          className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="100Mbps">100Mbps</option>
                          <option value="1Gbps">1Gbps</option>
                          <option value="10Gbps">10Gbps</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">MAC地址</label>
                        <input
                          type="text"
                          value={net.mac}
                          onChange={(e) => onNetworksChange(networks.map(n => n.id === net.id ? { ...n, mac: e.target.value } : n))}
                          disabled={locked}
                          className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">延迟(ms)</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={net.latencyMs}
                          onChange={(e) => onNetworksChange(networks.map(n => n.id === net.id ? { ...n, latencyMs: parseInt(e.target.value) || 0 } : n))}
                          disabled={locked}
                          className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">丢包率(%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={net.packetLoss}
                          onChange={(e) => onNetworksChange(networks.map(n => n.id === net.id ? { ...n, packetLoss: parseFloat(e.target.value) || 0 } : n))}
                          disabled={locked}
                          className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {networks.length < 4 && (
                  <button
                    onClick={addNetwork}
                    disabled={locked}
                    className={`w-full flex items-center justify-center gap-2 py-2 border border-dashed border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">添加网卡</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}