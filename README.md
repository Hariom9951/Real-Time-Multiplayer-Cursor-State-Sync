# SyncSpace

**Real-Time Multiplayer Cursor Synchronization**

A collaborative workspace where multiple users can see each other's live cursors, click ripples, and presence — synchronized in real-time over WebSocket.

---

## Architecture

```
Browser (React + TypeScript)
        │
        │  socket.io-client
        │  WebSocket / HTTP long-poll
        ▼
Node.js + Socket.IO Server (TypeScript)
        │
        │  In-memory Map<roomId, Room>
        │  Room → Map<userId, User>
        ▼
  Broadcast to room peers
```

The server is **stateless between restarts** (in-memory only). Each browser tab is one socket connection. There is no database, no authentication.

---

## Project Structure

```
syncspace/                  ← Vite + React + TypeScript frontend
  src/
    components/
      JoinRoom.tsx           ← Landing / join form
      CollaborationRoom.tsx  ← Full workspace + sidebar
      RemoteCursor.tsx       ← Per-user cursor (interpolated)
      UserList.tsx           ← Participants panel
      ConnectionStatus.tsx   ← Animated connection badge
      ClickRipple.tsx        ← Shared click animation
    hooks/
      useRealtime.ts         ← All Socket.IO logic (the core hook)
    types/
      multiplayer.ts         ← Shared TypeScript types
    utils/
      colors.ts              ← Deterministic user color palette
  .env.local                 ← VITE_SOCKET_URL=http://localhost:3001
  .env.example               ← Template

server/                     ← Node.js + Express + Socket.IO backend
  src/
    index.ts                 ← Socket event handlers + room management
    types.ts                 ← Server-side payload types
```

---

## Getting Started

### 1. Start the backend

```bash
cd server
npm install
npm run dev          # starts on http://localhost:3001
```

### 2. Start the frontend

```bash
cd syncspace          # (from project root)
npm install
npm run dev          # starts on http://localhost:5173
```

### 3. Test multiplayer

1. Open **Tab A** → `http://localhost:5173` → enter name + room ID → Join
2. Open **Tab B** → same URL → same room ID → Join
3. Move the mouse in Tab B → cursor appears in Tab A
4. Click the workspace → ripple animation appears in both tabs
5. Close Tab B → Tab A user count drops to 1

---

## Environment Variables

| Variable | Side | Default | Description |
|---|---|---|---|
| `VITE_SOCKET_URL` | Frontend | `http://localhost:3001` | Backend Socket.IO URL |
| `PORT` | Backend | `3001` | HTTP listen port |
| `CLIENT_ORIGIN` | Backend | `http://localhost:5173` | CORS allowed origin |

Copy `.env.example` to `.env.local` and set `VITE_SOCKET_URL` for your environment.

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ roomId, userId, username, color }` | Join or re-join a room |
| `cursor_move` | `{ roomId, userId, x, y }` | Broadcast cursor position |
| `cursor_click` | `{ roomId, userId, x, y }` | Broadcast click ripple |
| `leave_room` | `{ roomId, userId }` | Explicit clean leave |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room_state` | `{ roomId, users[] }` | Full room snapshot on join |
| `user_joined` | `{ user }` | New participant arrived |
| `user_left` | `{ userId }` | Participant disconnected |
| `cursor_update` | `{ userId, x, y }` | Remote cursor moved |
| `click_update` | `{ userId, username, color, x, y }` | Shared click ripple |

---

## How It Works

### Joining a Room

1. User fills in a display name and room ID on the landing screen.
2. A stable `userId` is generated and persisted in `sessionStorage` (so browser refreshes reuse the same ID, preventing phantom duplicates).
3. When the socket connects, `join_room` is emitted.
4. The server adds the user to the room, sends `room_state` (current users) to the new joiner, and broadcasts `user_joined` to existing users.

### Presence (Late Joiners)

The server holds an in-memory `Map<roomId, Room>` where each room stores `Map<userId, ServerUser>`. When a user joins late, they immediately receive `room_state` containing all current occupants — no polling required.

### Cursor Synchronization

```
Mouse move event
      │
      ▼
Throttle check (25ms / ~40 Hz ceiling)
      │
      ├── Too soon → discard
      └── OK → socket.emit('cursor_move', { x, y })
                        │
                        ▼
              Server validates + clamps coords
                        │
                        ▼
              socket.to(room).emit('cursor_update')
                        │
                        ▼
              cursorTargetsRef.current.set(userId, { targetX, targetY })
              (no React setState — no re-render on cursor packet)
                        │
                        ▼
              requestAnimationFrame loop (60 Hz display rate)
              LERP displayCursor → targetCursor
              setRemoteUsers only when position changed
```

**Key performance decision:** `cursor_update` packets do **not** call `setRemoteUsers`. They write only to a ref (`cursorTargetsRef`). The rAF loop reads those refs and calls `setRemoteUsers` at display framerate. This decouples the ~40 Hz network rate from React's render cycle.

### Cursor Interpolation

Remote cursors use linear interpolation (LERP) at factor `0.18`:

```
displayX += (targetX - displayX) * 0.18
```

Applied every animation frame (~60 Hz). This produces smooth cursor movement even when network updates arrive at 30–40 Hz, and naturally absorbs network jitter without a heavy animation library.

When a user disconnects, their cursor target is deleted immediately from the ref map and React state, so the cursor disappears on the next frame.

### Click Ripples

1. User clicks the workspace → `cursor_click` emitted.
2. Server validates coords, clamps them, and broadcasts `click_update` to **all** users in the room (including sender).
3. Each client renders a `ClickRipple` component with an expanding ring animation.
4. The ripple auto-removes after 700ms via `setTimeout`.

### Reconnection

Socket.IO is configured with:
- `reconnection: true`
- `reconnectionAttempts: 10`
- `reconnectionDelayMax: 5000ms`

When the socket reconnects, the `connect` event fires again → `join_room` is re-emitted → server re-adds the user, removes the old entry (dedup), sends `room_state`. The UI updates automatically.

During disconnection the `DisconnectedBanner` component shows a yellow/red banner at the top.

### Disconnect Cleanup

On socket `disconnect`, the server:
1. Finds the associated `userId` (tracked per-socket scope).
2. Removes the user from the room's `Map`.
3. Broadcasts `user_left` to remaining users.
4. Deletes empty rooms to prevent memory leaks.

---

## Performance Considerations

| Concern | Approach |
|---|---|
| Mouse move rate | Throttled to 40 Hz (25ms gate, timestamp-based) |
| Cursor rendering | requestAnimationFrame loop, LERP interpolation |
| React re-renders on cursor | Avoided — targets stored in ref, not state |
| Server broadcasts | Scoped to Socket.IO rooms (`socket.to(roomId)`) |
| Memory | Empty rooms deleted on last user leave |
| Coordinate safety | Server clamps x/y to `[0, 8000]` range |
| Socket ownership | `cursor_move` verifies socket.id matches stored socketId |

---

## Security Basics

- Server validates all event payloads (type checks, length limits).
- Cursor move/click events verify the socket owns the claimed `userId` (prevents spoofing).
- User-provided names are rendered as React text nodes (no `dangerouslySetInnerHTML`).
- No sensitive data stored. No authentication.
- Room state is purely in-memory and evicted when empty.

---

## Production Deployment

**Frontend** (Vercel):
1. Set `VITE_SOCKET_URL=https://your-backend.example.com` in Vercel environment variables.
2. `npm run build` → deploy `dist/`.

**Backend** (Railway / Render / Fly.io):
1. Set `CLIENT_ORIGIN=https://your-frontend.vercel.app`.
2. Set `PORT` (usually auto-set by the platform).
3. `npm run build && npm start`.

---

## Scripts

| Directory | Command | Purpose |
|---|---|---|
| `syncspace/` | `npm run dev` | Frontend dev server |
| `syncspace/` | `npm run build` | Frontend production build |
| `server/` | `npm run dev` | Backend dev (tsx watch) |
| `server/` | `npm run build` | Backend TypeScript compile |
| `server/` | `npm start` | Backend production start |
