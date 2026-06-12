import { X, Copy, Users, Clock, Link, MoreVertical } from 'lucide-react';
import type { Session, Participant } from '@/types';
import ParticipantItem from './ParticipantItem';
import ControlPanel from './ControlPanel';
import ChatPanel from './ChatPanel';
import { useState } from 'react';

interface SessionDetailProps {
  session: Session;
  participants: Participant[];
  onClose: () => void;
}

export default function SessionDetail({ session, participants, onClose }: SessionDetailProps) {
  const [activeTab, setActiveTab] = useState<'participants' | 'control' | 'chat'>('participants');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://example.com/collab/${session.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabels = {
    screen: '屏幕共享',
    video: '视频会议',
    chat: '文字协作',
  };

  return (
    <div className="w-[400px] bg-white/85 border-l border-primary/20 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-primary/10">
        <div className="flex-1">
          <h3 className="font-semibold text-theme-text">{session.title}</h3>
          <p className="text-xs text-text-muted mt-0.5">{typeLabels[session.type]} · {session.participants} 人参与</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors relative"
            title="复制邀请链接"
          >
            <Link className="w-4 h-4 text-text-muted" />
            {copied && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-theme-text text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                已复制
              </span>
            )}
          </button>
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-text-muted" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-primary/10">
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'participants'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-theme-text'
          }`}
        >
          <Users className="w-4 h-4" />
          参与者
        </button>
        <button
          onClick={() => setActiveTab('control')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'control'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-theme-text'
          }`}
        >
          <ControlIcon className="w-4 h-4" />
          控制面板
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'chat'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-theme-text'
          }`}
        >
          <MessageIcon className="w-4 h-4" />
          聊天
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="bg-primary/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-primary">会话信息</span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {session.startTime} 开始
                </span>
              </div>
              <p className="text-sm font-semibold text-theme-text">{session.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Copy className="w-3 h-3 text-text-muted" />
                <span className="text-xs text-text-muted font-mono">collab://{session.id}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-theme-text mb-3">参与人员 ({participants.length})</p>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <ParticipantItem key={participant.id} participant={participant} />
                ))}
              </div>
            </div>

            <button className="w-full px-4 py-2.5 border border-dashed border-primary/30 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">邀请更多参与者</span>
            </button>
          </div>
        )}

        {activeTab === 'control' && (
          <ControlPanel isConnected={session.status === 'active'} connectionDuration="15分钟" />
        )}

        {activeTab === 'chat' && (
          <div className="h-full">
            <ChatPanel sessionTitle={session.title} />
          </div>
        )}
      </div>
    </div>
  );
}

function ControlIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="14" y="2" width="8" height="20" rx="2" ry="2" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M14 2V6a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}