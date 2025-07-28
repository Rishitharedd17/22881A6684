<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# URL Shortener Microservice - Copilot Instructions

This is a production-ready URL Shortener Microservice with the following architecture:

## Project Structure
- `backend/` - Node.js + Express microservice
- `frontend/` - React application

## Backend Stack
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Logging**: Custom logging middleware (no console.log)
- **Error Handling**: Robust error handling with proper HTTP status codes
- **CORS**: Enabled for React frontend
- **Validation**: Input validation and sanitization
- **Security**: Production-ready security practices

## Frontend Stack
- **Framework**: React with hooks
- **HTTP Client**: Axios for API calls
- **Styling**: Custom CSS with responsive design

## Key Features
- URL shortening with optional custom shortcodes
- Configurable expiry (default 30 minutes)
- Click analytics and tracking
- Real-time expiry status
- Error handling with user-friendly messages
- Responsive design
- Copy to clipboard functionality

## API Endpoints
- `POST /shorturls` - Create short URL
- `GET /:shortcode` - Redirect to original URL
- `GET /shorturls/:shortcode/analytics` - Get analytics
- `GET /health` - Health check

## Development Guidelines
- Use the custom logger middleware for all logging
- Follow modular architecture (controllers, routes, models, services)
- Implement proper error handling with descriptive messages
- Use ISO 8601 timestamps
- Validate all inputs
- Handle edge cases (expired URLs, invalid inputs, etc.)
- Maintain CORS configuration for frontend

## Database Schema
- URLs have shortcode, originalUrl, expiresAt, clicks array
- TTL index for automatic cleanup of expired URLs
- Unique constraints on shortcodes

## Environment Variables
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `BASE_URL` - Base URL for short links
- `NODE_ENV` - Environment (development/production)
