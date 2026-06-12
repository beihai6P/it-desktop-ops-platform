import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Video, Monitor, ClipboardList, MessageSquare, Plus, X, Calendar, Clock } from 'lucide-react';
import { useCollaboration } from '@/hooks/useCollaboration';
import SessionCard from '@/components/collaboration/SessionCard';
import type { Session } from '@/types';

export default function Collaboration() {
  const navigate = useNavigate();
  const {
    activeTab,
    setActiveTab,
    createSession,
    filterSessions,
  } = useCollaboration();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionType, setNewSessionType] = useState<Session['type']>('screen');

  const filteredSessions = filterSessions();

  const handleCreateSession = () => {
    if (!newSessionTitle.trim()) return;
    createSession(newSessionTitle, newSessionType);
    setShowCreateModal(false);
    setNewSessionTitle('');
    setNewSessionType('screen');
  };

  const typeOptions = [
    { value: 'screen', label: '屏幕共享', icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'video', label: '视频会议', icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'chat', label: '文字协作', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const stats = [
    { icon: Users, label: '进行中会话', value: '2', color: 'text-green-600', bg: 'bg-green-100' },
    { icon: Clock, label: '今日协作', value: '8', color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: Calendar, label: '本周会议', value: '23', color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-theme-text">实时远程协作中心</h2>
            <p className="text-sm text-text-muted mt-1">支持多人协作、屏幕共享、远程协助</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 font-medium"
          >
            <Plus className="w-4 h-4" />
            发起协作
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white/85 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-theme-text">{stat.value}</p>
                    <p className="text-xs text-text-muted">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'sessions'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white/85 text-text-muted hover:bg-primary/10 hover:text-primary border border-primary/20'
            }`}
          >
            进行中会话
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white/85 text-text-muted hover:bg-primary/10 hover:text-primary border border-primary/20'
            }`}
          >
            历史记录
          </button>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => navigate(`/collaboration/${session.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/85 border border-primary/20 rounded-xl p-8">
            <div className="text-center py-8">
              <ClipboardList className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
              <p className="text-text-muted text-lg font-medium">暂无{activeTab === 'sessions' ? '进行中' : '历史'}会话</p>
              <p className="text-sm text-text-muted mt-2">
                {activeTab === 'sessions' ? '点击右上角按钮发起新的协作会话' : '完成的协作会话将在这里显示'}
              </p>
            </div>
          </div>
        )}

        {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-theme-text">发起新协作</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">会话名称</label>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="输入会话名称..."
                  className="w-full px-4 py-3 bg-theme-bg rounded-xl text-theme-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">协作类型</label>
                <div className="grid grid-cols-3 gap-3">
                  {typeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setNewSessionType(option.value as Session['type'])}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                          newSessionType === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-primary/20 hover:border-primary/50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${option.color}`} />
                        <span className="text-sm font-medium text-theme-text">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-primary/30 rounded-xl text-theme-text hover:bg-primary/5 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={!newSessionTitle.trim()}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建会话
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}