const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const { testConnection, initializeTables } = require('./config/database');
const routes = require('./routes');
const { initializeCronJobs } = require('./utils/cronJobs');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = 3001; // Kalıcı olarak 3001 portu - değiştirmeyin!

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Accept'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/templates', express.static(path.join(__dirname, 'public/templates')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth middleware'i tüm API'ye uygula (PUBLIC_ROUTES bayrağı ile seçili uçlar bypass)
app.use('/api', (req, res, next) => {
  // PUBLIC_ROUTES kontrolü
  const publicList = String(process.env.PUBLIC_ROUTES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  const fullPath = req.originalUrl;
  const pathOnly = req.path;
  
  // Hem tam path hem de sadece path'i kontrol et
  const isPublic = publicList.some(p => 
    fullPath.startsWith(p) || 
    pathOnly.startsWith(p.replace('/api', '')) ||
    fullPath.includes(p.replace('/api', ''))
  );
  
  if (isPublic) {
    logger.debug(`Public route bypass: ${fullPath} (matched: ${pathOnly})`);
    return next();
  }
  
  // Private route - authentication required
  return authenticateToken(req, res, next);
});

// API routes
app.use('/', routes);

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    logger.info('Database connection established');
    
    // Initialize database tables
    await initializeTables();
    logger.info('Database tables initialized');
    
    // Initialize cron jobs
    initializeCronJobs();
    
    app.listen(PORT, () => {
                      logger.info(`Server running on port ${PORT}`);
                logger.info(`Health check: http://localhost:${PORT}/health`);
                logger.info(`AUTH_REQUIRED=${process.env.AUTH_REQUIRED} | PUBLIC_ROUTES=${process.env.PUBLIC_ROUTES}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 