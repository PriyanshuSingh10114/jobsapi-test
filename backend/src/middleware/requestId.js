const crypto = require('crypto');

/**
 * Request Correlation ID Middleware
 * Attaches a unique X-Request-Id to every request and response for end-to-end tracing.
 */
const requestIdMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-Id', correlationId);
  next();
};

module.exports = requestIdMiddleware;
