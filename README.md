# MessPulse AI

A production-style full-stack demo for a smart hostel mess feedback and live analytics platform.

## Features
- Premium React + Tailwind-inspired dashboard experience
- Student, staff, and overview views
- Live Socket.IO feedback channel
- Express backend with health endpoint and live event broadcasting

## Run locally

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd server
node server.js
```

## Notes
- The frontend is currently wired to a demo experience with live UI sections and real-time event hooks.
- The backend exposes a Socket.IO server and a health endpoint at /api/health.
