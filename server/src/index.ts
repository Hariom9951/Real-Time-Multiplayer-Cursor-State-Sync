import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import type {
  ServerRoom,
  ServerUser,
  JoinRoomPayload,
  CursorMovePayload,
  CursorClickPayload,
  PublicUser,
} from './types';

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ─── In-memory room store ─────────────────────────────────────────────────────
const rooms = new Map<string, ServerRoom>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateRoom(roomId: string): ServerRoom {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { roomId, users: new Map() });
  }
  return rooms.get(roomId)!;
}

function toPublicUser(u: ServerUser): PublicUser {
  return {
    userId: u.userId,
    username: u.username,
    color: u.color,
    cursor: u.cursor,
    joinedAt: u.joinedAt,
  };
}

function isValidString(value: unknown, maxLen: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLen;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

/** Clamp cursor coordinates to a sane workspace range (pixels) */
function clampCoord(n: number): number {
  return Math.max(0, Math.min(8000, n));
}

// ─── Express + HTTP server ────────────────────────────────────────────────────
const app = express();

const corsOriginHandler = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow health checks, curl, server-to-server, or mobile requests without origin
  if (!origin) return callback(null, true);

  // If FRONTEND_URL matches or is wildcard
  if (FRONTEND_URL === '*' || origin === FRONTEND_URL) {
    return callback(null, true);
  }

  // Support comma-separated FRONTEND_URL list
  const allowedList = FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowedList.includes(origin)) {
    return callback(null, true);
  }

  // Local development fallback
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return callback(null, true);
  }

  // Allow Vercel preview & production deployments
  if (origin.endsWith('.vercel.app')) {
    return callback(null, true);
  }

  return callback(null, true);
};

app.use(
  cors({
    origin: corsOriginHandler,
    methods: ['GET', 'HEAD', 'POST'],
    credentials: true,
  })
);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
  });
});

const httpServer = createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Recommended transport settings for reliability
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ─── Socket event handlers ────────────────────────────────────────────────────
io.on('connection', (socket: Socket) => {
  console.log(`[connect] socket=${socket.id}`);

  // Track which room/userId this socket belongs to (for cleanup on disconnect)
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  // ── join_room ──────────────────────────────────────────────────────────────
  socket.on('join_room', (payload: unknown) => {
    const p = payload as JoinRoomPayload;

    // Server-side validation
    if (
      !isValidString(p?.roomId, 32) ||
      !isValidString(p?.username, 40) ||
      !isValidString(p?.userId, 64) ||
      !isValidString(p?.color, 20)
    ) {
      socket.emit('error', { message: 'Invalid join payload' });
      return;
    }

    const roomId    = p.roomId.trim().toUpperCase();
    const username  = p.username.trim();
    const userId    = p.userId.trim();
    const color     = p.color.trim();

    // Store for disconnect cleanup
    currentRoomId = roomId;
    currentUserId = userId;

    // Get or create room
    const room = getOrCreateRoom(roomId);

    // If this userId already exists (e.g. reconnect), remove old entry
    room.users.delete(userId);

    const user: ServerUser = {
      userId,
      username,
      color,
      socketId: socket.id,
      cursor: { x: 0, y: 0 },
      joinedAt: Date.now(),
    };

    room.users.set(userId, user);

    // Join the Socket.IO room
    void socket.join(roomId);

    console.log(`[join_room] user="${username}" room="${roomId}" total=${room.users.size}`);

    // Send current room state to the newly joined user
    const roomState = {
      roomId,
      users: Array.from(room.users.values())
        .filter((u) => u.userId !== userId) // exclude self
        .map(toPublicUser),
    };
    socket.emit('room_state', roomState);

    // Notify everyone else in the room
    socket.to(roomId).emit('user_joined', { user: toPublicUser(user) });
  });

  // ── cursor_move ────────────────────────────────────────────────────────────
  socket.on('cursor_move', (payload: unknown) => {
    const p = payload as CursorMovePayload;

    if (
      !isValidString(p?.roomId, 32) ||
      !isValidString(p?.userId, 64) ||
      !isValidNumber(p?.x) ||
      !isValidNumber(p?.y)
    ) {
      return; // silently ignore malformed cursor data
    }

    const roomId = p.roomId.trim().toUpperCase();
    const room   = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(p.userId.trim());
    if (!user) return;

    // Security: verify this socket owns the userId it claims to move
    if (user.socketId !== socket.id) return;

    // Clamp coordinates to prevent layout-breaking values
    const x = clampCoord(p.x);
    const y = clampCoord(p.y);

    user.cursor = { x, y };

    socket.to(roomId).emit('cursor_update', { userId: user.userId, x, y });
  });

  // ── cursor_click ───────────────────────────────────────────────────────────
  socket.on('cursor_click', (payload: unknown) => {
    const p = payload as CursorClickPayload;

    if (
      !isValidString(p?.roomId, 32) ||
      !isValidString(p?.userId, 64) ||
      !isValidNumber(p?.x) ||
      !isValidNumber(p?.y)
    ) {
      return;
    }

    const roomId = p.roomId.trim().toUpperCase();
    const room   = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(p.userId.trim());
    if (!user) return;

    // Security: verify this socket owns the userId
    if (user.socketId !== socket.id) return;

    const x = clampCoord(p.x);
    const y = clampCoord(p.y);

    // Broadcast click to ALL in room (sender sees their own ripple too)
    io.to(roomId).emit('click_update', {
      userId: user.userId,
      username: user.username,
      color: user.color,
      x,
      y,
    });
  });

  // ── leave_room (explicit) ──────────────────────────────────────────────────
  socket.on('leave_room', (payload: unknown) => {
    const p = payload as { roomId: string; userId: string };

    if (!isValidString(p?.roomId, 32) || !isValidString(p?.userId, 64)) return;

    const roomId = p.roomId.trim().toUpperCase();
    const userId = p.userId.trim();

    cleanupUser(socket, roomId, userId);
    currentRoomId = null;
    currentUserId = null;
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[disconnect] socket=${socket.id} reason=${reason}`);

    if (currentRoomId && currentUserId) {
      cleanupUser(socket, currentRoomId, currentUserId);
    }
  });
});

// ─── Cleanup helper ───────────────────────────────────────────────────────────
function cleanupUser(socket: Socket, roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const existed = room.users.delete(userId);
  if (!existed) return;

  console.log(`[leave] user="${userId}" room="${roomId}" remaining=${room.users.size}`);

  // Notify others
  socket.to(roomId).emit('user_left', { userId });

  // Leave the Socket.IO room
  void socket.leave(roomId);

  // Clean up empty rooms
  if (room.users.size === 0) {
    rooms.delete(roomId);
    console.log(`[room_deleted] room="${roomId}"`);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SyncSpace server running on http://0.0.0.0:${PORT}`);
  console.log(`   Configured Frontend URL: ${FRONTEND_URL}\n`);
});
