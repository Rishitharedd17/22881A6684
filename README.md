# 🔗 URL Shortener Microservice

A production-ready URL Shortener Microservice built with Node.js, Express, MongoDB, and React. Features custom logging, analytics, configurable expiry, and a modern web interface.

## 🚀 Features

### Core Functionality
- ✅ **URL Shortening**: Convert long URLs to short, manageable links
- ✅ **Custom Shortcodes**: Optional custom shortcodes (3-20 alphanumeric characters)
- ✅ **Configurable Expiry**: Default 30 minutes, max 1 week
- ✅ **Auto-Redirect**: Visiting short URL redirects to original URL
- ✅ **Expired Link Handling**: Returns 410 Gone for expired links

### Analytics & Tracking
- 📊 **Click Analytics**: Track clicks with timestamps, IP, user agent, referer
- 📈 **Real-time Stats**: View click count, expiry status, and recent activity
- 🕒 **Time Remaining**: Display remaining validity time

### Technical Features
- 🔒 **Production Security**: Robust error handling and input validation
- 📝 **Custom Logging**: File-based logging system (no console.log)
- 🌐 **CORS Enabled**: Configured for React frontend
- 🔄 **Auto-Cleanup**: MongoDB TTL for automatic expired URL removal
- ⚡ **Optimized**: Database indexing for fast lookups
- 🎯 **Unique Shortcodes**: Collision detection and retry logic

## 🏗️ Architecture

```
url-shortener/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── models/         # MongoDB models
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Database configuration
│   │   └── utils/          # Helper functions
│   └── logs/               # Application logs
├── frontend/               # React application
│   └── src/
│       ├── components/     # React components
│       └── services/       # API services
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Logging**: Custom file-based logging middleware
- **CORS**: Configured for cross-origin requests
- **Validation**: Input sanitization and validation

### Frontend
- **Framework**: React with Hooks
- **HTTP Client**: Axios
- **Styling**: Modern CSS with responsive design
- **Features**: Copy to clipboard, real-time updates

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd url-shortener
```

### 2. Set Up Backend
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MongoDB URI and settings
```

### 3. Set Up Frontend
```bash
cd frontend
npm install
```

### 4. Start MongoDB
Make sure MongoDB is running on your system or update the connection string in `.env`.

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables (backend/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/url_shortener
NODE_ENV=development
BASE_URL=http://localhost:5000
```

## 📡 API Documentation

### Create Short URL
```http
POST /shorturls
Content-Type: application/json

{
  "url": "https://example.com/some/long/path",
  "validity": 30,          # Optional: minutes (default: 30)
  "shortcode": "custom123" # Optional: custom shortcode
}
```

**Response:**
```json
{
  "shortcode": "abc123",
  "originalUrl": "https://example.com/some/long/path",
  "shortUrl": "http://localhost:5000/abc123",
  "expiresAt": "2025-07-28T01:30:00.000Z",
  "createdAt": "2025-07-28T01:00:00.000Z"
}
```

### Redirect to Original URL
```http
GET /:shortcode
```
- **Success**: 302 redirect to original URL
- **Not Found**: 404 JSON error
- **Expired**: 410 JSON error

### Get Analytics
```http
GET /shorturls/:shortcode/analytics
```

**Response:**
```json
{
  "shortcode": "abc123",
  "originalUrl": "https://example.com/some/long/path",
  "createdAt": "2025-07-28T01:00:00.000Z",
  "expiresAt": "2025-07-28T01:30:00.000Z",
  "isExpired": false,
  "isActive": true,
  "clickCount": 5,
  "clicks": [
    {
      "timestamp": "2025-07-28T01:15:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.1",
      "referer": "https://google.com"
    }
  ]
}
```

### Health Check
```http
GET /health
```

## 🎯 Usage Examples

### Web Interface
1. Open http://localhost:3000
2. Enter a URL to shorten
3. Optionally set custom shortcode and validity
4. Click "Shorten URL"
5. Copy the generated short URL
6. Click "View Analytics" to see click data

### API Usage
```bash
# Create short URL
curl -X POST http://localhost:5000/shorturls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com", "validity": 60}'

# Access short URL (redirects)
curl -L http://localhost:5000/abc123

# Get analytics
curl http://localhost:5000/shorturls/abc123/analytics
```

## 📊 Logging

The application uses custom logging middleware that writes to files in `backend/logs/`:
- `app.log` - All application logs
- `error.log` - Error logs only
- `debug.log` - Debug information

Log format (JSON):
```json
{
  "timestamp": "2025-07-28T01:00:00.000Z",
  "level": "INFO",
  "message": "Short URL created",
  "requestId": "uuid-here",
  "shortcode": "abc123"
}
```

## 🔒 Security Features

- **Input Validation**: All inputs are validated and sanitized
- **URL Validation**: Only HTTP/HTTPS URLs allowed
- **Shortcode Validation**: Alphanumeric characters only
- **Rate Limiting Ready**: Architecture supports rate limiting middleware
- **Error Handling**: No sensitive information leaked in errors
- **CORS Configuration**: Properly configured for frontend

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use MongoDB Atlas or dedicated MongoDB instance
3. Configure proper `BASE_URL`
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Configure log rotation

### Docker Deployment
```dockerfile
# Example Dockerfile for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Manual Testing
1. Test URL creation with various inputs
2. Test custom shortcodes (valid/invalid)
3. Test expired URL access
4. Test analytics retrieval
5. Test error scenarios

### API Testing with curl
```bash
# Test invalid URL
curl -X POST http://localhost:5000/shorturls \
  -H "Content-Type: application/json" \
  -d '{"url": "invalid-url"}'

# Test duplicate shortcode
curl -X POST http://localhost:5000/shorturls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com", "shortcode": "existing"}'
```

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check if MongoDB is running
- Verify connection string in `.env`
- Ensure database permissions

**CORS Errors**
- Check frontend URL in backend CORS configuration
- Verify API_BASE_URL in frontend service

**Port Already in Use**
- Change PORT in `.env`
- Kill existing processes: `lsof -ti:5000 | xargs kill`

**Logs Not Writing**
- Check filesystem permissions
- Verify logs directory exists

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support, please check:
1. This README for common solutions
2. Application logs in `backend/logs/`
3. Browser developer console for frontend issues
4. MongoDB logs for database issues

---

**Built with ❤️ for production use**
