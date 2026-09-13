import React from 'react';
import type { RemoteUser, LocalUser } from '../types/multiplayer';
import { hexToRgba } from '../utils/colors';

interface UserListProps {
  users: RemoteUser[];
  localUser: LocalUser;
}

const UserAvatar: React.FC<{ name: string; color: string; isLocal?: boolean }> = ({
  name,
  color,
  isLocal = false,
}) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
      style={{
        background: hexToRgba(color, 0.25),
        border: `1.5px solid ${color}`,
        color,
        boxShadow: isLocal ? `0 0 8px ${hexToRgba(color, 0.4)}` : undefined,
      }}
    >
      {initials}
      {isLocal && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{
            background: color,
            borderColor: 'var(--bg-secondary)',
          }}
        />
      )}
    </div>
  );
};

const UserList: React.FC<UserListProps> = ({ users, localUser }) => {
  const activeCount = users.filter((u) => u.isActive).length + 1; // +1 for local user

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Participants
        </span>
        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {activeCount} online
        </span>
      </div>

      {/* Local user */}
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg glass-card-hover glass-card">
        <UserAvatar name={localUser.name} color={localUser.color} isLocal />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: localUser.color }}
          >
            {localUser.name}
          </p>
          <p className="text-xs text-slate-500">You</p>
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-medium"
          style={{
            background: hexToRgba(localUser.color, 0.15),
            color: localUser.color,
          }}
        >
          Host
        </span>
      </div>

      {/* Remote users */}
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 px-2 py-2 rounded-lg glass-card-hover glass-card"
        >
          <UserAvatar name={user.name} color={user.color} />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: user.color }}
            >
              {user.name}
            </p>
            <p className="text-xs text-slate-500">
              {user.isActive ? 'Active now' : 'Idle'}
            </p>
          </div>
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              user.isActive ? 'animate-pulse' : ''
            }`}
            style={{ background: user.isActive ? user.color : '#4a5568' }}
          />
        </div>
      ))}
    </div>
  );
};

export default UserList;
