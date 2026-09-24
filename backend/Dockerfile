# Multi-stage Production Dockerfile for JobsAPI Backend & Automation Worker
FROM node:22-bookworm-slim AS base

WORKDIR /usr/src/app

# Install system dependencies required for Playwright Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: Runtime
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/

# Install Playwright browser binary
RUN npx playwright install chromium

# Create uploads directory and assign ownership
RUN mkdir -p uploads/resumes && chown -R node:node /usr/src/app

USER node

EXPOSE 5000

# Default Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => { if (r.statusCode !== 200) process.exit(1); })"

CMD ["node", "src/server.js"]
