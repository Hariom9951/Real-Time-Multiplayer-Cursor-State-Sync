import React, { useState } from 'react';
import JoinRoom from './components/JoinRoom';
import CollaborationRoom from './components/CollaborationRoom';
import type { JoinRoomPayload, LocalUser } from './types/multiplayer';
import { getColorForUser } from './utils/colors';

// ─── Generate a stable userId for this browser session ─────────────────────────
// (Persisted in sessionStorage so reconnects reuse the same ID)
function getOrCreateUserId(): string {
  const KEY = 'syncspace_user_id';
  const existing = sessionStorage.getItem(KEY);
  if (existing) return existing;
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(KEY, id);
  return id;
}

type AppView = 'join' | 'room';

interface SessionInfo {
  roomId: string;
  localUser: LocalUser;
}

const App: React.FC = () => {
  const [view, setView]         = useState<AppView>('join');
  const [session, setSession]   = useState<SessionInfo | null>(null);

  const handleJoin = (payload: JoinRoomPayload) => {
    const userId = getOrCreateUserId();
    const localUser: LocalUser = {
      id: userId,
      name: payload.username,
      color: getColorForUser(userId),
    };
    setSession({ roomId: payload.roomId, localUser });
    setView('room');
  };

  const handleLeave = () => {
    setSession(null);
    setView('join');
  };

  if (view === 'room' && session) {
    return (
      <CollaborationRoom
        roomId={session.roomId}
        localUser={session.localUser}
        onLeave={handleLeave}
      />
    );
  }

  return <JoinRoom onJoin={handleJoin} />;
};

export default App;
