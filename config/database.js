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
    const Customer = require('../models/Customer');
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const CategoryMapping = require('../models/CategoryMapping');
    const SyncLog = require('../models/SyncLog');
    const Category = require('../models/Category');
    const Brand = require('../models/Brand');
    const MarketplaceConnection = require('../models/MarketplaceConnection');
    const Tenant = require('../models/Tenant');
    const Package = require('../models/Package');
    const ProductSyncMap = require('../models/ProductSyncMap');

    // Define associations
    Package.hasMany(Tenant, { foreignKey: 'package_id', as: 'tenants' });
    Tenant.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

    Tenant.hasMany(Customer, { foreignKey: 'tenant_id', as: 'customers' });
    Customer.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    Tenant.hasMany(Product, { foreignKey: 'tenant_id', as: 'products' });
    Product.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    Tenant.hasMany(Order, { foreignKey: 'tenant_id', as: 'orders' });
    Order.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    Tenant.hasMany(SyncLog, { foreignKey: 'tenant_id', as: 'syncLogs' });
    SyncLog.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    Tenant.hasMany(Category, { foreignKey: 'tenant_id', as: 'categories' });
    Category.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    Tenant.hasMany(Brand, { foreignKey: 'tenant_id', as: 'brands' });
    Brand.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    Tenant.hasMany(MarketplaceConnection, { foreignKey: 'tenant_id', as: 'marketplaceConnections' });
    MarketplaceConnection.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    Customer.hasMany(Product, { foreignKey: 'customer_id', as: 'customerProducts' });
    Product.belongsTo(Customer, { foreignKey: 'customer_id', as: 'productCustomer' });

    Category.hasMany(Product, { foreignKey: 'category_id', as: 'categoryProducts' });
    Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

    Brand.hasMany(Product, { foreignKey: 'brand_id', as: 'brandProducts' });
    Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

    Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'customerOrders' });
    Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'orderCustomer' });

    Customer.hasMany(SyncLog, { foreignKey: 'customer_id', as: 'customerSyncLogs' });
    SyncLog.belongsTo(Customer, { foreignKey: 'customer_id', as: 'syncLogCustomer' });

    Tenant.hasMany(CategoryMapping, { foreignKey: 'tenant_id', as: 'categoryMappings' });
    CategoryMapping.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

    Customer.hasMany(CategoryMapping, { foreignKey: 'customer_id', as: 'customerCategoryMappings' });
    CategoryMapping.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

    Customer.hasMany(ProductSyncMap, { foreignKey: 'customer_id', as: 'customerProductSyncMaps' });
    ProductSyncMap.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

    // Drop tables in correct order (child tables first, then parent tables)
    try {
      // Drop child tables first
      await sequelize.query('DROP TABLE IF EXISTS `product_sync_map`');
      await sequelize.query('DROP TABLE IF EXISTS `attribute_mappings`');
      await sequelize.query('DROP TABLE IF EXISTS `product_mappings`');
      await sequelize.query('DROP TABLE IF EXISTS `marketplace_connections`');
      await sequelize.query('DROP TABLE IF EXISTS `sync_logs`');
      await sequelize.query('DROP TABLE IF EXISTS `orders`');
      await sequelize.query('DROP TABLE IF EXISTS `category_mappings`');
      await sequelize.query('DROP TABLE IF EXISTS `products`');
      await sequelize.query('DROP TABLE IF EXISTS `brands`');
      await sequelize.query('DROP TABLE IF EXISTS `categories`');
      await sequelize.query('DROP TABLE IF EXISTS `customers`');
      await sequelize.query('DROP TABLE IF EXISTS `tenants`');
      await sequelize.query('DROP TABLE IF EXISTS `packages`');
      
      logger.info('Existing tables dropped successfully');
    } catch (dropError) {
      logger.warn('Some tables could not be dropped, continuing with sync:', dropError.message);
    }

    // Sync all models with database
    await sequelize.sync({ force: false });
    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error initializing database tables:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  initializeTables
}; 