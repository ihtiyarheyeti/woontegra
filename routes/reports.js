const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateApiKey } = require('../middleware/auth');

// Apply API key validation to all routes
router.use(validateApiKey);

// Get summary statistics
router.get('/summary', reportController.getSummary);

// Get sales by month
router.get('/sales-by-month', reportController.getSalesByMonth);

// Get top products
router.get('/top-products', reportController.getTopProducts);

// Get sync statistics
router.get('/sync-stats', reportController.getSyncStats);

// Get order statistics
router.get('/order-stats', reportController.getOrderStats);

module.exports = router; 