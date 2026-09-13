# SyncSpace
### Real-Time Multiplayer Cursor & State Synchronization

## 🚀 Live Demo
- **Frontend App**: [https://real-time-multiplayer-cursor-state-sync.vercel.app](https://real-time-multiplayer-cursor-state-sync.vercel.app) *(or your deployed Vercel domain)*
- **Backend Health Check**: [https://syncspace-production.up.railway.app/health](https://syncspace-production.up.railway.app/health) *(or your deployed Railway/Render domain)*

## 📦 GitHub Repository
[https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync](https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync)

---

## Overview

**SyncSpace** is an ultra-low latency, real-time multiplayer workspace where distributed users interact within shared collaborative rooms. Users experience synchronous multiplayer presence with high-performance cursor tracking, visual click waves, live participant rosters, and instant join/leave synchronization powered by WebSockets and Socket.IO.

---

## Features

- **Real-Time Multiplayer Cursor Synchronization**: Live coordinates transmitted across peers with sub-25ms network response.
- **Room-Based Collaboration**: Isolated collaboration spaces identified by Room IDs, preventing cross-room event leaking.
- **User Presence**: Live tracking of online peers, participant counts, and unique deterministic color assignments.
- **Smooth Cursor Interpolation**: Linear interpolation (LERP) decoupled from network packets via `requestAnimationFrame` for buttery-smooth 60 FPS remote cursor motion.
- **Shared Click Indicators**: Interactive ripple wave animations broadcast across peers on canvas clicks.
- **Real-Time Activity Feed**: Toast and event updates notifying users when peers join or leave.
- **Reconnection Handling**: Resilient Socket.IO reconnection logic with exponential backoff and automatic room re-join.
- **Server-Side Validation**: Strict input boundary validation, string length limits, numeric coordinate bounds, and socket ownership verification.
- **Performance-Conscious Cursor Updates**: ~40 FPS client throttling with coordinate refs, avoiding wasteful React re-renders.
- **Responsive UI**: Modern glassmorphic interface built with Tailwind CSS, supporting varied screen sizes and keyboard shortcuts.

---

## Tech Stack

### Frontend
- **React (v19)**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Socket.IO Client**
- **Lucide Icons & Canvas Confetti**

### Backend
- **Node.js**
- **Express**
- **Socket.IO (v4)**
- **TypeScript & tsx**
- **CORS**

---

## Architecture

```
Browser
   ↓
React + TypeScript
   ↓
Socket.IO Client
   ↓
WebSocket / Polling Fallback
   ↓
Node.js + Socket.IO Server
   ↓
In-memory Room State (Map<RoomId, Room>)
```

---

## Real-Time Flow

1. **User Joins a Room**: Client specifies username and roomId on the join screen and sends `join_room`.
2. **Socket.IO Connection Established**: Transport establishes a reliable full-duplex WebSocket connection.
3. **Server Registers Presence**: Server assigns the socket to the room, stores user metadata in the in-memory room store, and emits `room_state` to the newcomer while broadcasting `user_joined` to peers.
4. **Cursor Updates Throttled**: As local mouse moves, coordinates are throttled to ~40 FPS (25ms window) before emitting `cursor_move`.
5. **Server Broadcasts Updates**: Server validates coordinate bounds (`[0, 8000]`), verifies socket ownership, and broadcasts `cursor_update` only to room peers (`socket.to(roomId)`).
6. **Clients Interpolate Remote Positions**: Receiving peers store target coordinates in refs and compute smooth positions every frame via `requestAnimationFrame` LERP (`pos += (target - pos) * 0.18`).
7. **Disconnects Cleaned Up**: When a tab is closed, `disconnect` triggers automatic removal from room state, emits `user_left` to peers, and evicts empty rooms to prevent memory leaks.
8. **Reconnection Restores Room Presence**: If connection drops, Socket.IO automatically reconnects and re-registers the user without requiring a manual page refresh.

---

## Performance

- **~40 FPS Cursor Throttling**: Network bandwidth is conserved by preventing raw mouse events from flooding the socket.
- **requestAnimationFrame Interpolation**: Cursor motion is decoupled from network packet arrival rate; display renders at the monitor's native refresh rate.
- **Minimized React Renders**: Frequent coordinate updates bypass React component state by storing live targets in mutable refs, triggering renders only on display updates.
- **Room-Scoped Broadcasts**: Events are strictly dispatched to relevant rooms via `socket.to(roomId).emit()`, guaranteeing $O(N)$ efficiency per room rather than global $O(M)$ broadcast overhead.
- **In-Memory Room State**: Instantaneous lookups using native `Map<string, Room>` without disk or database roundtrip latency.

---

## Security / Validation

- **Server-Side Validation**: All incoming payloads are validated for correct data types, length boundaries (roomId $\le$ 32 chars, username $\le$ 40 chars), and finite numbers.
- **Socket Ownership Checks**: Each socket can only emit updates for the `userId` associated with its own connection, preventing identity spoofing.
- **Room-Scoped Events**: Sockets must be active members of a room to broadcast to it.
- **Coordinate Validation**: Numerical clamping restricts all $(X, Y)$ inputs to safe viewport boundaries (`0` to `8000`), preventing rendering glitches or overflow exploits.
- **Safe User-Name Rendering**: User strings are rendered as standard React text nodes, preventing XSS injection.

---

## Local Development

### 1. Frontend Setup
```bash
# From the project root
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

### 2. Backend Setup
```bash
# In another terminal
cd server
npm install
npm run dev
```
The backend starts on `http://localhost:3001`.

### 3. Environment Variables
Create `.env.local` in the project root:
```env
VITE_SOCKET_URL=http://localhost:3001
```
*(Note: `.env.local` is ignored by Git to keep environment configurations clean and private).*

---

## Deployment

### Backend Deployment (Railway or Render)
1. Link your repository: `https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync`
2. Set Root Directory to: `server`
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Environment Variables:
   - `PORT`: (configured automatically by host)
   - `FRONTEND_URL`: `https://YOUR-VERCEL-FRONTEND.vercel.app`
6. Verify deployment by visiting:
   ```
   https://YOUR-BACKEND-URL/health
   # Response: {"status":"ok"}
   ```

### Frontend Deployment (Vercel)
1. Import the repository: `https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync`
2. Root Directory: `./` (or project root)
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_SOCKET_URL`: `https://YOUR-BACKEND-URL`
7. Deploy.

---

## Multiplayer Testing

To test real-time synchronization across multiple users:
1. Open your browser to the deployed frontend URL (or `http://localhost:5173`).
2. Enter username **"User A"** and room ID **"ROOM1"**, then click **Join Room**.
3. In a second tab/browser window, open the same URL, enter username **"User B"** and room ID **"ROOM1"**, then join.
4. In a third tab/browser window, enter username **"User C"** and room ID **"ROOM1"**, then join.
5. Move cursors across windows to observe real-time color-coded remote cursors with smooth interpolation.
6. Click anywhere on the workspace to observe synchronized ripple animations across all peers.
7. Close one tab to verify instant user departure and count decrement in remaining windows.

---

## Future Improvements

*(Possible future work)*
- **Persistent Rooms**: Saving canvas state and room session history across server restarts.
- **Authentication**: User accounts with OAuth and secure JWT tokens.
- **Redis Adapter for Horizontal Scaling**: Distributing Socket.IO instances across multiple container nodes using Redis pub/sub.
- **Database Persistence**: Storing user profiles and collaborative workspaces in PostgreSQL or MongoDB.
- **Collaborative Drawing**: Vector stroke and freehand synchronized canvas sketching.
- **Shared Text Editing**: Operational transformation (OT) or CRDT-based live collaborative text pads.
