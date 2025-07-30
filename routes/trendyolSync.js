const express = require('express');
const router = express.Router();
const { authenticateToken, requireViewer } = require('../middleware/auth');
const trendyolSyncController = require('../controllers/trendyolSyncController');

/**
 * Trendyol Sync Routes
 * Trendyol senkronizasyonu için API endpoint'leri
 */

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Sync products from Trendyol (Viewer+)
router.post('/sync-products', requireViewer, trendyolSyncController.syncProductsFromTrendyol);

// Get Trendyol sync status (Viewer+)
router.get('/status', requireViewer, trendyolSyncController.getTrendyolSyncStatus);

// Get Trendyol products (Viewer+)
router.get('/products', requireViewer, trendyolSyncController.getTrendyolProducts);

module.exports = router; 
 