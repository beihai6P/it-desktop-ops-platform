import { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Search, Trash2 } from 'lucide-react';

export interface Software {
  id: string;
  name: string;
  category: string;
  version: string;
  bit: '32' | '64';
  installed: boolean;
}

interface SoftwareConfigProps {
  software: Software[];
  onSoftwareChange: (software: Software[]) => void;
  locked: boolean;
}

const softwareCategories = [
  {
    id: 'runtime',
    name: '运行库',
    items: [
      { name: 'Microsoft Visual C++ 2005', versions: ['8.0.50727.42'] },
      { name: 'Microsoft Visual C++ 2008', versions: ['9.0.30729.4148'] },
      { name: 'Microsoft Visual C++ 2010', versions: ['10.0.40219.473'] },
      { name: 'Microsoft Visual C++ 2012', versions: ['11.0.61030.0'] },
      { name: 'Microsoft Visual C++ 2013', versions: ['12.0.40660.0'] },
      { name: 'Microsoft Visual C++ 2015-2022', versions: ['14.36.32532', '14.35.32215', '14.34.31931'] },
      { name: '.NET Framework 2.0', versions: ['2.0.50727.4927'] },
      { name: '.NET Framework 3.5', versions: ['3.5.30729.4926'] },
      { name: '.NET Framework 4.0', versions: ['4.0.30319'] },
      { name: '.NET Framework 4.5', versions: ['4.5.51209'] },
      { name: '.NET Framework 4.6', versions: ['4.6.01590'] },
      { name: '.NET Framework 4.7', versions: ['4.7.02556'] },
      { name: '.NET Framework 4.8', versions: ['4.8.04084'] },
      { name: 'Java SE 8', versions: ['1.8.0_381', '1.8.0_361', '1.8.0_341'] },
      { name: 'Java SE 11', versions: ['11.0.20', '11.0.19', '11.0.18'] },
      { name: 'Java SE 17', versions: ['17.0.8', '17.0.7', '17.0.6'] },
      { name: 'Python 3.8', versions: ['3.8.18', '3.8.17', '3.8.16'] },
      { name: 'Python 3.9', versions: ['3.9.18', '3.9.17', '3.9.16'] },
      { name: 'Python 3.10', versions: ['3.10.13', '3.10.12', '3.10.11'] },
      { name: 'Python 3.11', versions: ['3.11.5', '3.11.4', '3.11.3'] },
    ],
  },
  {
    id: 'database',
    name: '数据库',
    items: [
      { name: 'MySQL', versions: ['8.0.35', '8.0.33', '8.0.31', '5.7.44', '5.6.51'] },
      { name: 'SQL Server Express', versions: ['2022', '2019', '2017', '2016'] },
      { name: 'SQL Server Standard', versions: ['2022', '2019', '2017'] },
      { name: 'SQL Server Enterprise', versions: ['2022', '2019', '2017'] },
      { name: 'Redis', versions: ['7.2.3', '7.0.12', '6.2.14', '5.0.14'] },
      { name: 'Oracle Database', versions: ['21c', '19c', '18c', '12c'] },
      { name: 'PostgreSQL', versions: ['16.1', '15.4', '14.9', '13.12'] },
      { name: 'MongoDB', versions: ['7.0.5', '6.0.12', '5.0.17', '4.4.23'] },
    ],
  },
  {
    id: 'web',
    name: 'Web服务',
    items: [
      { name: 'IIS', versions: ['10.0', '8.5', '7.5', '6.0'] },
      { name: 'Nginx', versions: ['1.25.3', '1.24.0', '1.22.1', '1.20.2'] },
      { name: 'Apache HTTP Server', versions: ['2.4.58', '2.4.57', '2.4.56'] },
      { name: 'Tomcat', versions: ['10.1.15', '9.0.80', '8.5.93', '7.0.109'] },
      { name: 'Node.js', versions: ['20.10.0', '18.19.0', '16.20.2', '14.21.3'] },
      { name: 'PHP', versions: ['8.2.13', '8.1.26', '7.4.33', '5.6.40'] },
    ],
  },
  {
    id: 'office',
    name: '办公软件',
    items: [
      { name: 'Microsoft Office 2003', versions: ['11.0.6355'] },
      { name: 'Microsoft Office 2007', versions: ['12.0.6785.5000'] },
      { name: 'Microsoft Office 2010', versions: ['14.0.7353.5000'] },
      { name: 'Microsoft Office 2013', versions: ['15.0.5571.1000'] },
      { name: 'Microsoft Office 2016', versions: ['16.0.5408.1000'] },
      { name: 'Microsoft Office 2019', versions: ['16.0.10393.20020'] },
      { name: 'Microsoft Office 2021', versions: ['16.0.14332.20344'] },
      { name: 'Microsoft Office 365', versions: ['2312', '2311', '2310'] },
      { name: 'WPS Office 2019', versions: ['11.1.0.15283'] },
      { name: 'WPS Office 2021', versions: ['11.1.0.15700'] },
      { name: 'WPS Office 2023', versions: ['11.1.0.16086'] },
      { name: 'Internet Explorer 6', versions: ['6.0.2900.5512'] },
      { name: 'Internet Explorer 7', versions: ['7.0.5730.13'] },
      { name: 'Internet Explorer 8', versions: ['8.0.7601.17514'] },
      { name: 'Internet Explorer 9', versions: ['9.0.8112.16421'] },
      { name: 'Internet Explorer 10', versions: ['10.0.9200.16384'] },
      { name: 'Internet Explorer 11', versions: ['11.0.9600.19596'] },
      { name: 'Google Chrome', versions: ['120.0.6099.130', '119.0.6045.199', '118.0.5993.118'] },
      { name: 'Mozilla Firefox', versions: ['121.0', '120.0', '119.0'] },
    ],
  },
  {
    id: 'industry',
    name: '行业软件',
    items: [
      { name: 'KingView 6.55', versions: ['6.55'] },
      { name: 'KingView 7.5', versions: ['7.5'] },
      { name: 'MCGS 7.7', versions: ['7.7'] },
      { name: 'WinCC 7.5', versions: ['7.5.0.0'] },
      { name: 'Step7 V5.6', versions: ['5.6'] },
      { name: 'TIA Portal', versions: ['V18', 'V17', 'V16'] },
      { name: 'SAP GUI', versions: ['7.70', '7.60', '7.50'] },
      { name: '用友U8', versions: ['16.0', '15.0', '13.0'] },
      { name: '金蝶K3', versions: ['Wise 15.0', 'Cloud 7.0'] },
      { name: '加密狗驱动', versions: ['HASP', 'Sentinel', 'iLok'] },
    ],
  },
];

export default function SoftwareConfig({ software, onSoftwareChange, locked }: SoftwareConfigProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('runtime');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSoftware = software.filter(s => 
    s.category === selectedCategory && 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleInstall = (softwareId: string) => {
    if (!locked) {
      onSoftwareChange(software.map(s => 
        s.id === softwareId ? { ...s, installed: !s.installed } : s
      ));
    }
  };

  const updateVersion = (softwareId: string, version: string) => {
    if (!locked) {
      onSoftwareChange(software.map(s => 
        s.id === softwareId ? { ...s, version } : s
      ));
    }
  };

  const toggleBit = (softwareId: string) => {
    if (!locked) {
      onSoftwareChange(software.map(s => 
        s.id === softwareId ? { ...s, bit: s.bit === '32' ? '64' : '32' } : s
      ));
    }
  };

  const getVersionsForSoftware = (name: string) => {
    for (const category of softwareCategories) {
      const item = category.items.find(i => i.name === name);
      if (item) return item.versions;
    }
    return [];
  };

  const installedCount = software.filter(s => s.installed).length;

  return (
    <div className="border border-primary/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-theme-bg hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-theme-text">软件配置</h4>
            <p className="text-xs text-text-muted">已安装 {installedCount} 款软件</p>
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
            {softwareCategories.map(category => (
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

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索软件..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredSoftware.map(soft => (
              <div
                key={soft.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  soft.installed ? 'bg-primary/5 border border-primary/20' : 'bg-white border border-transparent hover:border-primary/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={soft.installed}
                  onChange={() => toggleInstall(soft.id)}
                  disabled={locked}
                  className={`w-4 h-4 rounded ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-theme-text truncate">{soft.name}</span>
                    <button
                      onClick={() => toggleBit(soft.id)}
                      disabled={locked || !soft.installed}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        soft.installed && !locked
                          ? soft.bit === '64' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {soft.bit}位
                    </button>
                  </div>
                  
                  {soft.installed && (
                    <select
                      value={soft.version}
                      onChange={(e) => updateVersion(soft.id, e.target.value)}
                      disabled={locked}
                      className={`mt-1 px-2 py-1 text-xs bg-white border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                        locked ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {getVersionsForSoftware(soft.name).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-primary/10">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>提示：勾选软件表示安装，取消勾选表示卸载</span>
              <button
                onClick={() => {
                  if (!locked) {
                    onSoftwareChange(software.map(s => ({ ...s, installed: false })));
                  }
                }}
                disabled={locked}
                className={`text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Trash2 className="w-3 h-3" />
                全部卸载
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}