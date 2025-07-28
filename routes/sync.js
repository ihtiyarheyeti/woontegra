const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { validateApiKey } = require('../middleware/auth');

// Apply API key validation to all routes
router.use(validateApiKey);

// Manual sync trigger
router.post('/manual', syncController.triggerManualSync);

// Get sync logs
router.get('/logs', syncController.getSyncLogs);

// Get sync statistics
router.get('/stats', syncController.getSyncStats);

// Sync orders from Trendyol
router.post('/orders', syncController.syncOrders);

// Sync stock updates
router.post('/stock', syncController.syncStock);

// Sync price updates
router.post('/prices', syncController.syncPrices);

module.exports = router; 