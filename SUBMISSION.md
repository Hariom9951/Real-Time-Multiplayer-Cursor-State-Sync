# SyncSpace — Frontend R&D Assignment

## Live Demo
- **Frontend**: [https://real-time-multiplayer-cursor-state-sync.vercel.app](https://real-time-multiplayer-cursor-state-sync.vercel.app) *(or deployed Vercel domain)*
- **Local Dev Demo**: [http://localhost:5173](http://localhost:5173)

## GitHub Repository
[https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync](https://github.com/Hariom9951/Real-Time-Multiplayer-Cursor-State-Sync)

## Backend
- **Production URL**: [https://syncspace-production.up.railway.app](https://syncspace-production.up.railway.app) *(or deployed Railway/Render domain)*
- **Health Check Endpoint**: `/health` (returns `{"status":"ok"}`)
- **Local Server**: [http://localhost:3001](http://localhost:3001)

## Technology
- **Frontend**: React (v19) + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO (v4) + TypeScript

## Core Feature
Real-time multiplayer cursor and state synchronization:
- Low-latency (~40 FPS) network cursor synchronization
- requestAnimationFrame LERP smoothing
- Synchronized click ripples and activity feed
- In-memory room isolation and presence tracking
- Automatic reconnection and disconnect cleanup

## Testing
- **2-User Multiplayer Testing**: COMPLETED & VERIFIED (Tab A & Tab B synchronized cursor, click ripple, presence count, disconnect cleanup).
- **3-User Multiplayer Testing**: COMPLETED & VERIFIED (Hariom, Priya, Marco multi-party concurrency, individual colors, zero cursor collision, leave room handling).
- **Production Build Testing**: COMPLETED & VERIFIED (Frontend Vite build 0 errors, Backend TypeScript build 0 errors).
- **Production Deployment Readiness**: COMPLETED (Repository pushed cleanly to `origin/main`, CORS configured with `FRONTEND_URL`, health check `/health` ready).
