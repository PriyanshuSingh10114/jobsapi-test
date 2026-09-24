const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const logger = require('./config/logger');
const config = require('./config');
const requestIdMiddleware = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const { apiRateLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust reverse proxy (for rate limiting, IP resolution in Docker/K8s)
app.set('trust proxy', 1);

// 1. Correlation Request ID Middleware
app.use(requestIdMiddleware);

// 2. Security Headers & CORS
const allowedOrigins = config.SERVER.corsOrigins;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 3. Body Parsers with Size Limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Request Logging with Correlation ID and Duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const isError = status >= 400;
    const methodPad = req.method.padEnd(6, ' ');
    const logMsg = `[${req.id.slice(0, 8)}] ${methodPad} ${req.originalUrl || req.url} ${status} (${duration}ms)`;
    if (isError) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });
  next();
});


// 5. Health, Readiness & Metrics (Unthrottled)
const healthRoutes = require('./routes/healthRoutes');
app.use('/', healthRoutes);

// 6. Global Rate Limiter on API namespace
app.use('/api', apiRateLimiter);

// 7. Route Modules
const sourceRoutes = require('./routes/sourceRoutes');
const jobRoutes = require('./routes/jobRoutes');
const statRoutes = require('./routes/statRoutes');
const debugRoutes = require('./routes/debug.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const automationRoutes = require('./routes/automationRoutes');
const userRoutes = require('./routes/userRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const autoApplyRoutes = require('./routes/autoApplyRoutes');

// Serve uploads folder statically with secure cache headers
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  setHeaders: (res) => {
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

// Mount API Routes
app.use('/api/sources', sourceRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/auto-apply', autoApplyRoutes);

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'JobsAPI Platform',
    version: '1.0.0',
    status: 'online',
    documentation: '/api-docs',
    health: '/health'
  });
});

// 8. 404 Handler
app.use((req, res, next) => {
  const { NotFoundError } = require('./errors/AppErrors');
  next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
});

// 9. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
