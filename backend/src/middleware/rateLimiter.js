const { RateLimitError } = require('../errors/AppErrors');
const config = require('../config');

/**
 * Lightweight in-memory rate limiter for production edge protection
 */
const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.max || 100;
  const message = options.message || 'Too many requests. Please try again later.';

  const ipHits = new Map();

  // Periodically sweep expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipHits.entries()) {
      if (now - record.resetTime > windowMs) {
        ipHits.delete(key);
      }
    }
  }, windowMs * 2).unref();

  return (req, res, next) => {
    // In test mode, bypass rate limiter
    if (config.SERVER.isTest) {
      return next();
    }

    const clientIp = req.ip || req.connection.remoteAddress || 'unknown-client';
    const key = `${req.baseUrl}_${clientIp}`;
    const now = Date.now();

    let record = ipHits.get(key);
    if (!record || now - record.resetTime > windowMs) {
      record = { count: 1, resetTime: now };
      ipHits.set(key, record);
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((windowMs - (now - record.resetTime)) / 1000));
      return next(new RateLimitError(message, {
        limit: maxRequests,
        windowSeconds: Math.ceil(windowMs / 1000)
      }));
    }

    next();
  };
};

// Specialized Rate Limiters
const apiRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 200 });
const syncRateLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, message: 'Sync operations are rate limited to 10 per 10 minutes' });
const automationRateLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 30, message: 'Automation triggers are rate limited to 30 per hour' });
const uploadRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 15, message: 'Uploads are limited to 15 per minute' });

module.exports = {
  createRateLimiter,
  apiRateLimiter,
  syncRateLimiter,
  automationRateLimiter,
  uploadRateLimiter
};
