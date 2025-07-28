const urlService = require('../services/urlService');
const inMemoryStore = require('../models/InMemoryStore');

// Get logger instance
const getLogger = () => global.appLogger;

class UrlController {
  /**
   * Create a new short URL
   * POST /shorturls
   */
  async createShortUrl(req, res) {
    const logger = getLogger();
    
    try {
      const { url, validity, shortcode } = req.body;

      logger.Log('backend', 'info', 'url-controller', 'Creating short URL request received', {
        url,
        validity: validity || 'default (30 minutes)',
        shortcode: shortcode || 'auto-generated',
        requestId: req.requestId
      });

      // Validate required fields
      if (!url) {
        logger.Log('backend', 'error', 'url-controller', 'Missing required field: url', {
          providedFields: Object.keys(req.body),
          requestId: req.requestId
        });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'URL is required'
        });
      }

      // Validate validity if provided
      if (validity !== undefined) {
        if (typeof validity !== 'number' || validity <= 0 || validity > 10080) { // Max 1 week
          logger.Log('backend', 'error', 'url-controller', 'Invalid validity parameter', {
            providedValidity: validity,
            expectedRange: '1-10080 minutes',
            requestId: req.requestId
          });
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Validity must be a positive number (in minutes) and not exceed 10080 minutes (1 week)'
          });
        }
      }

      const result = await urlService.createShortUrl({
        url,
        validity,
        shortcode
      });

      logger.Log('backend', 'info', 'url-controller', 'Short URL created successfully', {
        shortcode: result.shortcode,
        originalUrl: result.originalUrl,
        expiresAt: result.expiresAt,
        isCustomShortcode: !!shortcode,
        requestId: req.requestId
      });

      res.status(201).json(result);
    } catch (error) {
      logger.logError('backend', 'url-controller', error, 'Error creating short URL', {
        requestId: req.requestId,
        body: req.body
      });

      if (error.message.includes('already exists')) {
        logger.Log('backend', 'warn', 'url-controller', 'Shortcode collision detected', {
          shortcode: req.body.shortcode,
          errorType: 'SHORTCODE_EXISTS',
          requestId: req.requestId
        });
        return res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
      }

      if (error.message.includes('shortcode') || error.message.includes('URL')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create short URL'
      });
    }
  }

  /**
   * Redirect to original URL
   * GET /:shortcode
   */
  async redirectToUrl(req, res) {
    const logger = getLogger();
    
    try {
      const { shortcode } = req.params;

      logger.Log('backend', 'info', 'url-controller', 'Redirect request received', {
        shortcode,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        requestId: req.requestId
      });

      if (!shortcode) {
        logger.Log('backend', 'error', 'url-controller', 'Missing shortcode parameter', {
          requestId: req.requestId
        });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Shortcode is required'
        });
      }

      const urlData = await urlService.getUrlByShortcode(shortcode);

      if (!urlData) {
        logger.Log('backend', 'warn', 'url-controller', 'Short URL not found', {
          shortcode,
          requestId: req.requestId
        });
        
        return res.status(404).json({
          error: 'Not Found',
          message: 'Short URL not found'
        });
      }

      // Check if URL has expired
      if (urlData.expiresAt && new Date() > urlData.expiresAt) {
        logger.Log('backend', 'warn', 'url-controller', 'Short URL has expired', {
          shortcode,
          expiresAt: urlData.expiresAt,
          currentTime: new Date().toISOString(),
          requestId: req.requestId
        });
        
        return res.status(410).json({
          error: 'Gone',
          message: 'Short URL has expired'
        });
      }

      // Record click
      await urlService.recordClick(shortcode, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      });

      logger.Log('backend', 'info', 'url-controller', 'Successful redirect performed', {
        shortcode,
        originalUrl: urlData.originalUrl,
        clickCount: urlData.clicks ? urlData.clicks.length + 1 : 1,
        requestId: req.requestId
      });

      res.redirect(urlData.originalUrl);
    } catch (error) {
      logger.logError('backend', 'url-controller', error, 'Error during redirect', {
        shortcode: req.params.shortcode,
        requestId: req.requestId
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to redirect'
      });
    }
  }

  /**
   * Get URL analytics
   * GET /shorturls/:shortcode/analytics
   */
  async getUrlAnalytics(req, res) {
    const logger = getLogger();
    try {
      const { shortcode } = req.params;

      logger.Log('backend', 'info', 'url-controller', 'Analytics request received', {
        shortcode,
        requestId: req.requestId
      });

      if (!shortcode) {
        logger.Log('backend', 'error', 'url-controller', 'Missing shortcode parameter for analytics', {
          requestId: req.requestId
        });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Shortcode is required'
        });
      }

      const analytics = await urlService.getUrlAnalytics(shortcode);

      if (!analytics) {
        logger.Log('backend', 'warn', 'url-controller', 'Analytics requested for non-existent URL', {
          shortcode,
          requestId: req.requestId
        });
        return res.status(404).json({
          error: 'Not Found',
          message: 'Short URL not found'
        });
      }

      logger.Log('backend', 'info', 'url-controller', 'Analytics retrieved successfully', {
        shortcode,
        clickCount: analytics.clickCount,
        hasExpiry: !!analytics.expiresAt,
        requestId: req.requestId
      });

      res.json(analytics);
    } catch (error) {
      logger.logError('backend', 'url-controller', error, 'Error retrieving analytics', {
        shortcode: req.params.shortcode,
        requestId: req.requestId
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve analytics'
      });
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(req, res) {
    const logger = getLogger();
    
    try {
      logger.Log('backend', 'debug', 'url-controller', 'Health check requested', {
        requestId: req.requestId
      });

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'URL Shortener Microservice',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      logger.logError('backend', 'url-controller', error, 'Health check failed', {
        requestId: req.requestId
      });
      logger.error('Health check failed', {
        requestId: req.requestId,
        error: error.message
      });

      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
}

module.exports = new UrlController();
