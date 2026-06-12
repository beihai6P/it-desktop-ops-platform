import { useState } from 'react';
import { Unlock, Save, RotateCcw, Server } from 'lucide-react';
import SystemConfig from './SystemConfig';
import HardwareConfig from './HardwareConfig';
import DriverConfig from './DriverConfig';
import SoftwareConfig from './SoftwareConfig';
import LogUploader, { type ParsedLogData } from './LogUploader';
import FaultPanel, { generateInitialFaults, type Fault } from './FaultPanel';
import SimulationConsole from './SimulationConsole';
import AnalysisPanel from './AnalysisPanel';

interface OSConfig {
  family: 'desktop' | 'server';
  version: string;
  bit: '32' | '64';
  buildNumber: string;
  patchVersion: string;
  language: string;
  hostname: string;
  timezone: string;
  uacLevel: 'low' | 'medium' | 'high';
  tpmEnabled: boolean;
  secureBoot: boolean;
}

interface CPUConfig {
  brand: 'Intel' | 'AMD' | 'Apple';
  model: string;
  cores: number;
  threads: number;
  baseClock: number;
  boostClock: number;
  hyperThreading: boolean;
}

interface MemoryConfig {
  sizeMB: number;
  channels: number;
  type: 'DDR3' | 'DDR4' | 'DDR5' | 'LPDDR4' | 'LPDDR5';
  frequency: number;
  virtualMemoryMB: number;
}

interface DiskConfig {
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

interface GPUConfig {
  type: 'integrated' | 'NVIDIA' | 'AMD';
  model: string;
  vramGB: number;
}

interface NetworkConfig {
  id: string;
  name: string;
  speed: '100Mbps' | '1Gbps' | '10Gbps';
  mac: string;
  latencyMs: number;
  packetLoss: number;
}

interface DriverInfo {
  id: string;
  name: string;
  category: string;
  version: string;
  releaseDate: string;
  isFaulty: boolean;
  isLocked: boolean;
}

interface Software {
  id: string;
  name: string;
  category: string;
  version: string;
  bit: '32' | '64';
  installed: boolean;
}

const initialOSConfig: OSConfig = {
  family: 'desktop',
  version: 'Windows 10 Pro 22H2',
  bit: '64',
  buildNumber: '10.0.19045',
  patchVersion: '',
  language: '中文(简体)',
  hostname: 'WIN-TEST-001',
  timezone: 'UTC+8 北京',
  uacLevel: 'medium',
  tpmEnabled: false,
  secureBoot: false,
};

const initialCPU: CPUConfig = {
  brand: 'Intel',
  model: 'Core i5-12400',
  cores: 6,
  threads: 12,
  baseClock: 2.5,
  boostClock: 4.4,
  hyperThreading: true,
};

const initialMemory: MemoryConfig = {
  sizeMB: 8192,
  channels: 2,
  type: 'DDR4',
  frequency: 3200,
  virtualMemoryMB: 0,
};

const initialDisks: DiskConfig[] = [
  {
    id: 'disk-1',
    type: 'NVMe',
    capacityGB: 512,
    interface: 'PCIe 4.0 x4',
    rpm: null,
    partitionStyle: 'GPT',
    iops: 3000,
    hasBadSectors: false,
    badSectorCount: 0,
  },
];

const initialGPU: GPUConfig = {
  type: 'NVIDIA',
  model: 'GeForce RTX 3060',
  vramGB: 12,
};

const initialNetworks: NetworkConfig[] = [
  {
    id: 'net-1',
    name: '网卡 1',
    speed: '1Gbps',
    mac: '00:11:22:33:44:55',
    latencyMs: 10,
    packetLoss: 0,
  },
];

const initialDrivers: DriverInfo[] = [
  { id: 'chipset-1', name: 'Intel Chipset Driver', category: 'chipset', version: '10.1.1.45', releaseDate: '2024-01-15', isFaulty: false, isLocked: false },
  { id: 'chipset-2', name: 'AMD Chipset Driver', category: 'chipset', version: '5.0.2.24', releaseDate: '2024-01-10', isFaulty: false, isLocked: false },
  { id: 'chipset-3', name: 'NVIDIA nForce', category: 'chipset', version: '15.51', releaseDate: '2023-11-01', isFaulty: false, isLocked: false },
  { id: 'gpu-1', name: 'NVIDIA GeForce', category: 'gpu', version: '551.61', releaseDate: '2024-01-20', isFaulty: false, isLocked: false },
  { id: 'gpu-2', name: 'AMD Radeon', category: 'gpu', version: '23.9.3', releaseDate: '2023-09-20', isFaulty: false, isLocked: false },
  { id: 'gpu-3', name: 'Intel HD Graphics', category: 'gpu', version: '31.0.101.4502', releaseDate: '2024-01-18', isFaulty: false, isLocked: false },
  { id: 'network-1', name: 'Intel PRO/1000', category: 'network', version: '26.4', releaseDate: '2024-01-05', isFaulty: false, isLocked: false },
  { id: 'network-2', name: 'Realtek RTL8168', category: 'network', version: '10.66.03.2023', releaseDate: '2023-03-15', isFaulty: false, isLocked: false },
  { id: 'storage-1', name: 'Intel RST', category: 'storage', version: '19.5.0.1015', releaseDate: '2024-01-12', isFaulty: false, isLocked: false },
  { id: 'audio-1', name: 'Realtek HD Audio', category: 'audio', version: '6.0.9493.1', releaseDate: '2024-01-08', isFaulty: false, isLocked: false },
];

const initialSoftware: Software[] = [
  { id: 'vc2005', name: 'Microsoft Visual C++ 2005', category: 'runtime', version: '8.0.50727.42', bit: '32', installed: false },
  { id: 'vc2008', name: 'Microsoft Visual C++ 2008', category: 'runtime', version: '9.0.30729.4148', bit: '32', installed: false },
  { id: 'vc2010', name: 'Microsoft Visual C++ 2010', category: 'runtime', version: '10.0.40219.473', bit: '32', installed: false },
  { id: 'vc2015', name: 'Microsoft Visual C++ 2015-2022', category: 'runtime', version: '14.36.32532', bit: '64', installed: true },
  { id: 'dotnet48', name: '.NET Framework 4.8', category: 'runtime', version: '4.8.04084', bit: '64', installed: true },
  { id: 'java8', name: 'Java SE 8', category: 'runtime', version: '1.8.0_381', bit: '64', installed: false },
  { id: 'python311', name: 'Python 3.11', category: 'runtime', version: '3.11.5', bit: '64', installed: false },
  { id: 'mysql', name: 'MySQL', category: 'database', version: '8.0.35', bit: '64', installed: false },
  { id: 'sqlserver', name: 'SQL Server Express', category: 'database', version: '2022', bit: '64', installed: false },
  { id: 'redis', name: 'Redis', category: 'database', version: '7.2.3', bit: '64', installed: false },
  { id: 'iis', name: 'IIS', category: 'web', version: '10.0', bit: '64', installed: false },
  { id: 'nginx', name: 'Nginx', category: 'web', version: '1.25.3', bit: '64', installed: false },
  { id: 'nodejs', name: 'Node.js', category: 'web', version: '20.10.0', bit: '64', installed: true },
  { id: 'office2021', name: 'Microsoft Office 2021', category: 'office', version: '16.0.14332.20344', bit: '64', installed: false },
  { id: 'wps', name: 'WPS Office 2023', category: 'office', version: '11.1.0.16086', bit: '64', installed: false },
  { id: 'chrome', name: 'Google Chrome', category: 'office', version: '120.0.6099.130', bit: '64', installed: true },
  { id: 'firefox', name: 'Mozilla Firefox', category: 'office', version: '121.0', bit: '64', installed: false },
];

export default function IntegratedLab() {
  const [osConfig, setOsConfig] = useState<OSConfig>(initialOSConfig);
  const [cpu, setCpu] = useState<CPUConfig>(initialCPU);
  const [memory, setMemory] = useState<MemoryConfig>(initialMemory);
  const [disks, setDisks] = useState<DiskConfig[]>(initialDisks);
  const [gpu, setGpu] = useState<GPUConfig>(initialGPU);
  const [networks, setNetworks] = useState<NetworkConfig[]>(initialNetworks);
  const [drivers, setDrivers] = useState<DriverInfo[]>(initialDrivers);
  const [software, setSoftware] = useState<Software[]>(initialSoftware);
  const [faults, setFaults] = useState<Fault[]>(generateInitialFaults());
  const [locked, setLocked] = useState(false);
  const [isLogMode, setIsLogMode] = useState(false);
  const [environmentSource, setEnvironmentSource] = useState<'manual' | 'log'>('manual');

  const maxMemoryLimit = osConfig.version.includes('XP') && osConfig.bit === '32' ? 3250 : null;

  const handleLogParseComplete = (data: ParsedLogData) => {
    setOsConfig(prev => ({
      ...prev,
      version: data.osVersion,
      bit: data.osBit,
      buildNumber: data.buildNumber,
      hostname: data.hostname,
    }));

    const brand = data.cpuModel.includes('Intel') ? 'Intel' : data.cpuModel.includes('AMD') ? 'AMD' : 'Intel';
    setCpu(prev => ({
      ...prev,
      brand,
      model: data.cpuModel,
    }));

    setMemory(prev => ({
      ...prev,
      sizeMB: data.memorySizeMB,
    }));

    setDisks(data.diskInfo.map((d, i) => ({
      id: `disk-${i}`,
      type: d.type as 'HDD' | 'SSD' | 'NVMe',
      capacityGB: d.capacityGB,
      interface: d.type === 'NVMe' ? 'PCIe 4.0 x4' : 'SATA III',
      rpm: d.type === 'HDD' ? 7200 : null,
      partitionStyle: 'GPT',
      iops: d.type === 'NVMe' ? 3000 : d.type === 'SSD' ? 500 : 100,
      hasBadSectors: false,
      badSectorCount: 0,
    })));

    const gpuType = data.gpuModel.includes('NVIDIA') ? 'NVIDIA' : data.gpuModel.includes('AMD') ? 'AMD' : 'integrated';
    setGpu(prev => ({
      ...prev,
      type: gpuType,
      model: data.gpuModel,
    }));

    if (data.faultyDriver && data.driverVersion) {
      setDrivers(prev => prev.map(d => ({
        ...d,
        isLocked: d.name.includes(data.faultyDriver!),
        isFaulty: d.name.includes(data.faultyDriver!) && d.version === data.driverVersion,
        version: d.name.includes(data.faultyDriver!) ? data.driverVersion! : d.version,
      })));
    }

    setLocked(true);
    setIsLogMode(true);
    setEnvironmentSource('log');

    setFaults(prev => prev.map(f => ({
      ...f,
      selected: f.category === 'timeline',
    })));
  };

  const handleUnlock = () => {
    setLocked(false);
  };

  const handleReset = () => {
    setOsConfig(initialOSConfig);
    setCpu(initialCPU);
    setMemory(initialMemory);
    setDisks(initialDisks);
    setGpu(initialGPU);
    setNetworks(initialNetworks);
    setDrivers(initialDrivers);
    setSoftware(initialSoftware);
    setFaults(generateInitialFaults());
    setLocked(false);
    setIsLogMode(false);
    setEnvironmentSource('manual');
  };

  const handleSaveTemplate = () => {
    try {
      const template = {
        osConfig: { ...osConfig },
        cpu: { ...cpu },
        memory: { ...memory },
        disks: disks.map(d => ({ ...d })),
        gpu: { ...gpu },
        networks: networks.map(n => ({ ...n })),
        drivers: drivers.map(d => ({ ...d })),
        software: software.map(s => ({ ...s })),
      };
      localStorage.setItem('fault-lab-template', JSON.stringify(template));
      alert('环境模板已保存！');
    } catch (error) {
      console.error('保存环境模板失败:', error);
      alert(`保存环境模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-theme-bg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-text">一体化故障仿真实验室</h2>
            <p className="text-xs text-text-muted">全自定义复杂环境 + 日志逆向溯源复现</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LogUploader onParseComplete={handleLogParseComplete} />
          
          {locked && (
            <button
              onClick={handleUnlock}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Unlock className="w-4 h-4" />
              <span>解锁手动修改</span>
            </button>
          )}

          <button
            onClick={handleSaveTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-primary/20 rounded-lg text-theme-text hover:bg-primary/5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>保存环境模板</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-primary/20 rounded-lg text-theme-text hover:bg-primary/5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置空白环境</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">
        <div className="col-span-4 overflow-y-auto space-y-4 min-h-0">
          <SystemConfig config={osConfig} onChange={setOsConfig} locked={locked} />
          <HardwareConfig
            cpu={cpu}
            memory={memory}
            disks={disks}
            gpu={gpu}
            networks={networks}
            onCpuChange={setCpu}
            onMemoryChange={setMemory}
            onDisksChange={setDisks}
            onGpuChange={setGpu}
            onNetworksChange={setNetworks}
            locked={locked}
            maxMemoryLimit={maxMemoryLimit}
          />
          <DriverConfig drivers={drivers} onDriversChange={setDrivers} locked={locked} />
          <SoftwareConfig software={software} onSoftwareChange={setSoftware} locked={locked} />
        </div>

        <div className="col-span-3 border border-primary/20 rounded-xl overflow-hidden min-h-0">
          <FaultPanel
            faults={faults}
            onFaultsChange={setFaults}
            osVersion={osConfig.version}
            isLogMode={isLogMode}
          />
        </div>

        <div className="col-span-5 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <SimulationConsole
              isLogMode={isLogMode}
              environmentSource={environmentSource}
              productionLogs={[]}
              sandboxLogs={[]}
            />
          </div>
          <div className="flex-1 min-h-0">
            <AnalysisPanel
              osConfig={osConfig}
              cpu={cpu}
              memory={memory}
              disks={disks}
              gpu={gpu}
              networks={networks}
              drivers={drivers}
              software={software}
            />
          </div>
        </div>
      </div>
    </div>
  );
}