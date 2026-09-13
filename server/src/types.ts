// ─── Shared server-side types for SyncSpace ───────────────────────────────────

export interface ServerUser {
  userId: string;
  username: string;
  color: string;
  socketId: string;
  cursor: { x: number; y: number };
  joinedAt: number;
}

export interface ServerRoom {
  roomId: string;
  users: Map<string, ServerUser>; // keyed by userId
}

// ─── Client → Server event payloads ───────────────────────────────────────────

export interface JoinRoomPayload {
  roomId: string;
  username: string;
  userId: string;
  color: string;
}

export interface CursorMovePayload {
  roomId: string;
  userId: string;
  x: number;
  y: number;
}

export interface CursorClickPayload {
  roomId: string;
  userId: string;
  x: number;
  y: number;
}

export interface LeaveRoomPayload {
  roomId: string;
  userId: string;
}

// ─── Server → Client event payloads ───────────────────────────────────────────

export interface RoomStatePayload {
  roomId: string;
  users: PublicUser[];
}

export interface UserJoinedPayload {
  user: PublicUser;
}

export interface UserLeftPayload {
  userId: string;
}

export interface CursorUpdatePayload {
  userId: string;
  x: number;
  y: number;
}

export interface ClickUpdatePayload {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
}

// ─── Public user shape (sent to clients) ──────────────────────────────────────

export interface PublicUser {
  userId: string;
  username: string;
  color: string;
  cursor: { x: number; y: number };
  joinedAt: number;
}
