const express = require('express');
const router = express.Router();
const trendyolController = require('../controllers/trendyolController');
const { authenticateToken } = require('../middleware/auth');

// Ürünleri Trendyol'a gönder
router.post('/send-products', authenticateToken, trendyolController.sendProducts);

// Trendyol kategorilerini getir
router.get('/categories', authenticateToken, trendyolController.getCategories);

// Ürün durumunu kontrol et
router.get('/product-status/:productId', authenticateToken, trendyolController.checkProductStatus);

// Trendyol'dan ürünleri çek
router.get('/pull-products', authenticateToken, trendyolController.pullProducts);

// Seçilen ürünleri WooCommerce'a aktar
router.post('/import-to-woocommerce', authenticateToken, trendyolController.importToWooCommerce);

module.exports = router; 
 