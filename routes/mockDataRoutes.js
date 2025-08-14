const express = require('express');
const router = express.Router();
const mockDataController = require('../controllers/mockDataController');
const { authenticateToken } = require('../middleware/auth');

// Mock data route'ları - authentication gerekli
router.use(authenticateToken);

// Trendyol mock data
router.get('/trendyol/real-categories', mockDataController.getTrendyolCategories);
router.get('/trendyol/supplier-addresses', mockDataController.getSupplierAddresses);
router.get('/trendyol/static-providers', mockDataController.getStaticProviders);

// WooCommerce mock data
router.get('/woo-products', mockDataController.getWooProducts);

// Attribute mock data
router.get('/category-attributes', mockDataController.getCategoryAttributes);
router.get('/product-attributes', mockDataController.getProductAttributes);

// Ürün istatistikleri mock data
router.get('/products/stats', mockDataController.getProductStats);

// Pazaryeri bağlantıları mock data
router.get('/marketplaces/connections', mockDataController.getMarketplaceConnections);
router.post('/marketplaces/save-connection', mockDataController.saveMarketplaceConnection);

module.exports = router;
