/**
 * Centralized Environment Configuration & Validation Module
 * Standardizes all application configuration and enforces fail-fast startup checks.
 */
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// Standardized MongoDB URI (supports MONGODB_URI with legacy MONGO_URI fallback)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || (isTest ? 'mongodb://localhost:27017/jobsapi_test' : 'mongodb://localhost:27017/jobsapi');

const config = {
  SERVER: {
    env: NODE_ENV,
    isProduction,
    isTest,
    port: parseInt(process.env.PORT, 10) || 5000,
    apiPrefix: '/api',
    corsOrigins: isProduction
      ? [process.env.FRONTEND_URL].filter(Boolean)
      : [
          process.env.FRONTEND_URL,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:3000'
        ].filter(Boolean)
  },
  DATABASE: {
    uri: MONGODB_URI,
    options: {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 20,
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  REDIS: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  },
  FRONTEND: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  AUTH: {
    jwtSecret: process.env.JWT_SECRET || (isProduction ? null : 'dev_insecure_jwt_secret_change_in_prod'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminApiKey: process.env.ADMIN_API_KEY || (isProduction ? null : 'dev_admin_api_key_12345'),
    defaultUserId: process.env.DEFAULT_USER_ID || 'local_admin_1'
  },
  ATS: {
    usajobs: {
      apiKey: process.env.USAJOBS_API_KEY || '',
      userAgent: process.env.USAJOBS_USER_AGENT || process.env.USAJOBS_EMAIL || 'support@jobsapi.local'
    },
    syncIntervalHours: parseInt(process.env.SYNC_INTERVAL_HOURS, 10) || 6,
    retentionDays: parseInt(process.env.JOB_RETENTION_DAYS, 10) || 30,
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS, 10) || 10,
    strictUSMode: process.env.STRICT_US_MODE === 'true'
  },
  AUTOMATION: {
    browserPoolSize: parseInt(process.env.BROWSER_POOL_SIZE, 10) || 5,
    headless: isProduction ? true : process.env.PLAYWRIGHT_HEADLESS !== 'false',
    pageTimeoutMs: parseInt(process.env.PLAYWRIGHT_PAGE_TIMEOUT_MS, 10) || 30000,
    navigationTimeoutMs: parseInt(process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT_MS, 10) || 45000,
    concurrency: parseInt(process.env.AUTOMATION_CONCURRENCY, 10) || 3
  },
  STORAGE: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
    allowedMimeTypes: ['application/pdf']
  },
  OBSERVABILITY: {
    logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
    enableTelemetry: process.env.ENABLE_TELEMETRY !== 'false'
  },
  // Backward compatibility convenience getters
  get retentionDays() { return this.ATS.retentionDays; },
  get syncIntervalHours() { return this.ATS.syncIntervalHours; },
  get strictUSMode() { return this.ATS.strictUSMode; }
};

/**
 * Validates mandatory environment variables.
 * Fails fast with descriptive errors without leaking secret values.
 */
function validateConfig() {
  const missingKeys = [];

  if (isProduction) {
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
      missingKeys.push('MONGODB_URI');
    }
    if (!process.env.FRONTEND_URL) {
      missingKeys.push('FRONTEND_URL');
    }
    if (!process.env.JWT_SECRET) {
      missingKeys.push('JWT_SECRET');
    }
  }

  if (missingKeys.length > 0) {
    const errorMsg = `[Config Error] Missing mandatory environment variables in ${NODE_ENV} mode: ${missingKeys.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

// Run validation immediately on module load
validateConfig();

module.exports = config;
