import React from 'react';
import type { ConnectionStatus as ConnectionStatusType } from '../types/multiplayer';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

const STATUS_CONFIG: Record<
  ConnectionStatusType,
  { label: string; dotClass: string; textClass: string; pulse: boolean }
> = {
  connected: {
    label: 'Connected',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    pulse: true,
  },
  connecting: {
    label: 'Connecting…',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400',
    pulse: true,
  },
  disconnected: {
    label: 'Disconnected',
    dotClass: 'bg-slate-500',
    textClass: 'text-slate-400',
    pulse: false,
  },
  error: {
    label: 'Connection Error',
    dotClass: 'bg-red-400',
    textClass: 'text-red-400',
    pulse: false,
  },
};

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
      <span className="relative flex h-2 w-2">
        <span
          className={`${cfg.dotClass} rounded-full h-2 w-2 relative z-10 inline-block`}
        />
        {cfg.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dotClass} opacity-50`}
          />
        )}
      </span>
      <span className={`text-xs font-medium ${cfg.textClass}`}>{cfg.label}</span>
    </div>
  );
};

export default ConnectionStatus;
