const axios = require('axios');

/**
 * Enhanced reusable logging middleware with test server integration
 * Implements the required Log(stack, level, package, message) structure
 */
class LoggingMiddleware {
  constructor(config) {
    this.config = {
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableConsoleOutput: true,
      enableLocalStorage: false,
      localStorageKey: 'app_logs',
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      jwtToken: null, // JWT token for authentication
      ...config
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'URL-Shortener-Logger/1.0.0'
    };

    // Add JWT token if provided
    if (this.config.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.jwtToken}`;
    }

    this.httpClient = axios.create({
      baseURL: this.config.testServerUrl,
      timeout: this.config.timeout,
      headers
    });

    this.logQueue = [];
    this.flushTimer = null;
    this.requestCounter = 0;

    this.setupHttpInterceptors();
    this.startFlushTimer();
  }

  /**
   * Main logging function that matches the required structure
   * Log(stack, level, package, message)
   */
  Log = (stack, level, packageName, message, metadata = {}) => {
    // Safe process access for Node.js environment
    const getProcessInfo = () => {
      try {
        if (typeof process !== 'undefined' && process.version) {
          return {
            nodeVersion: process.version,
            platform: process.platform,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            pid: process.pid
          };
        }
      } catch (e) {
        // Process not available (browser environment)
      }
      return { environment: 'browser' };
    };

    const logEntry = {
      stack,
      level,
      package: packageName,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      metadata: {
        ...metadata,
        ...getProcessInfo()
      }
    };

    this.processLogEntry(logEntry);
  };

  /**
   * Convenience methods for different log levels
   */
  debug = (stack, packageName, message, metadata = {}) => {
    this.Log(stack, 'debug', packageName, message, metadata);
  };

  info = (stack, packageName, message, metadata = {}) => {
    this.Log(stack, 'info', packageName, message, metadata);
  };

  warn = (stack, packageName, message, metadata = {}) => {
    this.Log(stack, 'warn', packageName, message, metadata);
  };

  error = (stack, packageName, message, metadata = {}) => {
    this.Log(stack, 'error', packageName, message, metadata);
  };

  fatal = (stack, packageName, message, metadata = {}) => {
    this.Log(stack, 'fatal', packageName, message, metadata);
  };

  /**
   * Log with context from Error object
   */
  logError = (stack, packageName, error, context, metadata = {}) => {
    const errorMetadata = {
      ...metadata,
      errorName: error.name,
      errorStack: error.stack,
      errorMessage: error.message
    };

    const message = context 
      ? `${context}: ${error.message}` 
      : error.message;

    this.Log(stack, 'error', packageName, message, errorMetadata);
  };

  /**
   * Log API request/response lifecycle
   */
  logApiCall = (stack, packageName, method, url, statusCode, duration, metadata = {}) => {
    const level = statusCode && statusCode >= 400 ? 'error' : 'info';
    const message = `API ${method.toUpperCase()} ${url}${statusCode ? ` - ${statusCode}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    
    this.Log(stack, level, packageName, message, {
      ...metadata,
      apiMethod: method,
      apiUrl: url,
      statusCode,
      duration
    });
  };

  /**
   * Log database operations
   */
  logDatabaseOperation = (stack, packageName, operation, collection, duration, metadata = {}) => {
    const message = `Database ${operation}${collection ? ` on ${collection}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    
    this.Log(stack, 'info', packageName, message, {
      ...metadata,
      dbOperation: operation,
      dbCollection: collection,
      duration
    });
  };

  /**
   * Process and queue log entry
   */
  processLogEntry(logEntry) {
    // Console output if enabled
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }

    // Local storage if enabled (browser environment)
    if (this.config.enableLocalStorage && typeof localStorage !== 'undefined') {
      this.storeLocally(logEntry);
    }

    // Add to queue for batch sending
    this.logQueue.push(logEntry);

    // Send immediately for fatal errors
    if (logEntry.level === 'fatal') {
      this.flushLogs();
    } else if (this.logQueue.length >= this.config.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Output log to console with proper formatting
   */
  outputToConsole(logEntry) {
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const logMessage = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.stack}:${logEntry.package}] ${logEntry.message}`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug && console.debug(logMessage, logEntry.metadata);
        break;
      case 'info':
        console.info(logMessage, logEntry.metadata);
        break;
      case 'warn':
        console.warn(logMessage, logEntry.metadata);
        break;
      case 'error':
      case 'fatal':
        console.error(logMessage, logEntry.metadata);
        break;
      default:
        console.log(logMessage, logEntry.metadata);
    }
  }

  /**
   * Store log entry locally (browser environment)
   */
  storeLocally(logEntry) {
    try {
      const existingLogs = localStorage.getItem(this.config.localStorageKey);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(logEntry);
      
      // Keep only last 1000 logs to prevent storage overflow
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem(this.config.localStorageKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log locally:', error);
    }
  }

  /**
   * Flush queued logs to test server
   */
  flushLogs = async () => {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    const getEnvironment = () => {
      try {
        return (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development';
      } catch (e) {
        return 'browser';
      }
    };

    const batchRequest = {
      logs: logsToSend,
      source: 'url-shortener-microservice',
      environment: getEnvironment()
    };

    try {
      await this.sendLogsWithRetry(batchRequest);
    } catch (error) {
      // Re-queue logs if sending fails
      this.logQueue.unshift(...logsToSend);
      console.error('Failed to send logs to test server:', error);
    }
  };

  /**
   * Send logs with retry mechanism
   */
  async sendLogsWithRetry(batchRequest, attempt = 1) {
    try {
      const response = await this.httpClient.post('/logs', batchRequest);
      
      if (response.status >= 200 && response.status < 300) {
        // Log successful batch send
        if (this.config.enableConsoleOutput) {
          console.info(`Successfully sent ${batchRequest.logs.length} logs to test server`);
        }
      }
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        await this.delay(this.config.retryDelay * attempt);
        return this.sendLogsWithRetry(batchRequest, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Setup HTTP interceptors for enhanced logging
   */
  setupHttpInterceptors() {
    this.httpClient.interceptors.request.use(
      (config) => {
        config.requestStartTime = Date.now();
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.requestStartTime || 0);
        if (this.config.enableConsoleOutput) {
          console.debug(`HTTP Request completed: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
        }
        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config?.requestStartTime || 0);
        if (this.config.enableConsoleOutput) {
          console.error(`HTTP Request failed: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'} (${duration}ms)`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Start automatic log flushing timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.config.flushInterval);
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${++this.requestCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown - flush remaining logs
   */
  shutdown = async () => {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    await this.flushLogs();
    
    if (this.config.enableConsoleOutput) {
      console.info('Logging middleware shutdown complete');
    }
  };

  /**
   * Get current queue size for monitoring
   */
  getQueueSize() {
    return this.logQueue.length;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Create a singleton logger instance
 */
let globalLogger = null;

const createLogger = (config) => {
  globalLogger = new LoggingMiddleware(config);
  return globalLogger;
};

const getLogger = () => {
  if (!globalLogger) {
    throw new Error('Logger not initialized. Call createLogger() first.');
  }
  return globalLogger;
};

/**
 * Express middleware for automatic request logging
 */
const expressLoggingMiddleware = (logger) => {
  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add request ID to request object
    req.requestId = requestId;
    
    // Log incoming request
    logger.info(
      'backend',
      'express-middleware',
      `Incoming ${req.method} request to ${req.originalUrl}`,
      {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        requestId
      }
    );

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      
      logger.logApiCall(
        'backend',
        'express-middleware',
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        {
          requestId,
          responseSize: res.get('Content-Length') || 0
        }
      );
      
      originalEnd.apply(res, args);
    };

    next();
  };
};

module.exports = {
  LoggingMiddleware,
  createLogger,
  getLogger,
  expressLoggingMiddleware
};
