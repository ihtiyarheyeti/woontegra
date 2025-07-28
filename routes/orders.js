const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateApiKey } = require('../middleware/auth');

// Apply API key validation to all routes
router.use(validateApiKey);

// Get all orders
router.get('/', orderController.getAllOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Get orders by status
router.get('/status/:status', orderController.getOrdersByStatus);

// Update order status
router.put('/:id/status', orderController.updateOrderStatus);

// Sync orders from Trendyol
router.post('/sync-trendyol', orderController.syncOrdersFromTrendyol);

// Get order statistics
router.get('/stats/summary', orderController.getOrderStats);

module.exports = router; 