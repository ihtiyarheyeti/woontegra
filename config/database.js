const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'entegrasyon_paneli',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

// Initialize database tables
async function initializeTables() {
  try {
    // Import all models
    const { 
      Customer, 
      Product, 
      Order, 
      CategoryMapping, 
      SyncLog, 
      Category, 
      MarketplaceConnection,
      Tenant 
    } = require('../models');

    // Sync all models with database (don't force to preserve data)
    await sequelize.sync({ force: false });
    
    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database tables:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  initializeTables
}; 