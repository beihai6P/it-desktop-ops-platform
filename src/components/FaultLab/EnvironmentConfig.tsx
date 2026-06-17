import { useState } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Monitor, 
  Database, 
  CheckCircle, 
  XCircle,
  Settings,
  Activity,
  Network,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface OSConfig {
  family: 'Windows' | 'Linux' | 'macOS';
  version: string;
  bit: '32' | '64';
  buildNumber?: string;
}

interface CPUConfig {
  brand: string;
  model: string;
  cores: number;
  threads: number;
  baseClock: string;
  boostClock: string;
}

interface MemoryConfig {
  sizeGB: number;
  type: string;
  speedMHz: number;
  slots: number;
}

interface StorageConfig {
  type: 'HDD' | 'SSD' | 'NVMe';
  sizeGB: number;
  interfaceType: string;
  rpm?: number;
}

interface GPUConfig {
  brand: string;
  model: string;
  vramGB: number;
  driverVersion: string;
}

interface NetworkConfig {
  adapter: string;
  ipAddress: string;
  subnet: string;
  gateway: string;
  dns: string;
}

interface SoftwareItem {
  id: string;
  name: string;
  version: string;
  installed: boolean;
  category: string;
}

const osFamilies = [
  { value: 'Windows', label: 'Windows' },
  { value: 'Linux', label: 'Linux' },
  { value: 'macOS', label: 'macOS' },
];

const osVersions: Record<string, { version: string; build?: string }[]> = {
  Windows: [
    { version: 'Windows XP', build: '5.1.2600' },
    { version: 'Windows Vista', build: '6.0.6002' },
    { version: 'Windows 7', build: '6.1.7601' },
    { version: 'Windows 8', build: '6.2.9200' },
    { version: 'Windows 8.1', build: '6.3.9600' },
    { version: 'Windows 10', build: '10.0.19045' },
    { version: 'Windows 11', build: '10.0.22621' },
  ],
  Linux: [
    { version: 'Ubuntu 18.04 LTS', build: 'Bionic Beaver' },
    { version: 'Ubuntu 20.04 LTS', build: 'Focal Fossa' },
    { version: 'Ubuntu 22.04 LTS', build: 'Jammy Jellyfish' },
    { version: 'CentOS 7', build: 'Core' },
    { version: 'CentOS 8', build: 'Stream' },
    { version: 'Debian 10', build: 'Buster' },
    { version: 'Debian 11', build: 'Bullseye' },
    { version: 'Fedora 38', build: '' },
  ],
  macOS: [
    { version: 'macOS Big Sur', build: '11.7.10' },
    { version: 'macOS Monterey', build: '12.7.2' },
    { version: 'macOS Ventura', build: '13.6.3' },
    { version: 'macOS Sonoma', build: '14.2.1' },
    { version: 'macOS Sequoia', build: '15.0' },
  ],
};

const cpuBrands = ['Intel', 'AMD', 'Apple'];

const cpuModels: Record<string, { model: string; cores: number; threads: number; base: string; boost: string }[]> = {
  Intel: [
    { model: 'Core i3-12100', cores: 4, threads: 8, base: '3.3 GHz', boost: '4.3 GHz' },
    { model: 'Core i5-12400', cores: 6, threads: 12, base: '2.5 GHz', boost: '4.4 GHz' },
    { model: 'Core i7-12700', cores: 12, threads: 20, base: '2.1 GHz', boost: '4.9 GHz' },
    { model: 'Core i9-12900K', cores: 16, threads: 24, base: '3.2 GHz', boost: '5.2 GHz' },
    { model: 'Xeon E5-2690 v4', cores: 14, threads: 28, base: '2.6 GHz', boost: '3.5 GHz' },
  ],
  AMD: [
    { model: 'Ryzen 5 5600', cores: 6, threads: 12, base: '3.5 GHz', boost: '4.6 GHz' },
    { model: 'Ryzen 7 5800X', cores: 8, threads: 16, base: '3.8 GHz', boost: '4.7 GHz' },
    { model: 'Ryzen 9 5900X', cores: 12, threads: 24, base: '3.7 GHz', boost: '4.8 GHz' },
    { model: 'Threadripper 3990X', cores: 64, threads: 128, base: '2.9 GHz', boost: '4.3 GHz' },
  ],
  Apple: [
    { model: 'Apple M1', cores: 8, threads: 8, base: '3.2 GHz', boost: '3.2 GHz' },
    { model: 'Apple M2', cores: 8, threads: 10, base: '3.49 GHz', boost: '3.49 GHz' },
    { model: 'Apple M2 Pro', cores: 12, threads: 16, base: '3.2 GHz', boost: '3.7 GHz' },
  ],
};

const memoryTypes = ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5'];
const memorySizes = [2, 4, 8, 16, 32, 64, 128, 256];
const memorySpeeds = [1333, 1600, 2133, 2400, 2666, 3000, 3200, 3600, 4000, 4800];

const storageTypes = [
  { value: 'HDD', label: 'HDD (机械硬盘)' },
  { value: 'SSD', label: 'SSD (固态硬盘)' },
  { value: 'NVMe', label: 'NVMe (高速固态)' },
];

const storageInterfaces = ['SATA III', 'PCIe 3.0 x4', 'PCIe 4.0 x4', 'PCIe 5.0 x4'];
const storageSizes = [128, 256, 512, 1000, 2000, 4000, 8000];
const hddRpms = [5400, 7200, 10000, 15000];

const gpuBrands = ['NVIDIA', 'AMD', 'Intel', 'Apple'];

const gpuModels: Record<string, { model: string; vram: number; driver: string }[]> = {
  NVIDIA: [
    { model: 'GeForce RTX 3060', vram: 12, driver: '546.29' },
    { model: 'GeForce RTX 3080', vram: 10, driver: '546.29' },
    { model: 'GeForce RTX 4070', vram: 12, driver: '546.29' },
    { model: 'GeForce RTX 4090', vram: 24, driver: '546.29' },
    { model: 'Quadro RTX A4000', vram: 16, driver: '546.17' },
  ],
  AMD: [
    { model: 'Radeon RX 6600 XT', vram: 8, driver: '23.12.1' },
    { model: 'Radeon RX 6800 XT', vram: 16, driver: '23.12.1' },
    { model: 'Radeon RX 7800 XT', vram: 16, driver: '23.12.1' },
    { model: 'Radeon Pro WX 7100', vram: 8, driver: '22.40.03.01' },
  ],
  Intel: [
    { model: 'UHD Graphics 770', vram: 1, driver: '31.0.101.4502' },
    { model: 'Iris Xe Graphics', vram: 3, driver: '31.0.101.4502' },
  ],
  Apple: [
    { model: 'Apple M1 GPU', vram: 8, driver: 'Built-in' },
    { model: 'Apple M2 GPU', vram: 10, driver: 'Built-in' },
  ],
};

const networkAdapters = [
  'Intel Ethernet Connection I219-V',
  'Realtek RTL8168/8111 PCI-E Gigabit Ethernet',
  'Broadcom NetXtreme Gigabit Ethernet',
  'Intel Wi-Fi 6 AX201',
  'Realtek RTL8822CE 802.11ac PCIe Adapter',
  'Apple AirPort Extreme',
];

const softwareCategories = ['办公软件', '开发工具', '数据库', '浏览器', '安全软件', '多媒体', '系统工具'];

const softwareList: SoftwareItem[] = [
  { id: 'office', name: 'Microsoft Office', version: '2021', installed: true, category: '办公软件' },
  { id: 'wps', name: 'WPS Office', version: '2023', installed: false, category: '办公软件' },
  { id: 'vs', name: 'Visual Studio', version: '2022', installed: true, category: '开发工具' },
  { id: 'vscode', name: 'VS Code', version: '1.85', installed: true, category: '开发工具' },
  { id: 'git', name: 'Git', version: '2.43', installed: true, category: '开发工具' },
  { id: 'node', name: 'Node.js', version: '20.10', installed: true, category: '开发工具' },
  { id: 'python', name: 'Python', version: '3.12', installed: false, category: '开发工具' },
  { id: 'mysql', name: 'MySQL', version: '8.0', installed: true, category: '数据库' },
  { id: 'postgresql', name: 'PostgreSQL', version: '16', installed: false, category: '数据库' },
  { id: 'redis', name: 'Redis', version: '7.2', installed: true, category: '数据库' },
  { id: 'chrome', name: 'Google Chrome', version: '120', installed: true, category: '浏览器' },
  { id: 'edge', name: 'Microsoft Edge', version: '120', installed: true, category: '浏览器' },
  { id: 'firefox', name: 'Mozilla Firefox', version: '121', installed: false, category: '浏览器' },
  { id: 'defender', name: 'Windows Defender', version: '10.81', installed: true, category: '安全软件' },
  { id: 'avg', name: 'AVG Antivirus', version: '23.11', installed: false, category: '安全软件' },
  { id: 'vlc', name: 'VLC Media Player', version: '3.0.20', installed: true, category: '多媒体' },
  { id: 'photoshop', name: 'Adobe Photoshop', version: '2024', installed: false, category: '多媒体' },
  { id: 'notepad', name: 'Notepad++', version: '8.6', installed: true, category: '系统工具' },
  { id: '7zip', name: '7-Zip', version: '23.01', installed: true, category: '系统工具' },
  { id: 'putty', name: 'PuTTY', version: '0.78', installed: false, category: '系统工具' },
];

export default function EnvironmentConfig() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    os: true,
    cpu: true,
    memory: true,
    storage: true,
    gpu: true,
    network: true,
    software: true,
  });

  const [osConfig, setOsConfig] = useState<OSConfig>({
    family: 'Windows',
    version: 'Windows 10',
    bit: '64',
    buildNumber: '10.0.19045',
  });

  const [cpuConfig, setCpuConfig] = useState<CPUConfig>({
    brand: 'Intel',
    model: 'Core i5-12400',
    cores: 6,
    threads: 12,
    baseClock: '2.5 GHz',
    boostClock: '4.4 GHz',
  });

  const [memoryConfig, setMemoryConfig] = useState<MemoryConfig>({
    sizeGB: 16,
    type: 'DDR4',
    speedMHz: 3200,
    slots: 2,
  });

  const [storageConfig, setStorageConfig] = useState<StorageConfig>({
    type: 'NVMe',
    sizeGB: 1000,
    interfaceType: 'PCIe 4.0 x4',
  });

  const [gpuConfig, setGpuConfig] = useState<GPUConfig>({
    brand: 'NVIDIA',
    model: 'GeForce RTX 3060',
    vramGB: 12,
    driverVersion: '546.29',
  });

  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>({
    adapter: 'Intel Ethernet Connection I219-V',
    ipAddress: '192.168.1.100',
    subnet: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: '8.8.8.8',
  });

  const [softwareItems, setSoftwareItems] = useState<SoftwareItem[]>(softwareList);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleOSFamilyChange = (family: 'Windows' | 'Linux' | 'macOS') => {
    const versions = osVersions[family];
    setOsConfig(prev => ({
      ...prev,
      family,
      version: versions[0].version,
      buildNumber: versions[0].build || undefined,
    }));
  };

  const handleOSVersionChange = (version: string) => {
    const versions = osVersions[osConfig.family];
    const selected = versions.find(v => v.version === version);
    setOsConfig(prev => ({
      ...prev,
      version,
      buildNumber: selected?.build || undefined,
    }));
  };

  const handleCPUBrandChange = (brand: string) => {
    const models = cpuModels[brand];
    const selected = models[0];
    setCpuConfig({
      brand,
      model: selected.model,
      cores: selected.cores,
      threads: selected.threads,
      baseClock: selected.base,
      boostClock: selected.boost,
    });
  };

  const handleCPUModelChange = (model: string) => {
    const models = cpuModels[cpuConfig.brand];
    const selected = models.find(m => m.model === model);
    if (selected) {
      setCpuConfig(prev => ({
        ...prev,
        model,
        cores: selected.cores,
        threads: selected.threads,
        baseClock: selected.base,
        boostClock: selected.boost,
      }));
    }
  };

  const handleGPUBrandChange = (brand: string) => {
    const models = gpuModels[brand];
    const selected = models[0];
    setGpuConfig({
      brand,
      model: selected.model,
      vramGB: selected.vram,
      driverVersion: selected.driver,
    });
  };

  const handleGPUModelChange = (model: string) => {
    const models = gpuModels[gpuConfig.brand];
    const selected = models.find(m => m.model === model);
    if (selected) {
      setGpuConfig(prev => ({
        ...prev,
        model,
        vramGB: selected.vram,
        driverVersion: selected.driver,
      }));
    }
  };

  const toggleSoftware = (id: string) => {
    setSoftwareItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, installed: !item.installed } : item
      )
    );
  };

  const SectionHeader = ({ title, icon: Icon, sectionId }: { title: string; icon: typeof Server; sectionId: string }) => (
    <button
      onClick={() => toggleSection(sectionId)}
      className="w-full flex items-center justify-between p-4 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="font-semibold text-theme-text">{title}</span>
      </div>
      {expandedSections[sectionId] ? (
        <ChevronUp className="w-5 h-5 text-text-muted" />
      ) : (
        <ChevronDown className="w-5 h-5 text-text-muted" />
      )}
    </button>
  );

  const installedCount = softwareItems.filter(s => s.installed).length;

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-theme-text">系统环境配置</h3>
            <p className="text-sm text-text-muted">自定义硬件和软件环境</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-muted">已安装软件</span>
          <span className="px-3 py-1 bg-primary text-white rounded-full font-medium">
            {installedCount}/{softwareItems.length}
          </span>
        </div>
      </div>

      <SectionHeader title="操作系统" icon={Server} sectionId="os" />
      {expandedSections.os && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-xl">
          <div>
            <label className="block text-xs text-text-muted mb-1">操作系统家族</label>
            <select
              value={osConfig.family}
              onChange={(e) => handleOSFamilyChange(e.target.value as 'Windows' | 'Linux' | 'macOS')}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {osFamilies.map(os => (
                <option key={os.value} value={os.value}>{os.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">系统版本</label>
            <select
              value={osConfig.version}
              onChange={(e) => handleOSVersionChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {osVersions[osConfig.family].map(os => (
                <option key={os.version} value={os.version}>{os.version}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">位数</label>
            <select
              value={osConfig.bit}
              onChange={(e) => setOsConfig(prev => ({ ...prev, bit: e.target.value as '32' | '64' }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              <option value="32">32位</option>
              <option value="64">64位</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Build版本</label>
            <input
              type="text"
              value={osConfig.buildNumber || ''}
              onChange={(e) => setOsConfig(prev => ({ ...prev, buildNumber: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              placeholder="Build号"
            />
          </div>
        </div>
      )}

      <SectionHeader title="CPU配置" icon={Cpu} sectionId="cpu" />
      {expandedSections.cpu && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50/50 rounded-xl">
          <div>
            <label className="block text-xs text-text-muted mb-1">品牌</label>
            <select
              value={cpuConfig.brand}
              onChange={(e) => handleCPUBrandChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {cpuBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">型号</label>
            <select
              value={cpuConfig.model}
              onChange={(e) => handleCPUModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {cpuModels[cpuConfig.brand].map(model => (
                <option key={model.model} value={model.model}>{model.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">核心数</label>
            <input
              type="number"
              value={cpuConfig.cores}
              onChange={(e) => setCpuConfig(prev => ({ ...prev, cores: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              min="1"
              max="128"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">线程数</label>
            <input
              type="number"
              value={cpuConfig.threads}
              onChange={(e) => setCpuConfig(prev => ({ ...prev, threads: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              min="1"
              max="256"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">基础频率</label>
            <input
              type="text"
              value={cpuConfig.baseClock}
              onChange={(e) => setCpuConfig(prev => ({ ...prev, baseClock: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">睿频频率</label>
            <input
              type="text"
              value={cpuConfig.boostClock}
              onChange={(e) => setCpuConfig(prev => ({ ...prev, boostClock: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
        </div>
      )}

      <SectionHeader title="内存配置" icon={Activity} sectionId="memory" />
      {expandedSections.memory && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-xl">
          <div>
            <label className="block text-xs text-text-muted mb-1">内存大小</label>
            <select
              value={memoryConfig.sizeGB}
              onChange={(e) => setMemoryConfig(prev => ({ ...prev, sizeGB: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {memorySizes.map(size => (
                <option key={size} value={size}>{size} GB</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">内存类型</label>
            <select
              value={memoryConfig.type}
              onChange={(e) => setMemoryConfig(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {memoryTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">频率</label>
            <select
              value={memoryConfig.speedMHz}
              onChange={(e) => setMemoryConfig(prev => ({ ...prev, speedMHz: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {memorySpeeds.map(speed => (
                <option key={speed} value={speed}>{speed} MHz</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">插槽数</label>
            <input
              type="number"
              value={memoryConfig.slots}
              onChange={(e) => setMemoryConfig(prev => ({ ...prev, slots: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              min="1"
              max="8"
            />
          </div>
        </div>
      )}

      <SectionHeader title="存储配置" icon={HardDrive} sectionId="storage" />
      {expandedSections.storage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-xl">
          <div>
            <label className="block text-xs text-text-muted mb-1">存储类型</label>
            <select
              value={storageConfig.type}
              onChange={(e) => {
                const type = e.target.value as 'HDD' | 'SSD' | 'NVMe';
                setStorageConfig(prev => ({
                  ...prev,
                  type,
                  rpm: type === 'HDD' ? 7200 : undefined,
                }));
              }}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {storageTypes.map(storage => (
                <option key={storage.value} value={storage.value}>{storage.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">容量</label>
            <select
              value={storageConfig.sizeGB}
              onChange={(e) => setStorageConfig(prev => ({ ...prev, sizeGB: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {storageSizes.map(size => (
                <option key={size} value={size}>{size} GB</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">接口类型</label>
            <select
              value={storageConfig.interfaceType}
              onChange={(e) => setStorageConfig(prev => ({ ...prev, interfaceType: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {storageInterfaces.map(iface => (
                <option key={iface} value={iface}>{iface}</option>
              ))}
            </select>
          </div>
          {storageConfig.type === 'HDD' && (
            <div>
              <label className="block text-xs text-text-muted mb-1">转速</label>
              <select
                value={storageConfig.rpm}
                onChange={(e) => setStorageConfig(prev => ({ ...prev, rpm: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                {hddRpms.map(rpm => (
                  <option key={rpm} value={rpm}>{rpm} RPM</option>
                ))}
              </select>
            </div>
          )}
          {storageConfig.type !== 'HDD' && (
            <div className="flex items-center justify-center text-text-muted text-sm">
              SSD/NVMe无转速参数
            </div>
          )}
        </div>
      )}

      <SectionHeader title="显卡配置" icon={Monitor} sectionId="gpu" />
      {expandedSections.gpu && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-xl">
          <div>
            <label className="block text-xs text-text-muted mb-1">品牌</label>
            <select
              value={gpuConfig.brand}
              onChange={(e) => handleGPUBrandChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {gpuBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">型号</label>
            <select
              value={gpuConfig.model}
              onChange={(e) => handleGPUModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {gpuModels[gpuConfig.brand].map(model => (
                <option key={model.model} value={model.model}>{model.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">显存容量</label>
            <input
              type="number"
              value={gpuConfig.vramGB}
              onChange={(e) => setGpuConfig(prev => ({ ...prev, vramGB: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              min="1"
              max="48"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">驱动版本</label>
            <input
              type="text"
              value={gpuConfig.driverVersion}
              onChange={(e) => setGpuConfig(prev => ({ ...prev, driverVersion: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
        </div>
      )}

      <SectionHeader title="网络配置" icon={Network} sectionId="network" />
      {expandedSections.network && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50/50 rounded-xl">
          <div>
            <label className="block text-xs text-text-muted mb-1">网络适配器</label>
            <select
              value={networkConfig.adapter}
              onChange={(e) => setNetworkConfig(prev => ({ ...prev, adapter: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {networkAdapters.map(adapter => (
                <option key={adapter} value={adapter}>{adapter}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">IP地址</label>
            <input
              type="text"
              value={networkConfig.ipAddress}
              onChange={(e) => setNetworkConfig(prev => ({ ...prev, ipAddress: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">子网掩码</label>
            <input
              type="text"
              value={networkConfig.subnet}
              onChange={(e) => setNetworkConfig(prev => ({ ...prev, subnet: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">网关</label>
            <input
              type="text"
              value={networkConfig.gateway}
              onChange={(e) => setNetworkConfig(prev => ({ ...prev, gateway: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">DNS服务器</label>
            <input
              type="text"
              value={networkConfig.dns}
              onChange={(e) => setNetworkConfig(prev => ({ ...prev, dns: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
        </div>
      )}

      <SectionHeader title="软件列表" icon={Database} sectionId="software" />
      {expandedSections.software && (
        <div className="p-4 bg-gray-50/50 rounded-xl">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {softwareCategories.map(category => (
              <button
                key={category}
                className="px-3 py-1.5 bg-white border border-primary/20 rounded-full text-xs font-medium text-theme-text hover:bg-primary/5 transition-colors whitespace-nowrap"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {softwareItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggleSoftware(item.id)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  item.installed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-primary/20 hover:border-primary/40'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-theme-text">{item.name}</p>
                  <p className="text-xs text-text-muted">v{item.version}</p>
                </div>
                {item.installed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" />
          保存配置
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors">
          <Minus className="w-4 h-4" />
          重置配置
        </button>
      </div>
    </div>
  );
}