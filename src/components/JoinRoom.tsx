import React, { useState, useCallback } from 'react';
import type { JoinRoomPayload, ValidationErrors } from '../types/multiplayer';

interface JoinRoomProps {
  onJoin: (payload: JoinRoomPayload) => void;
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconHash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconAlertCircle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ─── Room ID generator ────────────────────────────────────────────────────────
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function validateForm(username: string, roomId: string): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!username.trim()) {
    errors.username = 'Username is required.';
  } else if (username.trim().length < 2) {
    errors.username = 'Username must be at least 2 characters.';
  } else if (username.trim().length > 32) {
    errors.username = 'Username must be 32 characters or fewer.';
  }

  if (!roomId.trim()) {
    errors.roomId = 'Room ID is required.';
  } else if (!/^[A-Z0-9]{4,16}$/i.test(roomId.trim())) {
    errors.roomId = 'Room ID must be 4–16 alphanumeric characters.';
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────
const JoinRoom: React.FC<JoinRoomProps> = ({ onJoin }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId]     = useState('');
  const [touched, setTouched]   = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleGenerateRoom = useCallback(() => {
    const newId = generateRoomId();
    setRoomId(newId);
    setTouched((prev) => ({ ...prev, roomId: false }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(username, roomId);
    setTouched({ username: true, roomId: true });

    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    // Simulate network latency — will be replaced with real socket connect in Part 2
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);

    onJoin({ username: username.trim(), roomId: roomId.trim().toUpperCase() });
  };

  const currentErrors = touched.username || touched.roomId
    ? validateForm(username, roomId)
    : {};

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh opacity-60" />

      {/* Glow orbs */}
      <div
        className="glow-orb w-96 h-96 opacity-20"
        style={{ background: '#3b82f6', top: '-10%', left: '-5%' }}
      />
      <div
        className="glow-orb w-80 h-80 opacity-15"
        style={{ background: '#7c3aed', bottom: '-5%', right: '-5%' }}
      />
      <div
        className="glow-orb w-64 h-64 opacity-10"
        style={{ background: '#06b6d4', top: '40%', right: '10%' }}
      />

      {/* Floating demo cursors */}
      <DemoCursors />

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-md animate-fade-in-up"
        style={{ animationDelay: '0.1s', opacity: 0 }}
      >
        {/* Logo + Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 relative"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-1">
            <span className="gradient-text">SyncSpace</span>
          </h1>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-6 mt-1"
            style={{
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.25)',
              color: '#34d399',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Real-time collaboration platform
          </div>

          <h2 className="text-xl font-semibold text-slate-100 mb-2 leading-snug">
            Real-Time Collaboration,{' '}
            <span className="gradient-text">In Sync.</span>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Join a room and experience seamless real-time collaboration with
            synchronized cursors and shared state.
          </p>
        </div>

        {/* Form card */}
        <div
          className="glass-card rounded-2xl p-7"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        >
          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="mb-5">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Display Name
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  <IconUser />
                </span>
                <input
                  id="username"
                  type="text"
                  className={`input-field pl-9 ${
                    touched.username && currentErrors.username ? 'error' : ''
                  }`}
                  placeholder="e.g. Alex Chen"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => handleBlur('username')}
                  autoComplete="nickname"
                  maxLength={32}
                  aria-describedby={currentErrors.username ? 'username-error' : undefined}
                />
              </div>
              {touched.username && currentErrors.username && (
                <p
                  id="username-error"
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
                >
                  <IconAlertCircle />
                  {currentErrors.username}
                </p>
              )}
            </div>

            {/* Room ID */}
            <div className="mb-6">
              <label
                htmlFor="roomId"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Room ID
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <IconHash />
                </span>
                <input
                  id="roomId"
                  type="text"
                  className={`input-field pl-9 pr-28 mono tracking-widest uppercase ${
                    touched.roomId && currentErrors.roomId ? 'error' : ''
                  }`}
                  placeholder="e.g. ABCD1234"
                  value={roomId}
                  onChange={(e) =>
                    setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  }
                  onBlur={() => handleBlur('roomId')}
                  maxLength={16}
                  aria-describedby={currentErrors.roomId ? 'roomId-error' : undefined}
                />
                <button
                  type="button"
                  onClick={handleGenerateRoom}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  title="Generate random Room ID"
                >
                  <IconRefresh />
                  Generate
                </button>
              </div>
              {touched.roomId && currentErrors.roomId && (
                <p
                  id="roomId-error"
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
                >
                  <IconAlertCircle />
                  {currentErrors.roomId}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                id="join-room-btn"
                type="submit"
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining Room…
                  </>
                ) : (
                  <>
                    Join Room
                    <IconArrowRight />
                  </>
                )}
              </button>

              <button
                id="generate-room-btn"
                type="button"
                className="btn-secondary w-full"
                onClick={() => {
                  handleGenerateRoom();
                }}
              >
                <IconRefresh />
                Generate Room ID
              </button>
            </div>
          </form>

          {/* Footer hint */}
          <p className="text-center text-xs text-slate-600 mt-5">
            Share the Room ID with your collaborators to invite them.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {['Live Cursors', 'Shared State', 'Instant Sync', 'Zero Latency'].map(
            (feat) => (
              <span
                key={feat}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#6b7280',
                }}
              >
                {feat}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Decorative floating cursors ──────────────────────────────────────────────
const DEMO_CURSORS = [
  { name: 'Priya', color: '#6EE7B7', x: '15%', y: '25%', delay: '0s' },
  { name: 'Marco', color: '#93C5FD', x: '75%', y: '60%', delay: '2s' },
  { name: 'Yuki', color: '#F9A8D4', x: '85%', y: '20%', delay: '4s' },
];

const DemoCursors: React.FC = () => (
  <>
    {DEMO_CURSORS.map((c) => (
      <div
        key={c.name}
        className="absolute pointer-events-none animate-cursor-float hidden lg:block"
        style={{
          left: c.x,
          top: c.y,
          animationDelay: c.delay,
          opacity: 0.55,
          zIndex: 5,
        }}
      >
        <svg width="18" height="22" viewBox="0 0 22 26" fill="none">
          <path
            d="M1 1L1 21L6.5 15.5L10.5 24L13 23L9 14.5L17 14.5L1 1Z"
            fill={c.color}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className="mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: c.color, color: '#0a0f1e', whiteSpace: 'nowrap' }}
        >
          {c.name}
        </div>
      </div>
    ))}
  </>
);

export default JoinRoom;
