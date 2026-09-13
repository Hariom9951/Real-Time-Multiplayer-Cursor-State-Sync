// ─── Core Types ───────────────────────────────────────────────────────────────

export interface CursorPosition {
  x: number;
  y: number;
}

export interface RemoteUser {
  id: string;        // same as userId from server
  name: string;      // username
  color: string;
  cursor: CursorPosition;
  // displayed cursor (interpolated toward `cursor`)
  displayCursor: CursorPosition;
  isActive: boolean;
  joinedAt: number;
}

export interface RoomState {
  roomId: string;
  users: RemoteUser[];
  localUser: LocalUser;
  connectionStatus: ConnectionStatus;
}

export interface LocalUser {
  id: string;
  name: string;
  color: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface JoinRoomPayload {
  username: string;
  roomId: string;
}

export interface ValidationErrors {
  username?: string;
  roomId?: string;
}

// ─── Socket event payload types (mirrors server/src/types.ts) ─────────────────

export interface SocketJoinPayload {
  roomId: string;
  username: string;
  userId: string;
  color: string;
}

export interface SocketRoomStatePayload {
  roomId: string;
  users: SocketPublicUser[];
}

export interface SocketPublicUser {
  userId: string;
  username: string;
  color: string;
  cursor: CursorPosition;
  joinedAt: number;
}

export interface SocketUserJoinedPayload {
  user: SocketPublicUser;
}

export interface SocketUserLeftPayload {
  userId: string;
}

export interface SocketCursorUpdatePayload {
  userId: string;
  x: number;
  y: number;
}

export interface SocketClickUpdatePayload {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
}

// ─── Activity feed ────────────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  message: string;
  timestamp: number;
}

// ─── Click ripple ─────────────────────────────────────────────────────────────

export interface ClickRipple {
  id: string;
  x: number;
  y: number;
  color: string;
  username: string;
}
