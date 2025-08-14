const express = require('express');
const router = express.Router();
const woocommerceController = require('../controllers/woocommerceController');
const { authenticateToken } = require('../middleware/auth');

// WooCommerce ürünlerini getir
router.get('/products', authenticateToken, woocommerceController.getProducts);

// Belirli bir WooCommerce ürününü getir
router.get('/products/:id', authenticateToken, woocommerceController.getProductById);

// WooCommerce ürünlerini yerel veritabanına senkronize et
router.post('/sync', authenticateToken, woocommerceController.syncProducts);

// WooCommerce bağlantısını test et
router.get('/test-connection', authenticateToken, woocommerceController.testConnection);

// WooCommerce ürün özelliklerini getir
router.get('/product-attributes', authenticateToken, woocommerceController.getProductAttributes);

module.exports = router; 