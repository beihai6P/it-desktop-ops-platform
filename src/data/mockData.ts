import type { Case } from '@/types';

export const mockCases: Case[] = [];

export const quickSymptomTags = [
  { text: '崩溃', category: 'system' },
  { text: '闪退', category: 'application' },
  { text: '无响应', category: 'system' },
  { text: '蓝屏', category: 'system' },
  { text: '网络连接', category: 'network' },
  { text: 'DNS解析', category: 'network' },
  { text: '打印失败', category: 'printer' },
  { text: '打印机脱机', category: 'printer' },
  { text: '软件安装', category: 'software' },
  { text: '驱动问题', category: 'hardware' },
  { text: '开机慢', category: 'system' },
  { text: '运行卡顿', category: 'system' },
];