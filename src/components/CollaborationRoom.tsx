import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { LocalUser, ActivityEntry, ClickRipple as ClickRippleType } from '../types/multiplayer';
import ConnectionStatus from './ConnectionStatus';
import UserList from './UserList';
import RemoteCursor from './RemoteCursor';
import ClickRipple from './ClickRipple';
import { useRealtime } from '../hooks/useRealtime';
import { hexToRgba } from '../utils/colors';

interface CollaborationRoomProps {
  roomId: string;
  localUser: LocalUser;
  onLeave: () => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconLogOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconInfo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconZap = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Copy Room ID button ──────────────────────────────────────────────────────
const CopyRoomId: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const ta = document.createElement('textarea');
      ta.value = roomId;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomId]);

  return (
    <button
      id="copy-room-id-btn"
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all"
      style={{
        background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.1)',
        color: copied ? '#34d399' : '#60a5fa',
        border: copied ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(59,130,246,0.2)',
      }}
      title="Copy Room ID to clipboard"
      aria-label={copied ? 'Room ID copied!' : 'Copy Room ID'}
    >
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// ─── Disconnection banner ─────────────────────────────────────────────────────
const DisconnectedBanner: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'connected') return null;

  const isConnecting = status === 'connecting';

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium"
      style={{
        background: isConnecting ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)',
        color: isConnecting ? '#fbbf24' : '#f87171',
        borderBottom: `1px solid ${isConnecting ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: isConnecting ? '#fbbf24' : '#f87171',
          animation: isConnecting ? 'blink 1s ease-in-out infinite' : undefined,
        }}
      />
      {isConnecting ? 'Reconnecting to server…' : 'Connection lost. Attempting to reconnect…'}
    </div>
  );
};

// ─── Help Panel ───────────────────────────────────────────────────────────────
const HELP_ITEMS = [
  { key: 'Move', desc: 'Move your cursor in the workspace — others see it live' },
  { key: 'Click', desc: 'Click anywhere to create a shared ripple effect' },
  { key: 'Invite', desc: 'Share the Room ID with others to collaborate' },
  { key: 'Leave', desc: 'Click "Leave Room" to exit cleanly' },
];

const HelpPanel: React.FC = () => (
  <div className="glass-card rounded-xl p-4 text-sm">
    <div className="flex items-center gap-2 mb-3">
      <IconInfo />
      <span className="font-semibold text-slate-300">How it works</span>
    </div>
    <ul className="space-y-2">
      {HELP_ITEMS.map((item) => (
        <li key={item.key} className="flex items-start gap-2 text-slate-400 text-xs">
          <svg width="14" height="14" className="mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>
            <strong className="text-slate-300">{item.key}: </strong>
            {item.desc}
          </span>
        </li>
      ))}
    </ul>
    <div
      className="mt-3 px-3 py-2 rounded-lg text-xs text-emerald-400/80 flex items-center gap-1.5"
      style={{
        background: 'rgba(52,211,153,0.06)',
        border: '1px solid rgba(52,211,153,0.15)',
      }}
    >
      <IconZap />
      Real-time via Socket.IO WebSocket
    </div>
  </div>
);

// ─── Activity Feed ────────────────────────────────────────────────────────────
const ActivityFeed: React.FC<{ activities: ActivityEntry[] }> = ({ activities }) => {
  if (activities.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-3" role="log" aria-label="Activity feed" aria-live="polite">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Activity
      </div>
      <ul className="space-y-1.5">
        {activities.map((a) => (
          <li
            key={a.id}
            className="text-xs text-slate-400 animate-activity flex items-start gap-1.5"
          >
            <span className="text-slate-600 mt-0.5" aria-hidden="true">›</span>
            <span>{a.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Empty workspace state ────────────────────────────────────────────────────
const EmptyWorkspaceState: React.FC<{ remoteCount: number; roomId: string }> = ({
  remoteCount,
  roomId,
}) => {
  if (remoteCount > 0) {
    // Workspace has other users — show minimal hint
    return (
      <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none select-none">
        <p className="text-slate-700 text-xs">
          Move your cursor · Click to send ripples
        </p>
      </div>
    );
  }

  // Alone in the room — show the polished empty state
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div className="text-center max-w-xs px-6">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center relative"
          style={{
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.12)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ background: '#3b82f6', animation: 'pulse-ring 2s ease-out infinite' }}
          />
        </div>
        <p className="text-slate-400 text-sm font-semibold mb-1.5">
          You're the only one here
        </p>
        <p className="text-slate-600 text-xs leading-relaxed">
          Share room&nbsp;
          <code className="mono font-semibold text-blue-500">{roomId}</code>
          &nbsp;with a collaborator to start real-time cursor sync.
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CollaborationRoom: React.FC<CollaborationRoomProps> = ({
  roomId,
  localUser,
  onLeave,
}) => {
  const workspaceRef = useRef<HTMLDivElement>(null);
  // localCursor kept in state so the local cursor SVG re-renders on mouse move.
  // This is intentional: only the local cursor element updates, not the whole tree.
  const [localCursor, setLocalCursor] = useState({ x: 0, y: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Real-time hook ──────────────────────────────────────────────────────────
  const {
    remoteUsers,
    connectionStatus,
    activities,
    ripples,
    sendCursorMove,
    sendClick,
    disconnect,
  } = useRealtime({
    roomId,
    userId: localUser.id,
    username: localUser.name,
    color: localUser.color,
  });

  // ── ESC key closes the mobile sidebar ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  // ── Mouse move → throttled cursor broadcast ─────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      setLocalCursor({ x, y });
      sendCursorMove(x, y);
    },
    [sendCursorMove]
  );

  // ── Click → broadcast ripple ────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      sendClick(
        Math.round(e.clientX - rect.left),
        Math.round(e.clientY - rect.top)
      );
    },
    [sendClick]
  );

  // ── Leave handler ───────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    disconnect();
    onLeave();
  }, [disconnect, onLeave]);

  const totalOnline = remoteUsers.length + 1;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Disconnection banner (rendered between header and body) ── */}
      <DisconnectedBanner status={connectionStatus} />

      {/* ── Header ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 h-14 z-20"
        style={{
          background: 'rgba(8,12,20,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Left: Logo + Room info + Copy */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span className="font-bold text-slate-100 hidden sm:block">SyncSpace</span>
          <span className="text-slate-700 hidden sm:block">·</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-500 hidden sm:block">Room</span>
            <code
              className="mono text-sm font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 truncate"
              title={roomId}
            >
              {roomId}
            </code>
            <CopyRoomId roomId={roomId} />
          </div>
        </div>

        {/* Center: Connection Status + Online count */}
        <div className="flex items-center gap-2 md:gap-3">
          <ConnectionStatus status={connectionStatus} />
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-xs text-slate-400 font-medium">
            <IconUsers />
            <span>{totalOnline} online</span>
          </div>
        </div>

        {/* Right: User chip + Leave */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{
                background: hexToRgba(localUser.color, 0.3),
                border: `1.5px solid ${localUser.color}`,
              }}
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-slate-300 truncate max-w-24">
              {localUser.name}
            </span>
          </div>

          <button
            id="leave-room-btn"
            onClick={handleLeave}
            className="btn-secondary text-xs px-3 py-1.5 h-auto hidden sm:flex"
            aria-label="Leave room and return to join screen"
          >
            <IconLogOut />
            Leave
          </button>

          <button
            className="flex sm:hidden items-center justify-center w-9 h-9 rounded-lg glass-card text-slate-400"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Workspace ── */}
        <div
          ref={workspaceRef}
          className="flex-1 relative overflow-hidden cursor-none"
          style={{ background: 'var(--bg-secondary)' }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          role="application"
          aria-label="Collaboration workspace — move your mouse and click to collaborate"
        >
          {/* Grid background */}
          <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" aria-hidden="true" />

          {/* Ambient glow */}
          <div
            className="absolute rounded-full pointer-events-none"
            aria-hidden="true"
            style={{
              width: '60%', height: '50%', left: '20%', top: '25%',
              background: 'radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 70%)',
            }}
          />

          {/* Empty state / hint */}
          <EmptyWorkspaceState remoteCount={remoteUsers.length} roomId={roomId} />

          {/* ── Local cursor ── */}
          <div
            className="absolute pointer-events-none z-40"
            style={{ left: localCursor.x, top: localCursor.y }}
            aria-hidden="true"
          >
            <svg
              width="22" height="26" viewBox="0 0 22 26" fill="none"
              style={{ filter: `drop-shadow(0 2px 6px ${hexToRgba(localUser.color, 0.5)})` }}
            >
              <path
                d="M1 1L1 21L6.5 15.5L10.5 24L13 23L9 14.5L17 14.5L1 1Z"
                fill={localUser.color}
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="absolute top-5 left-4 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: localUser.color, color: '#0a0f1e', whiteSpace: 'nowrap' }}
            >
              {localUser.name} (You)
            </div>
          </div>

          {/* ── Remote cursors ── */}
          {remoteUsers.map((user) => (
            <RemoteCursor key={user.id} user={user} />
          ))}

          {/* ── Click ripples ── */}
          {ripples.map((ripple: ClickRippleType) => (
            <ClickRipple key={ripple.id} ripple={ripple} />
          ))}
        </div>

        {/* ── Sidebar ── */}
        <aside
          id="room-sidebar"
          className={`
            flex-shrink-0 w-72 flex flex-col gap-3 p-4 overflow-y-auto
            transition-transform duration-300 z-30
            sm:relative sm:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            absolute right-0 top-0 bottom-0
            sm:flex
          `}
          style={{
            background: 'rgba(8,12,20,0.9)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}
          aria-label="Room sidebar"
        >
          {/* Mobile: Leave + Close */}
          <div className="flex sm:hidden items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-300">Room Info</span>
            <div className="flex gap-2">
              <button
                onClick={handleLeave}
                className="btn-secondary text-xs px-2.5 py-1.5 h-auto flex"
                aria-label="Leave room"
              >
                <IconLogOut />
                Leave
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg glass-card text-slate-400"
                aria-label="Close sidebar"
              >
                <IconX />
              </button>
            </div>
          </div>

          <UserList users={remoteUsers} localUser={localUser} />

          <div className="border-t border-white/5" role="separator" />

          <ActivityFeed activities={activities} />

          <div className="border-t border-white/5" role="separator" />

          <HelpPanel />

          {/* Coordinate display */}
          <div
            className="glass-card rounded-xl p-3 text-xs text-slate-500 mono"
            style={{ marginTop: 'auto' }}
            aria-label="Local cursor coordinates"
          >
            <div className="text-slate-600 mb-1 font-sans font-medium text-xs">
              Cursor Position
            </div>
            <div className="flex gap-4">
              <span>X:&nbsp;<span className="text-slate-400">{Math.round(localCursor.x)}</span></span>
              <span>Y:&nbsp;<span className="text-slate-400">{Math.round(localCursor.y)}</span></span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CollaborationRoom;
