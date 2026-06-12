import { useState } from 'react';
import { ChevronDown, ChevronUp, Server, Shield, Globe } from 'lucide-react';

export interface OSConfig {
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

const osVersions: Record<string, { version: string; bit: ('32' | '64')[]; build: string }[]> = {
  desktop: [
    { version: 'Windows XP Home Edition', bit: ['32'], build: '5.1.2600' },
    { version: 'Windows XP Professional', bit: ['32', '64'], build: '5.1.2600' },
    { version: 'Windows Vista Home Basic', bit: ['32', '64'], build: '6.0.6000' },
    { version: 'Windows Vista Home Premium', bit: ['32', '64'], build: '6.0.6000' },
    { version: 'Windows Vista Business', bit: ['32', '64'], build: '6.0.6000' },
    { version: 'Windows Vista Ultimate', bit: ['32', '64'], build: '6.0.6000' },
    { version: 'Windows 7 Home Premium', bit: ['32', '64'], build: '6.1.7600' },
    { version: 'Windows 7 Professional', bit: ['32', '64'], build: '6.1.7600' },
    { version: 'Windows 7 Ultimate', bit: ['32', '64'], build: '6.1.7600' },
    { version: 'Windows 8', bit: ['32', '64'], build: '6.2.9200' },
    { version: 'Windows 8.1', bit: ['32', '64'], build: '6.3.9600' },
    { version: 'Windows 10 Home 1703', bit: ['32', '64'], build: '10.0.15063' },
    { version: 'Windows 10 Pro 1703', bit: ['32', '64'], build: '10.0.15063' },
    { version: 'Windows 10 Enterprise 1703', bit: ['32', '64'], build: '10.0.15063' },
    { version: 'Windows 10 Home 1809', bit: ['32', '64'], build: '10.0.17763' },
    { version: 'Windows 10 Pro 1809', bit: ['32', '64'], build: '10.0.17763' },
    { version: 'Windows 10 Enterprise 1809', bit: ['32', '64'], build: '10.0.17763' },
    { version: 'Windows 10 Home 21H2', bit: ['32', '64'], build: '10.0.19044' },
    { version: 'Windows 10 Pro 21H2', bit: ['32', '64'], build: '10.0.19044' },
    { version: 'Windows 10 Enterprise 21H2', bit: ['32', '64'], build: '10.0.19044' },
    { version: 'Windows 10 Home 22H2', bit: ['32', '64'], build: '10.0.19045' },
    { version: 'Windows 10 Pro 22H2', bit: ['32', '64'], build: '10.0.19045' },
    { version: 'Windows 10 Enterprise 22H2', bit: ['32', '64'], build: '10.0.19045' },
    { version: 'Windows 11 Home 21H2', bit: ['64'], build: '10.0.22000' },
    { version: 'Windows 11 Pro 21H2', bit: ['64'], build: '10.0.22000' },
    { version: 'Windows 11 Enterprise 21H2', bit: ['64'], build: '10.0.22000' },
    { version: 'Windows 11 Home 22H2', bit: ['64'], build: '10.0.22621' },
    { version: 'Windows 11 Pro 22H2', bit: ['64'], build: '10.0.22621' },
    { version: 'Windows 11 Enterprise 22H2', bit: ['64'], build: '10.0.22621' },
    { version: 'Windows 11 Home 24H2', bit: ['64'], build: '10.0.26100' },
    { version: 'Windows 11 Pro 24H2', bit: ['64'], build: '10.0.26100' },
    { version: 'Windows 11 Enterprise 24H2', bit: ['64'], build: '10.0.26100' },
  ],
  server: [
    { version: 'Windows Server 2008 R2 Standard', bit: ['64'], build: '6.1.7601' },
    { version: 'Windows Server 2008 R2 Datacenter', bit: ['64'], build: '6.1.7601' },
    { version: 'Windows Server 2012', bit: ['64'], build: '6.2.9200' },
    { version: 'Windows Server 2012 R2', bit: ['64'], build: '6.3.9600' },
    { version: 'Windows Server 2016 Standard', bit: ['64'], build: '10.0.14393' },
    { version: 'Windows Server 2016 Datacenter', bit: ['64'], build: '10.0.14393' },
    { version: 'Windows Server 2019 Standard', bit: ['64'], build: '10.0.17763' },
    { version: 'Windows Server 2019 Datacenter', bit: ['64'], build: '10.0.17763' },
    { version: 'Windows Server 2022 Standard', bit: ['64'], build: '10.0.20348' },
    { version: 'Windows Server 2022 Datacenter', bit: ['64'], build: '10.0.20348' },
  ],
};

const languages = ['中文(简体)', '中文(繁体)', 'English', 'Japanese', 'Korean'];
const timezones = ['UTC+8 北京', 'UTC+8 上海', 'UTC+5:30 印度', 'UTC-5 纽约', 'UTC+1 伦敦'];

interface SystemConfigProps {
  config: OSConfig;
  onChange: (config: OSConfig) => void;
  locked: boolean;
}

export default function SystemConfig({ config, onChange, locked }: SystemConfigProps) {
  const [expanded, setExpanded] = useState(true);

  const handleFamilyChange = (family: 'desktop' | 'server') => {
    const versions = osVersions[family];
    onChange({
      ...config,
      family,
      version: versions[0].version,
      bit: versions[0].bit[0],
      buildNumber: versions[0].build,
      tpmEnabled: family === 'desktop' && versions[0].version.includes('11'),
      secureBoot: family === 'desktop' && versions[0].version.includes('11'),
    });
  };

  const handleVersionChange = (version: string) => {
    const versions = osVersions[config.family];
    const selected = versions.find(v => v.version === version);
    if (selected) {
      onChange({
        ...config,
        version,
        bit: selected.bit[0],
        buildNumber: selected.build,
        tpmEnabled: version.includes('11'),
        secureBoot: version.includes('11'),
      });
    }
  };

  const maxMemoryLimit = config.version.includes('XP') && config.bit === '32' ? 3250 : null;
  const requiresTPM = config.version.includes('11');

  return (
    <div className="border border-primary/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-theme-bg hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-theme-text">操作系统配置</h4>
            <p className="text-xs text-text-muted">Windows XP ~ Windows 11 全版本覆盖</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">系统类型</label>
              <select
                value={config.family}
                onChange={(e) => handleFamilyChange(e.target.value as 'desktop' | 'server')}
                disabled={locked}
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="desktop">桌面Windows</option>
                <option value="server">Windows Server</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">系统版本</label>
              <select
                value={config.version}
                onChange={(e) => handleVersionChange(e.target.value)}
                disabled={locked}
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {osVersions[config.family].map(os => (
                  <option key={os.version} value={os.version}>{os.version}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">位数</label>
              <select
                value={config.bit}
                onChange={(e) => onChange({ ...config, bit: e.target.value as '32' | '64' })}
                disabled={locked}
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {osVersions[config.family].find(v => v.version === config.version)?.bit.map(bit => (
                  <option key={bit} value={bit}>{bit}位</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">Build版本</label>
              <input
                type="text"
                value={config.buildNumber}
                onChange={(e) => onChange({ ...config, buildNumber: e.target.value })}
                disabled={locked}
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">补丁版本</label>
              <input
                type="text"
                value={config.patchVersion}
                onChange={(e) => onChange({ ...config, patchVersion: e.target.value })}
                disabled={locked}
                placeholder="KB503... 或空白"
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">系统语言</label>
              <select
                value={config.language}
                onChange={(e) => onChange({ ...config, language: e.target.value })}
                disabled={locked}
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">主机名</label>
              <input
                type="text"
                value={config.hostname}
                onChange={(e) => onChange({ ...config, hostname: e.target.value })}
                disabled={locked}
                placeholder="WIN-XXXXXXX"
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">时区</label>
              <select
                value={config.timezone}
                onChange={(e) => onChange({ ...config, timezone: e.target.value })}
                disabled={locked}
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">UAC权限等级</label>
              <select
                value={config.uacLevel}
                onChange={(e) => onChange({ ...config, uacLevel: e.target.value as 'low' | 'medium' | 'high' })}
                disabled={locked}
                className={`w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.tpmEnabled}
                  onChange={(e) => onChange({ ...config, tpmEnabled: e.target.checked })}
                  disabled={locked || !requiresTPM}
                  className={`w-4 h-4 rounded ${locked || !requiresTPM ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <span className="text-sm text-theme-text">TPM 2.0</span>
              </label>
              {requiresTPM && (
                <span className="text-xs text-yellow-500 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Win11强制
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.secureBoot}
                  onChange={(e) => onChange({ ...config, secureBoot: e.target.checked })}
                  disabled={locked || !requiresTPM}
                  className={`w-4 h-4 rounded ${locked || !requiresTPM ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <span className="text-sm text-theme-text">安全启动</span>
              </label>
            </div>

            {maxMemoryLimit && (
              <div className="flex items-center gap-2 text-red-500">
                <Globe className="w-4 h-4" />
                <span className="text-xs">32位XP内存限制: {maxMemoryLimit}MB</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}