import { useState } from 'react';
import { Send, Paperclip, Smile, User, Image, FileText } from 'lucide-react';

interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

interface ChatPanelProps {
  sessionTitle: string;
}

// 聊天消息数据 - 请从API获取
const mockMessages: ChatMessage[] = [];

export default function ChatPanel({ sessionTitle }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: ChatMessage = {
      id: String(messages.length + 1),
      author: '用户A',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
    };
    
    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/85 rounded-xl border border-primary/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-theme-text text-sm">{sessionTitle} - 聊天</h3>
        </div>
        <span className="text-xs text-text-muted">{messages.length} 条消息</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 ${message.isMine ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.isMine ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div className={`max-w-[75%] ${message.isMine ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${message.isMine ? 'text-primary' : 'text-text-muted'}`}>
                  {message.author}
                </span>
                <span className="text-xs text-text-muted">{message.timestamp}</span>
              </div>
              <div className={`px-3 py-2 rounded-2xl ${
                message.isMine 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-theme-bg text-theme-text rounded-tl-sm'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-primary/10">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-text-muted" />
          </button>
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
            <Image className="w-5 h-5 text-text-muted" />
          </button>
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
            <FileText className="w-5 h-5 text-text-muted" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 bg-theme-bg rounded-xl text-sm text-theme-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
            <Smile className="w-5 h-5 text-text-muted" />
          </button>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}