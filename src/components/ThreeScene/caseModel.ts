export interface CasePart {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: number;
  type: 'box' | 'sphere' | 'cylinder' | 'torus';
  disassembled: boolean;
  disassembleOffset: [number, number, number];
  description: string;
}

export const caseParts: CasePart[] = [
  {
    id: 'case-body',
    name: '机箱主体',
    category: '外壳',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [2, 1.5, 1.2],
    color: 0x2a2a2a,
    type: 'box',
    disassembled: false,
    disassembleOffset: [0, 0, 0],
    description: '机箱外部框架，提供硬件安装空间和保护'
  },
  {
    id: 'case-side-panel',
    name: '侧板',
    category: '外壳',
    position: [0, 0, 0.61],
    rotation: [0, 0, 0],
    scale: [2.02, 1.52, 0.02],
    color: 0x1a1a1a,
    type: 'box',
    disassembled: false,
    disassembleOffset: [0, 0, 1.5],
    description: '机箱侧面板，通常为透明亚克力或金属材质'
  },
  {
    id: 'motherboard',
    name: '主板',
    category: '核心组件',
    position: [0, -0.4, 0],
    rotation: [0, 0, 0],
    scale: [1.6, 0.02, 0.8],
    color: 0x3d3d3d,
    type: 'box',
    disassembled: false,
    disassembleOffset: [1.5, 0, 0],
    description: '计算机的主电路板，连接所有硬件组件'
  },
  {
    id: 'cpu',
    name: 'CPU',
    category: '核心组件',
    position: [-0.3, -0.38, 0],
    rotation: [0, 0, 0],
    scale: [0.25, 0.08, 0.25],
    color: 0x4a90d9,
    type: 'box',
    disassembled: false,
    disassembleOffset: [1.8, 0.5, 0],
    description: '中央处理器，计算机的运算核心'
  },
  {
    id: 'cpu-cooler',
    name: 'CPU散热器',
    category: '散热系统',
    position: [-0.3, -0.32, 0],
    rotation: [0, 0, 0],
    scale: [0.3, 0.2, 0.3],
    color: 0x666666,
    type: 'box',
    disassembled: false,
    disassembleOffset: [1.8, 0.8, 0],
    description: '为CPU散热的风冷或水冷系统'
  },
  {
    id: 'ram-1',
    name: '内存条1',
    category: '内存',
    position: [0.1, -0.38, 0.2],
    rotation: [0, 0, 0],
    scale: [0.05, 0.15, 0.35],
    color: 0x3b82f6,
    type: 'box',
    disassembled: false,
    disassembleOffset: [2.0, 0.3, 0],
    description: 'DDR内存模块，临时存储数据供CPU快速访问'
  },
  {
    id: 'ram-2',
    name: '内存条2',
    category: '内存',
    position: [0.25, -0.38, 0.2],
    rotation: [0, 0, 0],
    scale: [0.05, 0.15, 0.35],
    color: 0x3b82f6,
    type: 'box',
    disassembled: false,
    disassembleOffset: [2.2, 0.3, 0],
    description: '第二根DDR内存模块'
  },
  {
    id: 'gpu',
    name: '显卡',
    category: '核心组件',
    position: [0.5, -0.5, -0.3],
    rotation: [0, 0, 0],
    scale: [0.8, 0.2, 0.35],
    color: 0x1a5fb4,
    type: 'box',
    disassembled: false,
    disassembleOffset: [0, -1.2, 0],
    description: '图形处理器，负责图形渲染和并行计算'
  },
  {
    id: 'psu',
    name: '电源',
    category: '供电系统',
    position: [0, -0.65, -0.5],
    rotation: [0, 0, 0],
    scale: [0.5, 0.15, 0.4],
    color: 0x2d2d2d,
    type: 'box',
    disassembled: false,
    disassembleOffset: [0, -1.5, 0],
    description: '电源供应器，为所有硬件提供稳定电力'
  },
  {
    id: 'hdd',
    name: '硬盘',
    category: '存储',
    position: [-0.5, -0.65, -0.3],
    rotation: [0, 0, 0],
    scale: [0.15, 0.2, 0.1],
    color: 0x555555,
    type: 'box',
    disassembled: false,
    disassembleOffset: [-1.5, -1.0, 0],
    description: '机械硬盘，大容量数据存储'
  },
  {
    id: 'ssd',
    name: '固态硬盘',
    category: '存储',
    position: [-0.7, -0.65, -0.3],
    rotation: [0, 0, 0],
    scale: [0.08, 0.06, 0.15],
    color: 0x444444,
    type: 'box',
    disassembled: false,
    disassembleOffset: [-1.8, -1.0, 0],
    description: '固态硬盘，高速数据读写'
  },
  {
    id: 'case-fan-front',
    name: '前置风扇',
    category: '散热系统',
    position: [0, 0.55, -0.59],
    rotation: [0, 0, 0],
    scale: [0.25, 0.03, 0.25],
    color: 0x333333,
    type: 'cylinder',
    disassembled: false,
    disassembleOffset: [0, 1.2, -1.0],
    description: '机箱前置风扇，进风散热'
  },
  {
    id: 'case-fan-rear',
    name: '后置风扇',
    category: '散热系统',
    position: [0, -0.1, 0.59],
    rotation: [0, Math.PI, 0],
    scale: [0.2, 0.03, 0.2],
    color: 0x333333,
    type: 'cylinder',
    disassembled: false,
    disassembleOffset: [0, 0, 1.5],
    description: '机箱后置风扇，排风散热'
  },
  {
    id: 'case-top',
    name: '机箱顶部',
    category: '外壳',
    position: [0, 0.76, 0],
    rotation: [0, 0, 0],
    scale: [2.02, 0.04, 1.22],
    color: 0x2a2a2a,
    type: 'box',
    disassembled: false,
    disassembleOffset: [0, 1.8, 0],
    description: '机箱顶部盖板'
  },
  {
    id: 'case-front',
    name: '机箱前面板',
    category: '外壳',
    position: [0, 0, -0.61],
    rotation: [0, 0, 0],
    scale: [2.02, 1.52, 0.03],
    color: 0x1f1f1f,
    type: 'box',
    disassembled: false,
    disassembleOffset: [0, 0, -1.5],
    description: '机箱前面板，包含接口和指示灯'
  }
];

export const categories = ['全部', '外壳', '核心组件', '内存', '存储', '散热系统', '供电系统'];