import { Users, Monitor, Video, MessageSquare } from 'lucide-react';
import type { Session } from '@/types';
interface SessionCardProps {
 session: Session;
 onClick: () => void;
 isSelected?: boolean;
}
const typeConfig = {
 screen: { icon: Monitor, label: '屏幕共享', color: 'text-blue-600', bg: 'bg-blue-100' },
 video: { icon: Video, label: '视频会议', color: 'text-purple-600', bg: 'bg-purple-100' },
 chat: { icon: MessageSquare, label: '文字协作', color: 'text-green-600', bg: 'bg-green-100' },
};
const statusConfig = {
 active: { label: '进行中', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-400' },
 pending: { label: '等待中', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-300' },
 ended: { label: '已结束', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' },
};
export default function SessionCard({ session, onClick, isSelected }: SessionCardProps) {
 const typeInfo = typeConfig[session.type];
 const statusInfo = statusConfig[session.status];
 const TypeIcon = typeInfo.icon;
 return (<div onClick={onClick} className={`bg-white/85 border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''} ${statusInfo.border}`}>
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-3">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeInfo.bg} transition-transform hover:scale-110`}>
 <TypeIcon className={`w-6 h-6 ${typeInfo.color}`}/>
 </div>
 <div>
 <h3 className="font-semibold text-theme-text text-base">{session.title}</h3>
 <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color} font-medium`}>
 {statusInfo.label}
 </span>
 </div>
 </div>
 {session.status === 'active' && (<span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></span>)}
 </div>
 <div className="flex items-center justify-between pt-4 border-t border-primary/10">
 <div className="flex items-center gap-2">
 <Users className="w-4 h-4 text-text-muted"/>
 <span className="text-sm text-text-muted">{session.participants} 人参与</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-medium px-2 py-1 rounded-lg bg-theme-bg text-text-muted">
 {typeInfo.label}
 </span>
 <span className="text-xs text-text-muted">{session.startTime}</span>
 </div>
 </div>
 </div>);
}