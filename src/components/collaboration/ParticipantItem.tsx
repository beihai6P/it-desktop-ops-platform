import { User, Crown, Eye, Edit3 } from 'lucide-react';
import type { Participant } from '@/types';

interface ParticipantItemProps {
  participant: Participant;
}

const roleConfig = {
  host: { label: '主持人', icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  editor: { label: '协作者', icon: Edit3, color: 'text-blue-600', bg: 'bg-blue-100' },
  viewer: { label: '观看者', icon: Eye, color: 'text-gray-600', bg: 'bg-gray-100' },
};

const statusConfig = {
  online: { color: 'bg-green-500', pulse: true },
  away: { color: 'bg-yellow-500', pulse: false },
};

export default function ParticipantItem({ participant }: ParticipantItemProps) {
  const roleInfo = roleConfig[participant.role];
  const statusInfo = statusConfig[participant.status];
  const RoleIcon = roleInfo.icon;

  return (
    <div className="flex items-center justify-between p-3 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <User className="w-5 h-5 text-primary" />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-theme-bg ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse' : ''}`}></span>
        </div>
        <div>
          <p className="text-sm font-medium text-theme-text">{participant.name}</p>
          <div className="flex items-center gap-2">
            <RoleIcon className={`w-3 h-3 ${roleInfo.color}`} />
            <span className={`text-xs ${roleInfo.color}`}>{roleInfo.label}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
          <Eye className="w-4 h-4 text-text-muted" />
        </button>
        <button className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
          <Edit3 className="w-4 h-4 text-text-muted" />
        </button>
      </div>
    </div>
  );
}