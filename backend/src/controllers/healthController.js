const mongoose = require('mongoose');
const Redis = require('ioredis');
const config = require('../config');
const Job = require('../models/Job');
const Source = require('../models/Source');
const logger = require('../config/logger');

/**
 * Health & Readiness Controller
 */
exports.getLiveness = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.SERVER.env,
    version: '1.0.0'
  });
};

exports.getReadiness = async (req, res) => {
  const checks = {
    database: { status: 'down', latencyMs: 0 },
    redis: { status: 'down', latencyMs: 0 },
    memory: {
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  };

  let isReady = true;

  // 1. Check MongoDB Ping
  try {
    const dbStart = Date.now();
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      checks.database.status = 'healthy';
      checks.database.latencyMs = Date.now() - dbStart;
    } else {
      checks.database.status = 'connecting';
      isReady = false;
    }
  } catch (err) {
    checks.database.status = 'unhealthy';
    checks.database.error = err.message;
    isReady = false;
  }

  // 2. Check Redis Ping
  try {
    const redisStart = Date.now();
    const redis = new Redis({
      host: config.REDIS.host,
      port: config.REDIS.port,
      password: config.REDIS.password,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });
    await redis.connect();
    const pong = await redis.ping();
    await redis.quit();
    if (pong === 'PONG') {
      checks.redis.status = 'healthy';
      checks.redis.latencyMs = Date.now() - redisStart;
    }
  } catch (err) {
    checks.redis.status = 'unhealthy';
    checks.redis.error = err.message;
    // In dev mode, redis being optional for pure search allows non-blocking readiness
    if (config.SERVER.isProduction) {
      isReady = false;
    }
  }

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json({
    status: isReady ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  });
};

exports.getSystemMetrics = async (req, res, next) => {
  try {
    const [totalJobs, activeJobs, sourcesCount, totalSources] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ is_active: true }),
      Source.countDocuments({ status: 'Healthy' }),
      Source.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          memory: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        database: {
          totalJobs,
          activeJobs,
          sourcesHealthy: sourcesCount,
          totalSources
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
