const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const logger = require('./config/logger');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction 
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ].filter(Boolean);

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
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

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

// Serve uploads folder statically if needed
app.use('/uploads', express.static('uploads'));

// Routes
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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Default route
app.get('/', (req, res) => {
  res.send('Job Source Testing Platform API is running. Check /api-docs for documentation.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

module.exports = app;
