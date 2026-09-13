# SyncSpace — Real-Time Multiplayer Cursor & State Sync

SyncSpace is a real-time collaborative workspace where multiple users can join the same room and see each other's cursor movements, clicks, presence, and activity updates in real time. The application uses Socket.IO for real-time communication.

---

## 🚀 Live Demo

- **Frontend:** [https://real-time-multiplayer-cursor-state-tau.vercel.app](https://real-time-multiplayer-cursor-state-tau.vercel.app)
- **Backend:** [https://syncspace-backend-1rzf.onrender.com](https://syncspace-backend-1rzf.onrender.com)
- **Backend Health Check:** [https://syncspace-backend-1rzf.onrender.com/health](https://syncspace-backend-1rzf.onrender.com/health)
- **GitHub Repository:** [https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync](https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync)

The frontend is deployed on Vercel and the real-time Socket.IO backend is deployed on Render.

---

## ✨ Features

- Real-time multiplayer cursor synchronization
- Multiple users in the same collaboration room
- Live online user count
- Deterministic user colors
- Real-time cursor interpolation using requestAnimationFrame
- Synchronized click ripple effects
- Real-time activity feed
- User join/leave presence events
- Automatic reconnection and room re-joining
- Connection status indicator
- Reconnecting / connection-lost states
- Copy Room ID functionality
- Empty-room state
- Mobile-responsive sidebar
- Keyboard accessibility
- Server-side coordinate validation
- Socket ownership validation
- Production-ready CORS configuration

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS / responsive design

### Backend
- Node.js
- Express
- Socket.IO
- TypeScript

### Deployment
- Vercel — Frontend
- Render — Backend

### Development
- Git
- GitHub

---

## 🏗️ Architecture

```text
┌──────────────────────────────┐
│            Vercel            │
│      React + TypeScript      │
│        Vite Frontend         │
└──────────────┬───────────────┘
               │
               │ Socket.IO
               │ WebSocket
               ▼
┌──────────────────────────────┐
│            Render            │
│      Node.js + Express       │
│          Socket.IO           │
└──────────────┬───────────────┘
               │
               ▼
       Room / User State
     Cursor / Click Events
      Presence / Activity
```

Clients connect to the Socket.IO backend and join a room. Cursor movement, click events, presence changes, and activity events are broadcast to other clients in the same room.

---

## 🔄 Real-Time Flow

1. User opens the SyncSpace frontend.
2. User enters or generates a Room ID.
3. Client establishes a Socket.IO connection.
4. Client joins the selected room.
5. Backend registers the user's socket and presence.
6. Cursor movements are throttled before transmission.
7. Server broadcasts cursor updates to other users.
8. Clients interpolate remote cursor positions using `requestAnimationFrame`.
9. Click events are broadcast to all room participants.
10. Join/leave events update presence and the activity feed.
11. Socket.IO reconnection automatically restores the room state.

---

## ⚡ Performance

- Cursor updates are throttled to reduce network traffic.
- Remote cursor targets are stored efficiently rather than triggering unnecessary React renders for every cursor packet.
- `requestAnimationFrame` is used for smooth remote cursor interpolation.
- Cursor targets are removed immediately when a user leaves.
- Socket listeners, timers, and animation loops are cleaned up appropriately.

---

## 🔐 Security & Validation

- Socket ownership is verified for cursor and click events.
- Server validates and clamps cursor coordinates.
- Socket.IO CORS is restricted to the deployed frontend.
- Environment secrets are not committed.
- `.env.local` is excluded through `.gitignore`.
- `.env.example` documents required configuration.
- Server-side validation prevents clients from spoofing another socket's identity.

---

## 📁 Project Structure

```text
syncspace/
├── src/
│   ├── components/
│   │   ├── JoinRoom.tsx
│   │   ├── CollaborationRoom.tsx
│   │   ├── RemoteCursor.tsx
│   │   ├── UserList.tsx
│   │   ├── ConnectionStatus.tsx
│   │   └── ClickRipple.tsx
│   ├── hooks/
│   │   └── useRealtime.ts
│   ├── types/
│   │   └── multiplayer.ts
│   ├── utils/
│   │   └── colors.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
├── public/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## 💻 Local Development

### Prerequisites
- Node.js
- npm

### Frontend
```bash
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

### Backend
Open another terminal:
```bash
cd server
npm install
npm run dev
```
Backend runs on: `http://localhost:3001`

---

## 🔧 Environment Variables

### Frontend
- Local: `VITE_SOCKET_URL=http://localhost:3001`
- Production: `VITE_SOCKET_URL=https://syncspace-backend-1rzf.onrender.com`

### Backend
- Local: `FRONTEND_URL=http://localhost:5173`
- Production: `FRONTEND_URL=https://real-time-multiplayer-cursor-state-tau.vercel.app`

> Do not commit `.env.local` or other secret environment files.

---

## ☁️ Deployment

### Frontend — Vercel
- **Repository:** [https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync](https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync)
- **Framework:** Vite
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output:** `dist`
- **Production Variable:** `VITE_SOCKET_URL=https://syncspace-backend-1rzf.onrender.com`

### Backend — Render
- **Repository:** [https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync](https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync)
- **Root Directory:** `server`
- **Build:** `npm run build`
- **Start:** `npm start`
- **Production Variable:** `FRONTEND_URL=https://real-time-multiplayer-cursor-state-tau.vercel.app`
- **Health Endpoint:** [https://syncspace-backend-1rzf.onrender.com/health](https://syncspace-backend-1rzf.onrender.com/health)

---

## 🧪 Production Verification

| Test | Result |
|---|---|
| Frontend deployment | ✅ PASS |
| Backend deployment | ✅ PASS |
| Backend health check | ✅ PASS |
| 2-user multiplayer | ✅ PASS |
| 3-user multiplayer | ✅ PASS |
| Cursor synchronization | ✅ PASS |
| Click synchronization | ✅ PASS |
| Activity feed | ✅ PASS |
| Presence tracking | ✅ PASS |
| Reconnection | ✅ PASS |
| Mobile responsiveness | ✅ PASS |
| Frontend build | ✅ PASS |
| Backend build | ✅ PASS |
| TypeScript checks | ✅ PASS |
| CORS validation | ✅ PASS |
| Socket validation | ✅ PASS |
| Coordinate validation | ✅ PASS |

---

## 👥 Multiplayer Test

1. Open the [Live Demo](https://real-time-multiplayer-cursor-state-tau.vercel.app).
2. Create or enter a Room ID.
3. Open the same Live Demo in another browser/incognito window.
4. Join the same Room ID with another username.
5. Verify both users appear in the participant list.
6. Move the mouse and verify remote cursor synchronization.
7. Click the workspace and verify the shared click ripple.
8. Open a third client to verify 3-user synchronization.

---

## 📌 Production Note

> The Render free instance may spin down after inactivity. The first request after inactivity can therefore take longer while the backend wakes up.

---

## 📋 Submission Links

- **Live Application:** [https://real-time-multiplayer-cursor-state-tau.vercel.app](https://real-time-multiplayer-cursor-state-tau.vercel.app)
- **GitHub Repository:** [https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync](https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync)
- **Backend:** [https://syncspace-backend-1rzf.onrender.com](https://syncspace-backend-1rzf.onrender.com)
- **Health Check:** [https://syncspace-backend-1rzf.onrender.com/health](https://syncspace-backend-1rzf.onrender.com/health)
