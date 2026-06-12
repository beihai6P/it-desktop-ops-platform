import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, AlertTriangle, Lock, Unlock } from 'lucide-react';

export interface DriverInfo {
  id: string;
  name: string;
  category: string;
  version: string;
  releaseDate: string;
  isFaulty: boolean;
  isLocked: boolean;
}

interface DriverConfigProps {
  drivers: DriverInfo[];
  onDriversChange: (drivers: DriverInfo[]) => void;
  locked: boolean;
}

const driverCategories = [
  {
    id: 'chipset',
    name: '芯片组驱动',
    drivers: [
      { name: 'Intel Chipset Driver', versions: ['10.1.1.45', '10.1.1.44', '10.1.1.43', '10.1.1.42', '10.0.27'] },
      { name: 'AMD Chipset Driver', versions: ['5.0.2.24', '5.0.1.31', '4.11.0.35', '4.10.0.33', '4.9.0.31'] },
      { name: 'NVIDIA nForce', versions: ['15.51', '15.49', '15.45', '15.41', '15.37'] },
    ],
  },
  {
    id: 'gpu',
    name: '显卡驱动',
    drivers: [
      { name: 'NVIDIA GeForce', versions: ['551.61', '546.33', '537.42', '536.99', '531.79', '528.49', '472.12', '457.30', '431.60'] },
      { name: 'AMD Radeon', versions: ['23.9.3', '23.8.2', '23.7.1', '23.5.2', '23.4.1', '22.11.1', '22.5.1', '21.12.1'] },
      { name: 'Intel HD Graphics', versions: ['31.0.101.4502', '31.0.101.4146', '31.0.101.3879', '27.20.100.9664', '26.20.100.7262'] },
    ],
  },
  {
    id: 'network',
    name: '网卡驱动',
    drivers: [
      { name: 'Intel PRO/1000', versions: ['26.4', '26.2', '25.1', '24.3', '23.5'] },
      { name: 'Realtek RTL8168', versions: ['10.66.03.2023', '10.59.03.2022', '10.39.03.2021', '10.29.03.2020'] },
      { name: 'Broadcom NetXtreme', versions: ['21.12.1', '21.8.1', '21.5.1', '20.10.1'] },
    ],
  },
  {
    id: 'storage',
    name: '磁盘控制器驱动',
    drivers: [
      { name: 'Intel RST', versions: ['19.5.0.1015', '19.2.0.1006', '18.8.0.1016', '18.5.0.1014', '17.9.0.1007'] },
      { name: 'AMD RAID', versions: ['9.3.0.224', '9.2.0.1030', '9.1.0.1025', '8.9.0.1023'] },
      { name: 'NVIDIA Storage', versions: ['6.14.12.3002', '6.12.12.3001', '6.10.12.3000'] },
    ],
  },
  {
    id: 'audio',
    name: '音频驱动',
    drivers: [
      { name: 'Realtek HD Audio', versions: ['6.0.9493.1', '6.0.9415.1', '6.0.9383.1', '6.0.9295.1', '6.0.9147.1'] },
      { name: 'Intel HD Audio', versions: ['10.29.0.1005', '10.28.0.1001', '10.27.0.1003', '10.26.0.1001'] },
      { name: 'NVIDIA HD Audio', versions: ['1.3.40.6', '1.3.40.3', '1.3.39.6', '1.3.38.7'] },
    ],
  },
  {
    id: 'peripheral',
    name: '外设驱动',
    drivers: [
      { name: 'HP Universal Print', versions: ['6.5.0.2312', '6.4.0.2208', '6.3.0.2105', '6.2.0.2003'] },
      { name: 'Epson Printer', versions: ['2.71.0', '2.69.0', '2.67.0', '2.65.0'] },
      { name: 'Wacom Tablet', versions: ['6.4.1-3', '6.4.0-8', '6.3.46-2', '6.3.45-1'] },
    ],
  },
];

export default function DriverConfig({ drivers, onDriversChange, locked }: DriverConfigProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('chipset');

  const getAvailableVersions = (driverName: string) => {
    for (const category of driverCategories) {
      const driver = category.drivers.find(d => d.name === driverName);
      if (driver) return driver.versions;
    }
    return [];
  };

  const toggleDriverLock = (driverId: string) => {
    if (!locked) {
      onDriversChange(drivers.map(d => 
        d.id === driverId ? { ...d, isLocked: !d.isLocked } : d
      ));
    }
  };

  const updateDriverVersion = (driverId: string, version: string) => {
    if (!locked) {
      onDriversChange(drivers.map(d => 
        d.id === driverId ? { ...d, version, isFaulty: false } : d
      ));
    }
  };

  const toggleFaultyDriver = (driverId: string) => {
    if (!locked) {
      onDriversChange(drivers.map(d => 
        d.id === driverId ? { ...d, isFaulty: !d.isFaulty } : d
      ));
    }
  };

  const filteredDrivers = drivers.filter(d => d.category === selectedCategory);

  return (
    <div className="border border-primary/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-theme-bg hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-theme-text">驱动版本配置</h4>
            <p className="text-xs text-text-muted">支持老旧/异常驱动自选，制造驱动冲突</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="p-4">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {driverCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-white border border-primary/20 text-theme-text hover:bg-primary/5'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredDrivers.map(driver => (
              <div
                key={driver.id}
                className={`border rounded-lg p-3 transition-all ${
                  driver.isFaulty 
                    ? 'border-red-300 bg-red-50' 
                    : driver.isLocked 
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-primary/10 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-theme-text">{driver.name}</span>
                    {driver.isFaulty && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        故障驱动
                      </span>
                    )}
                    {driver.isLocked && !driver.isFaulty && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        日志锁定
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleDriverLock(driver.id)}
                    disabled={locked}
                    className={`p-1 rounded hover:bg-primary/10 transition-colors ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {driver.isLocked ? (
                      <Unlock className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">版本选择</label>
                    <select
                      value={driver.version}
                      onChange={(e) => updateDriverVersion(driver.id, e.target.value)}
                      disabled={locked || driver.isLocked}
                      className={`w-full px-2 py-1.5 bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs ${
                        (locked || driver.isLocked) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {getAvailableVersions(driver.name).map(version => (
                        <option key={version} value={version}>{version}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted mb-1">发布日期</label>
                    <input
                      type="text"
                      value={driver.releaseDate}
                      disabled
                      className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded text-xs text-text-muted"
                    />
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => toggleFaultyDriver(driver.id)}
                      disabled={locked || driver.isLocked}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        driver.isFaulty
                          ? 'bg-red-500 text-white'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      } ${(locked || driver.isLocked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {driver.isFaulty ? '恢复正常' : '安装损坏驱动'}
                    </button>
                  </div>
                </div>

                {driver.isFaulty && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-600">
                    ⚠️ 此驱动已标记为损坏，仿真运行时将触发驱动崩溃日志
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>提示：</strong>日志回填后，故障驱动会自动标红锁定。如需做对照实验，可点击锁图标解锁后修改驱动版本。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}