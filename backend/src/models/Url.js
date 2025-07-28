const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    type: String,
    default: ''
  },
  ip: {
    type: String,
    default: ''
  },
  referer: {
    type: String,
    default: ''
  }
});

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please provide a valid URL'
    }
  },
  shortcode: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Alphanumeric characters only, reasonable length (3-20 chars)
        return /^[a-zA-Z0-9]{3,20}$/.test(v);
      },
      message: 'Shortcode must be alphanumeric and between 3-20 characters'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  clickCount: {
    type: Number,
    default: 0
  },
  clicks: [clickSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for efficient queries
urlSchema.index({ shortcode: 1 });
urlSchema.index({ expiresAt: 1 });
urlSchema.index({ createdAt: -1 });

// Instance method to check if URL is expired
urlSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Instance method to add click
urlSchema.methods.addClick = function(clickData = {}) {
  this.clicks.push({
    timestamp: new Date(),
    userAgent: clickData.userAgent || '',
    ip: clickData.ip || '',
    referer: clickData.referer || ''
  });
  this.clickCount += 1;
  return this.save();
};

module.exports = mongoose.model('Url', urlSchema);
