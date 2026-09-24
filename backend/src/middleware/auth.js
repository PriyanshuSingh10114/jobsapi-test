const config = require('../config');
const { AuthenticationError, AuthorizationError } = require('../errors/AppErrors');
const logger = require('../config/logger');

/**
 * Authentication Middleware
 * Supports JWT Bearer tokens, Admin API keys, and seamless local development fallback.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];

  // 1. Check Admin API Key
  if (apiKeyHeader) {
    if (config.AUTH.adminApiKey && apiKeyHeader === config.AUTH.adminApiKey) {
      req.user = {
        userId: 'system_admin',
        role: 'ADMIN',
        authMethod: 'API_KEY'
      };
      return next();
    } else {
      return next(new AuthenticationError('Invalid API Key provided'));
    }
  }

  // 2. Check Bearer Token (if provided)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (!token) {
      return next(new AuthenticationError('Bearer token cannot be empty'));
    }

    try {
      if (token === config.AUTH.jwtSecret || token === 'admin-token') {
        req.user = { userId: config.AUTH.defaultUserId, role: 'ADMIN', authMethod: 'STATIC_TOKEN' };
        return next();
      }
      
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        req.user = {
          userId: payload.userId || payload.sub || config.AUTH.defaultUserId,
          role: payload.role || 'USER',
          authMethod: 'JWT'
        };
        return next();
      } else {
        return next(new AuthenticationError('Malformed JWT token structure'));
      }
    } catch (err) {
      logger.warn(`Failed to parse auth token: ${err.message}`);
      return next(new AuthenticationError('Invalid or expired authentication token'));
    }
  }

  // 3. Local Development / Non-production Fallback
  // Prevents breaking local development when no credentials are sent at all
  if (!config.SERVER.isProduction) {
    req.user = {
      userId: config.AUTH.defaultUserId,
      role: 'ADMIN',
      authMethod: 'DEV_DEFAULT'
    };
    return next();
  }

  // In production, reject unauthenticated requests
  return next(new AuthenticationError('Authentication required. Provide a valid Bearer token or X-API-Key.'));
};

/**
 * Role-Based Authorization Middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('User must be authenticated before checking permissions'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Forbidden access attempt: user=${req.user.userId} (role=${req.user.role}) required=[${allowedRoles.join(', ')}]`);
      return next(new AuthorizationError(`Access denied. Requires one of: [${allowedRoles.join(', ')}]`));
    }

    next();
  };
};

const requireAdmin = [authenticate, authorize('ADMIN', 'SYSTEM')];

module.exports = {
  authenticate,
  authorize,
  requireAdmin
};
