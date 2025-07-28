const express = require('express');
const urlController = require('../controllers/urlController');

const router = express.Router();

// Create short URL
router.post('/shorturls', urlController.createShortUrl);

// Get URL analytics
router.get('/shorturls/:shortcode/analytics', urlController.getUrlAnalytics);

// Health check
router.get('/health', urlController.healthCheck);

// Redirect route (should be last to catch all other routes)
router.get('/:shortcode', urlController.redirectToUrl);

module.exports = router;
