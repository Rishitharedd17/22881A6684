const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirExists();
  }

  ensureLogDirExists() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...metadata
    }) + '\n';
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content);
  }

  info(message, metadata = {}) {
    const logMessage = this.formatMessage('INFO', message, metadata);
    this.writeToFile('app.log', logMessage);
  }

  error(message, metadata = {}) {
    const logMessage = this.formatMessage('ERROR', message, metadata);
    this.writeToFile('error.log', logMessage);
    this.writeToFile('app.log', logMessage);
  }

  warn(message, metadata = {}) {
    const logMessage = this.formatMessage('WARN', message, metadata);
    this.writeToFile('app.log', logMessage);
  }

  debug(message, metadata = {}) {
    const logMessage = this.formatMessage('DEBUG', message, metadata);
    this.writeToFile('debug.log', logMessage);
  }
}

const logger = new Logger();

const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = require('crypto').randomUUID();
  
  // Add request ID to request object
  req.requestId = requestId;

  // Log incoming request
  logger.info('Incoming Request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(obj) {
    const duration = Date.now() - startTime;
    
    logger.info('Outgoing Response', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(obj).length
    });

    return originalJson.call(this, obj);
  };

  // Override res.status to capture status changes
  const originalStatus = res.status;
  res.status = function(code) {
    if (code >= 400) {
      logger.error('HTTP Error Response', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: code
      });
    }
    return originalStatus.call(this, code);
  };

  next();
};

// Error logging middleware
const errorLoggingMiddleware = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack
  });

  next(err);
};

module.exports = {
  logger,
  loggingMiddleware,
  errorLoggingMiddleware
};
