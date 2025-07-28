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
    // Import models
    const Customer = require('../models/Customer');
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const CategoryMapping = require('../models/CategoryMapping');
    const SyncLog = require('../models/SyncLog');
    const Category = require('../models/Category');
    const MarketplaceConnection = require('../models/MarketplaceConnection');

    // Define associations
    Customer.hasMany(MarketplaceConnection, { foreignKey: 'customer_id', as: 'connections' });
    MarketplaceConnection.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

    // Sync all models with database
    await sequelize.sync({ alter: true });
    
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