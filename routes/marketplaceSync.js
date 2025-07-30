const express = require('express');
const router = express.Router();
const { authenticateToken, requireViewer } = require('../middleware/auth');
const marketplaceSyncController = require('../controllers/marketplaceSyncController');

/**
 * Marketplace Sync Routes
 * Tüm pazaryerleri için senkronizasyon API endpoint'leri
 */

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Get supported marketplaces (Viewer+)
router.get('/marketplaces', requireViewer, marketplaceSyncController.getSupportedMarketplaces);

// Get all marketplace sync status (Viewer+)
router.get('/status', requireViewer, marketplaceSyncController.getAllMarketplaceStatus);

// Sync products from specific marketplace (Viewer+)
router.post('/:marketplace/sync', requireViewer, marketplaceSyncController.syncProductsFromMarketplace);

// Get specific marketplace sync status (Viewer+)
router.get('/:marketplace/status', requireViewer, marketplaceSyncController.getMarketplaceSyncStatus);

// Get products from specific marketplace (Viewer+)
router.get('/:marketplace/products', requireViewer, marketplaceSyncController.getMarketplaceProducts);

module.exports = router; 
 