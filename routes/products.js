const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateApiKey } = require('../middleware/auth');

// Apply API key validation to all routes
router.use(validateApiKey);

// Get products from WooCommerce
router.get('/woocommerce', productController.getWooCommerceProducts);

// Get products from Trendyol
router.get('/trendyol', productController.getTrendyolProducts);

// Sync products between platforms
router.post('/sync', productController.syncProducts);

// Get stock and price information
router.get('/stocks-prices', productController.getStocksAndPrices);

// Update stock and price
router.post('/update-stock-price', productController.updateStockPrice);

// Get sync logs
router.get('/sync-logs', productController.getSyncLogs);

module.exports = router; 