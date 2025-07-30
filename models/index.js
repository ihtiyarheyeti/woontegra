const Customer = require('./Customer');
const Product = require('./Product');
const Order = require('./Order');
const CategoryMapping = require('./CategoryMapping');
const SyncLog = require('./SyncLog');
const Category = require('./Category');
const Brand = require('./Brand');
const MarketplaceConnection = require('./MarketplaceConnection');
const Tenant = require('./Tenant');
const Package = require('./Package');

// Package ilişkileri
Package.hasMany(Tenant, { foreignKey: 'package_id', as: 'tenants' });
Tenant.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

// Model ilişkilerini tanımla
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

Customer.hasMany(MarketplaceConnection, { foreignKey: 'customer_id', as: 'customerMarketplaceConnections' });
MarketplaceConnection.belongsTo(Customer, { foreignKey: 'customer_id', as: 'marketplaceConnectionCustomer' });

module.exports = {
  Customer,
  Product,
  Order,
  CategoryMapping,
  SyncLog,
  Category,
  Brand,
  MarketplaceConnection,
  Tenant,
  Package
}; 