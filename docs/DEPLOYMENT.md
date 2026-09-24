# 🚀 JobsAPI — Deployment & Operations Guide

---

## 1. Docker Compose Production Deployment

To start the entire platform with MongoDB, Redis, API, Playwright Worker, and React Frontend in isolated containers:

```bash
docker compose up -d --build
```

### Checking Container Health
```bash
docker compose ps
curl http://localhost:5000/health/ready
```

---

## 2. Standalone Service Deployment

### Backend API
```bash
cd backend
npm ci --omit=dev
npm start
```

### Automation Worker
```bash
cd backend
npm run worker
```

### Frontend
```bash
cd frontend
npm ci
npm run build
```
*(Serve `frontend/dist` via Nginx, Cloudflare Pages, or Vercel).*
