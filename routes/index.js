const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const customerRoutes = require('./customers');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const syncRoutes = require('./sync');
const categoryRoutes = require('./categories');
const productManagementRoutes = require('./productManagement');
const marketplaceConnectionRoutes = require('./marketplaceConnections');
const trendyolSyncRoutes = require('./trendyolSync');

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Trendyol & WooCommerce Integration API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      customers: '/api/customers',
      products: '/api/products',
      orders: '/api/orders',
      sync: '/api/sync',
      categories: '/api/categories',
      productManagement: '/api/product-management',
      marketplaceConnections: '/api/marketplace-connections',
      trendyolSync: '/api/trendyol-sync'
    }
  });
});

// Mount route modules
router.use('/api/auth', authRoutes);
router.use('/api/customers', customerRoutes);
router.use('/api/products', productRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/sync', syncRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/product-management', productManagementRoutes);
router.use('/api/marketplace-connections', marketplaceConnectionRoutes);
router.use('/api/trendyol-sync', trendyolSyncRoutes);

module.exports = router; 