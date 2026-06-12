import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Link, Copy, Video, Monitor, MessageSquare, MoreVertical, PhoneOff, ScreenShare, Mic, MicOff, Volume2, Settings } from 'lucide-react';
import type { Session } from '@/types';
import { useCollaboration } from '@/hooks/useCollaboration';

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSession, participants, selectSession, closeSession } = useCollaboration();
  const [activeTab, setActiveTab] = useState<'participants' | 'control' | 'chat'>('participants');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    if (id && (!currentSession || currentSession.id !== id)) {
      const sessions = JSON.parse(localStorage.getItem('collaboration_sessions') || '[]');
      const session = sessions.find((s: Session) => s.id === id);
      if (session) {
        selectSession(session);
      }
    }
  }, [id, currentSession, selectSession]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://example.com/collab/${id}`);
  };

  const typeLabels: Record<Session['type'], string> = {
    screen: '屏幕共享',
    video: '视频会议',
    chat: '文字协作',
  };

  const typeIcons: Record<Session['type'], React.ElementType> = {
    screen: Monitor,
    video: Video,
    chat: MessageSquare,
  };

  if (!currentSession || currentSession.id !== id) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Monitor className="w-16 h-16 text-primary/30 mb-4" />
        <p className="text-text-muted">会话不存在或已结束</p>
        <button
          onClick={() => navigate('/collaboration')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          返回协作中心
        </button>
      </div>
    );
  }

  const session = currentSession;

  return (
    <div className="min-h-screen bg-theme-bg">
      <header className="bg-white/85 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/collaboration')}
              className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回协作中心
            </button>
            <h1 className="text-lg font-semibold text-theme-text">会话详情</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      {(() => {
                        const Icon = typeIcons[session.type];
                        return <Icon className="w-8 h-8" />;
                      })()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{session.title}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                          {typeLabels[session.type]}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          session.status === 'active' 
                            ? 'bg-green-400 text-green-900' 
                            : 'bg-gray-400 text-gray-900'
                        }`}>
                          {session.status === 'active' ? '进行中' : '已结束'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      title="复制邀请链接"
                    >
                      <Link className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {session.status === 'active' && (
                  <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/20">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3 rounded-xl transition-colors ${
                          isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => setIsVideoOn(!isVideoOn)}
                        className={`p-3 rounded-xl transition-colors ${
                          !isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        {isVideoOn ? <Video className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        className={`p-3 rounded-xl transition-colors ${
                          isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        <ScreenShare className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="ml-auto">
                      <button
                        onClick={() => closeSession()}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors"
                      >
                        <PhoneOff className="w-5 h-5 inline mr-2" />
                        结束会话
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {session.status === 'active' && (
                <div className="bg-black p-8 flex items-center justify-center min-h-[400px]">
                  <div className="text-center text-white/60">
                    <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">等待对方加入...</p>
                    <p className="text-sm text-white/40 mt-2">会话 ID: {session.id}</p>
                  </div>
                </div>
              )}

              {session.status !== 'active' && (
                <div className="p-8 text-center">
                  <PhoneOff className="w-16 h-16 mx-auto text-primary/30 mb-4" />
                  <p className="text-text-muted text-lg">会话已结束</p>
                  <p className="text-sm text-text-muted mt-2">会话开始时间: {session.startTime}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-primary/20 p-6">
              <h3 className="text-lg font-semibold text-theme-text mb-4">会话信息</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-primary/5 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-primary">{participants.length}</p>
                  <p className="text-xs text-text-muted mt-1">参与者</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-blue-600">{session.startTime}</p>
                  <p className="text-xs text-text-muted mt-1">开始时间</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-green-600">{session.participants}</p>
                  <p className="text-xs text-text-muted mt-1">参与者数</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Copy className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-purple-600 font-mono text-sm">collab://{session.id}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">会话链接</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-primary/20 sticky top-24">
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
                  <Settings className="w-4 h-4" />
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
                  <MessageSquare className="w-4 h-4" />
                  聊天
                </button>
              </div>

              <div className="p-4 max-h-[500px] overflow-y-auto">
                {activeTab === 'participants' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-theme-text mb-3">参与人员 ({participants.length})</p>
                      <div className="space-y-3">
                        {participants.map((participant) => (
                          <div key={participant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="relative">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                participant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-theme-text">{participant.name}</p>
                              <p className="text-xs text-text-muted">{participant.role}</p>
                            </div>
                            {participant.role === 'host' && (
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">主持人</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="w-full px-4 py-3 border border-dashed border-primary/30 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-primary">邀请更多参与者</span>
                    </button>
                  </div>
                )}

                {activeTab === 'control' && (
                  <div className="space-y-4">
                    <div className="bg-primary/5 rounded-xl p-4">
                      <p className="text-sm font-medium text-theme-text mb-3">连接状态</p>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${session.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-text-muted">
                          {session.status === 'active' ? '已连接' : '已断开'}
                        </span>
                      </div>
                      {session.status === 'active' && (
                        <div className="mt-3 pt-3 border-t border-primary/10">
                          <p className="text-xs text-text-muted">连接时长</p>
                          <p className="text-lg font-bold text-theme-text">15 分钟</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-theme-text">远程控制</span>
                        <span className="w-12 h-6 bg-gray-200 rounded-full"></span>
                      </button>
                      <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-theme-text">文件传输</span>
                        <span className="w-12 h-6 bg-gray-200 rounded-full"></span>
                      </button>
                      <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-theme-text">会话录制</span>
                        <span className="w-12 h-6 bg-gray-200 rounded-full"></span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">系统消息</p>
                          <p className="text-sm text-theme-text">欢迎加入会话</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {participants.slice(0, 2).map((participant) => (
                        <div key={participant.id} className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-3 h-3 text-primary" />
                          </div>
                          <div className="bg-primary/5 rounded-xl p-3 max-w-[80%]">
                            <p className="text-xs text-primary font-medium">{participant.name}</p>
                            <p className="text-sm text-theme-text">你好！</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-primary/10">
                      <input
                        type="text"
                        placeholder="发送消息..."
                        className="flex-1 px-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      />
                      <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}