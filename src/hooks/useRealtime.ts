import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  RemoteUser,
  ConnectionStatus,
  ActivityEntry,
  ClickRipple,
  SocketRoomStatePayload,
  SocketUserJoinedPayload,
  SocketUserLeftPayload,
  SocketCursorUpdatePayload,
  SocketClickUpdatePayload,
} from '../types/multiplayer';
import { getColorForUser } from '../utils/colors';

// ─── Config ───────────────────────────────────────────────────────────────────
const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:3001';

/** Minimum ms between cursor_move emissions — ~40 FPS ceiling */
const CURSOR_THROTTLE_MS = 25;

/** Max activity entries kept in state */
const MAX_ACTIVITY = 6;

/** How long a click ripple stays visible (ms) */
const RIPPLE_DURATION_MS = 700;

/**
 * LERP factor for cursor interpolation.
 * Higher = snappier. Lower = smoother (but more lag).
 * 0.18 feels smooth at 40 Hz network updates rendered at 60 Hz display.
 */
const LERP = 0.18;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseRealtimeOptions {
  roomId: string;
  userId: string;
  username: string;
  color: string;
}

interface UseRealtimeReturn {
  remoteUsers: RemoteUser[];
  connectionStatus: ConnectionStatus;
  activities: ActivityEntry[];
  ripples: ClickRipple[];
  sendCursorMove: (x: number, y: number) => void;
  sendClick: (x: number, y: number) => void;
  disconnect: () => void;
}

// ─── Internal cursor-target ref shape (not React state) ───────────────────────
// Storing raw network-received positions in a ref avoids a setState call for
// every cursor_update event (which arrives at ~40 Hz). The rAF loop reads from
// this ref and updates remoteUsers state only when the display position changes.
interface CursorTarget {
  targetX: number;
  targetY: number;
  displayX: number;
  displayY: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRemoteUser(u: {
  userId: string;
  username: string;
  color: string;
  cursor: { x: number; y: number };
  joinedAt: number;
}): RemoteUser {
  return {
    id: u.userId,
    name: u.username,
    color: u.color || getColorForUser(u.userId),
    cursor: u.cursor,
    displayCursor: u.cursor,
    isActive: true,
    joinedAt: u.joinedAt,
  };
}

function makeActivity(message: string): ActivityEntry {
  return { id: `act-${Date.now()}-${Math.random()}`, message, timestamp: Date.now() };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtime({
  roomId,
  userId,
  username,
  color,
}: UseRealtimeOptions): UseRealtimeReturn {
  const socketRef = useRef<Socket | null>(null);

  // React state — drives the actual render
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [connectionStatus, setStatus] = useState<ConnectionStatus>('connecting');
  const [activities, setActivities]   = useState<ActivityEntry[]>([]);
  const [ripples, setRipples]         = useState<ClickRipple[]>([]);

  // ─── Cursor ref map: userId → CursorTarget ──────────────────────────────────
  // Written by socket events (no re-render). Read by the rAF loop which commits
  // to React state only when the interpolated position meaningfully changes.
  const cursorTargetsRef = useRef<Map<string, CursorTarget>>(new Map());

  // Throttle: timestamp of the last cursor_move we emitted
  const lastCursorSendRef = useRef<number>(0);

  // rAF handle
  const rafRef = useRef<number | null>(null);

  // ─── Activity helper ─────────────────────────────────────────────────────────
  const addActivity = useCallback((message: string) => {
    setActivities((prev) => [makeActivity(message), ...prev].slice(0, MAX_ACTIVITY));
  }, []);

  // ─── rAF interpolation loop ──────────────────────────────────────────────────
  // This loop runs at display framerate (~60 Hz) and smoothly interpolates each
  // remote cursor's displayed position toward its network-received target.
  // It only triggers a React re-render when at least one cursor is still moving.
  useEffect(() => {
    function tick() {
      const targets = cursorTargetsRef.current;

      setRemoteUsers((prev) => {
        let anyChanged = false;

        const next = prev.map((u) => {
          const t = targets.get(u.id);
          if (!t) return u;

          const dx = t.targetX - t.displayX;
          const dy = t.targetY - t.displayY;

          if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) {
            // Already at target — snap to exact position and stop moving
            if (
              u.displayCursor.x !== t.targetX ||
              u.displayCursor.y !== t.targetY
            ) {
              anyChanged = true;
              t.displayX = t.targetX;
              t.displayY = t.targetY;
              return { ...u, displayCursor: { x: t.targetX, y: t.targetY } };
            }
            return u;
          }

          // LERP toward target
          const newX = t.displayX + dx * LERP;
          const newY = t.displayY + dy * LERP;
          t.displayX = newX;
          t.displayY = newY;
          anyChanged = true;
          return { ...u, displayCursor: { x: newX, y: newY } };
        });

        return anyChanged ? next : prev;
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []); // runs once for the lifetime of the hook

  // ─── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // ── Connection lifecycle ─────────────────────────────────────────────────
    socket.on('connect', () => {
      setStatus('connected');
      // Re-join the room on every connect (handles initial join AND reconnects)
      socket.emit('join_room', { roomId, userId, username, color });
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setStatus('connecting');
    });

    // ── room_state: full state snapshot for new/reconnecting user ────────────
    socket.on('room_state', (payload: SocketRoomStatePayload) => {
      const users = payload.users.map(makeRemoteUser);

      // Seed cursor targets for all existing users
      const targets = cursorTargetsRef.current;
      targets.clear();
      users.forEach((u) => {
        targets.set(u.id, {
          targetX: u.cursor.x,
          targetY: u.cursor.y,
          displayX: u.cursor.x,
          displayY: u.cursor.y,
        });
      });

      setRemoteUsers(users);

      const others = users.length;
      if (others > 0) {
        addActivity(
          `You joined room ${roomId} — ${others} other${others !== 1 ? 's' : ''} here`
        );
      } else {
        addActivity(`You're the only one in room ${roomId} — share the ID to collaborate`);
      }
    });

    // ── user_joined ──────────────────────────────────────────────────────────
    socket.on('user_joined', (payload: SocketUserJoinedPayload) => {
      const newUser = makeRemoteUser(payload.user);

      // Seed cursor target
      cursorTargetsRef.current.set(newUser.id, {
        targetX: newUser.cursor.x,
        targetY: newUser.cursor.y,
        displayX: newUser.cursor.x,
        displayY: newUser.cursor.y,
      });

      setRemoteUsers((prev) => {
        // Guard against duplicates on rapid reconnects
        const filtered = prev.filter((u) => u.id !== newUser.id);
        return [...filtered, newUser];
      });

      addActivity(`${payload.user.username} joined the room`);
    });

    // ── user_left ────────────────────────────────────────────────────────────
    socket.on('user_left', (payload: SocketUserLeftPayload) => {
      // Remove cursor target immediately so the rAF loop stops animating it
      cursorTargetsRef.current.delete(payload.userId);

      setRemoteUsers((prev) => {
        const leaving = prev.find((u) => u.id === payload.userId);
        if (leaving) addActivity(`${leaving.name} left the room`);
        return prev.filter((u) => u.id !== payload.userId);
      });
    });

    // ── cursor_update: only updates the ref, no setState ────────────────────
    // This is the hot path — runs at ~40 Hz. We deliberately avoid calling
    // setRemoteUsers here; the rAF loop picks up the new target on the next frame.
    socket.on('cursor_update', (payload: SocketCursorUpdatePayload) => {
      const t = cursorTargetsRef.current.get(payload.userId);
      if (t) {
        t.targetX = payload.x;
        t.targetY = payload.y;
      }
    });

    // ── click_update ─────────────────────────────────────────────────────────
    socket.on('click_update', (payload: SocketClickUpdatePayload) => {
      const ripple: ClickRipple = {
        id: `rpl-${Date.now()}-${Math.random()}`,
        x: payload.x,
        y: payload.y,
        color: payload.color,
        username: payload.username,
      };
      setRipples((prev) => [...prev, ripple]);
      addActivity(`${payload.username} clicked the workspace`);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, RIPPLE_DURATION_MS);
    });

    return () => {
      // Explicit leave before disconnect so server cleans up immediately
      if (socket.connected) {
        socket.emit('leave_room', { roomId, userId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  // We intentionally only run this effect once per roomId/userId combo.
  // The `connect` handler re-emits join_room on reconnects so color/username
  // don't need to be in the dep array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]);

  // ─── sendCursorMove (throttled to ~40 FPS) ───────────────────────────────────
  const sendCursorMove = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastCursorSendRef.current >= CURSOR_THROTTLE_MS) {
        lastCursorSendRef.current = now;
        socketRef.current?.emit('cursor_move', { roomId, userId, x, y });
      }
    },
    [roomId, userId]
  );

  // ─── sendClick ────────────────────────────────────────────────────────────────
  const sendClick = useCallback(
    (x: number, y: number) => {
      socketRef.current?.emit('cursor_click', { roomId, userId, x, y });
    },
    [roomId, userId]
  );

  // ─── disconnect (explicit leave) ──────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', { roomId, userId });
    }
    socketRef.current?.disconnect();
  }, [roomId, userId]);

  return {
    remoteUsers,
    connectionStatus,
    activities,
    ripples,
    sendCursorMove,
    sendClick,
    disconnect,
  };
}
