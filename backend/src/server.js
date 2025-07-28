const express = require('express');
const cors = require('cors');
require('dotenv').config();

const urlRoutes = require('./routes/urlRoutes');
const { createLogger, expressLoggingMiddleware } = require('@url-shortener/logging-middleware');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize the new comprehensive logging middleware
const logger = createLogger({
  testServerUrl: process.env.TEST_SERVER_URL || 'http://localhost:8080/api',
  enableConsoleOutput: process.env.NODE_ENV !== 'production',
  batchSize: parseInt(process.env.LOG_BATCH_SIZE) || 20,
  flushInterval: parseInt(process.env.LOG_FLUSH_INTERVAL) || 15000,
  retryAttempts: 3,
  retryDelay: 1000,
  jwtToken: process.env.JWT_TOKEN // Add JWT token for authentication
});

// Make logger globally available
global.appLogger = logger;

// Trust proxy (for getting real IP addresses behind reverse proxy)
app.set('trust proxy', true);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// New comprehensive logging middleware (must be before routes)
app.use(expressLoggingMiddleware(logger));

// Routes
app.use('/', urlRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.Log('backend', 'info', 'server', 'SIGTERM received, shutting down gracefully');
  await logger.shutdown();
  server.close(() => {
    logger.Log('backend', 'info', 'server', 'Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.Log('backend', 'info', 'server', 'SIGINT received, shutting down gracefully');
  await logger.shutdown();
  server.close(() => {
    logger.Log('backend', 'info', 'server', 'Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.Log('backend', 'fatal', 'server', 'Uncaught Exception occurred', {
    error: error.message,
    stack: error.stack,
    name: error.name
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.Log('backend', 'fatal', 'server', 'Unhandled Promise Rejection', {
    reason: reason.toString(),
    promise: promise.toString()
  });
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  logger.Log('backend', 'info', 'server', 'URL Shortener Microservice started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI ? 'Connected' : 'Not configured',
    baseUrl: process.env.BASE_URL || `http://localhost:${PORT}`,
    testServerUrl: process.env.TEST_SERVER_URL || 'http://localhost:8080/api'
  });
  
  console.log(`🚀 URL Shortener Microservice running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  console.log(`🧪 Test Server: ${process.env.TEST_SERVER_URL || 'http://localhost:8080/api'}`);
  console.log(`📝 Comprehensive logging enabled with test server integration`);
});

module.exports = app;
