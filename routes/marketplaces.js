const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');
const { authenticateToken } = require('../middleware/auth');

// Test connection endpoints
router.post('/test-woocommerce', authenticateToken, marketplaceController.testWooCommerceConnection);
router.post('/test-trendyol', authenticateToken, marketplaceController.testTrendyolConnection);
router.post('/test-hepsiburada', authenticateToken, marketplaceController.testHepsiburadaConnection);
router.post('/test-n11', authenticateToken, marketplaceController.testN11Connection);
router.post('/test-ciceksepeti', authenticateToken, marketplaceController.testCicekSepetiConnection);
router.post('/test-pazarama', authenticateToken, marketplaceController.testPazaramaConnection);

// Save and get connection endpoints
router.post('/save-connection', authenticateToken, marketplaceController.saveMarketplaceConnection);
router.get('/connections', authenticateToken, marketplaceController.getMarketplaceConnections);

module.exports = router; 