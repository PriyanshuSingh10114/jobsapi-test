# 💻 JobsAPI — Local Development Guide

---

## 1. Prerequisites
- **Node.js**: `v18.x`, `v20.x`, or `v22.x`
- **MongoDB**: `mongodb://localhost:27017/jobsapi`
- **Redis**: `127.0.0.1:6379` (Required for BullMQ queue processing)
- **Playwright Chromium**: `npx playwright install chromium`

---

## 2. Quick Setup

```bash
# 1. Backend Setup
cd backend
npm install
npx playwright install chromium
npm run dev

# 2. Worker Setup (Separate Terminal)
cd backend
npm run worker

# 3. Frontend Setup (Separate Terminal)
cd frontend
npm install
npm run dev
```

---

## 3. Running Test Suites

```bash
cd backend

# Run all test suites
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```
