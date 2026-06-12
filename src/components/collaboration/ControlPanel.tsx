import { Monitor, Video, Phone, Mic, MicOff, VideoOff, MonitorOff, ScreenShare, FileText, Settings } from 'lucide-react';
import { useState } from 'react';

interface ControlPanelProps {
  isConnected: boolean;
  connectionDuration: string;
}

export default function ControlPanel({ isConnected, connectionDuration }: ControlPanelProps) {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const controls = [
    {
      id: 'screen',
      icon: isScreenSharing ? MonitorOff : Monitor,
      label: isScreenSharing ? '停止共享' : '屏幕共享',
      isActive: isScreenSharing,
      onClick: () => setIsScreenSharing(!isScreenSharing),
      color: 'blue',
    },
    {
      id: 'camera',
      icon: isCameraOn ? Video : VideoOff,
      label: isCameraOn ? '关闭摄像头' : '开启摄像头',
      isActive: isCameraOn,
      onClick: () => setIsCameraOn(!isCameraOn),
      color: 'purple',
    },
    {
      id: 'mic',
      icon: isMicOn ? Mic : MicOff,
      label: isMicOn ? '静音' : '取消静音',
      isActive: isMicOn,
      onClick: () => setIsMicOn(!isMicOn),
      color: 'green',
    },
    {
      id: 'share',
      icon: ScreenShare,
      label: '应用共享',
      isActive: false,
      onClick: () => {},
      color: 'orange',
    },
    {
      id: 'record',
      icon: isRecording ? MicOff : Mic,
      label: isRecording ? '停止录制' : '开始录制',
      isActive: isRecording,
      onClick: () => setIsRecording(!isRecording),
      color: isRecording ? 'red' : 'cyan',
    },
    {
      id: 'whiteboard',
      icon: FileText,
      label: '白板协作',
      isActive: false,
      onClick: () => {},
      color: 'pink',
    },
    {
      id: 'settings',
      icon: Settings,
      label: '设置',
      isActive: false,
      onClick: () => {},
      color: 'gray',
    },
    {
      id: 'phone',
      icon: Phone,
      label: '语音通话',
      isActive: false,
      onClick: () => {},
      color: 'teal',
    },
  ];

  const colorClasses = {
    blue: { active: 'bg-blue-500 hover:bg-blue-600', inactive: 'bg-blue-50 hover:bg-blue-100', icon: 'text-blue-600' },
    purple: { active: 'bg-purple-500 hover:bg-purple-600', inactive: 'bg-purple-50 hover:bg-purple-100', icon: 'text-purple-600' },
    green: { active: 'bg-green-500 hover:bg-green-600', inactive: 'bg-green-50 hover:bg-green-100', icon: 'text-green-600' },
    orange: { active: 'bg-orange-500 hover:bg-orange-600', inactive: 'bg-orange-50 hover:bg-orange-100', icon: 'text-orange-600' },
    red: { active: 'bg-red-500 hover:bg-red-600', inactive: 'bg-red-50 hover:bg-red-100', icon: 'text-red-600' },
    cyan: { active: 'bg-cyan-500 hover:bg-cyan-600', inactive: 'bg-cyan-50 hover:bg-cyan-100', icon: 'text-cyan-600' },
    pink: { active: 'bg-pink-500 hover:bg-pink-600', inactive: 'bg-pink-50 hover:bg-pink-100', icon: 'text-pink-600' },
    gray: { active: 'bg-gray-500 hover:bg-gray-600', inactive: 'bg-gray-50 hover:bg-gray-100', icon: 'text-gray-600' },
    teal: { active: 'bg-teal-500 hover:bg-teal-600', inactive: 'bg-teal-50 hover:bg-teal-100', icon: 'text-teal-600' },
  };

  return (
    <div className="space-y-4">
      {isConnected && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-green-700">协作已连接</span>
            </div>
            <span className="text-xs text-green-600">连接时长: {connectionDuration}</span>
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-theme-text mb-3">操作控制</p>
        <div className="grid grid-cols-4 gap-2">
          {controls.map((control) => {
            const Icon = control.icon;
            const colors = colorClasses[control.color as keyof typeof colorClasses];
            const isActive = control.isActive;

            return (
              <button
                key={control.id}
                onClick={control.onClick}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? `${colors.active} text-white shadow-lg shadow-${control.color}-500/30` 
                    : `${colors.inactive} ${colors.icon}`
                } hover:scale-105 active:scale-95`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{control.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button className="w-full px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 font-medium">
        结束会话
      </button>
    </div>
  );
}