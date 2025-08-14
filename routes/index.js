const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const brandRoutes = require('./brands');
const tenantRoutes = require('./tenants');
const customerRoutes = require('./customers');
const packageRoutes = require('./packages');
const woocommerceRoutes = require('./woocommerce');
const marketplaceRoutes = require('./marketplaces');
const orderRoutes = require('./orders');
const categoryMappingRoutes = require('./categoryMappings');
const trendyolRoutes = require('./trendyolSync');
const mockDataRoutes = require('./mockDataRoutes');
const mappingRoutes = require('./mappings');
const uploadRoutes = require('./upload');

// Mount routes
router.use('/api/auth', authRoutes);
router.use('/api/products', productRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/brands', brandRoutes);
router.use('/api/tenants', tenantRoutes);
router.use('/api/customers', customerRoutes);
router.use('/api/packages', packageRoutes);
router.use('/api/woocommerce', woocommerceRoutes);
router.use('/api/marketplaces', marketplaceRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/category-mappings', categoryMappingRoutes);
router.use('/api/trendyol', trendyolRoutes);
router.use('/api', mockDataRoutes);
router.use('/api/mappings', mappingRoutes);
router.use('/api/upload', uploadRoutes);

module.exports = router; 