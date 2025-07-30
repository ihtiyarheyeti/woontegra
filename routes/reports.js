const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth');

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Get summary statistics
router.get('/summary', reportsController.getSummary);

// Get sales by month
router.get('/sales-by-month', reportsController.getSalesByMonth);

// Get top products
router.get('/top-products', reportsController.getTopProducts);

// Get sync statistics
router.get('/sync-stats', reportsController.getSyncStats);

// Get order statistics
router.get('/order-stats', reportsController.getOrderStats);

module.exports = router; 
 