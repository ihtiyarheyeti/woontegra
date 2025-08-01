const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const categoryMappingController = require('../controllers/categoryMappingController');

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Kategori eşleştirmelerini getir
router.get('/', categoryMappingController.getCategoryMappings);

// WooCommerce kategorilerini getir
router.get('/woo-categories', categoryMappingController.getWooCommerceCategories);

// Trendyol kategorilerini getir
router.get('/trendyol-categories', categoryMappingController.getTrendyolCategories);

// Hepsiburada kategorilerini getir
router.get('/hepsiburada-categories', categoryMappingController.getHepsiburadaCategories);

// N11 kategorilerini getir
router.get('/n11-categories', categoryMappingController.getN11Categories);

// Çiçeksepeti kategorilerini getir
router.get('/ciceksepeti-categories', categoryMappingController.getCiceksepetiCategories);

// Pazarama kategorilerini getir
router.get('/pazarama-categories', categoryMappingController.getPazaramaCategories);

// Kategori eşleştirmesi oluştur
router.post('/', categoryMappingController.createCategoryMapping);

// Kategori eşleştirmesi güncelle
router.put('/:id', categoryMappingController.updateCategoryMapping);

// Kategori eşleştirmesi sil
router.delete('/:id', categoryMappingController.deleteCategoryMapping);

// Kategori eşleştirmesi getir (ID ile)
router.get('/:id', categoryMappingController.getCategoryMappingById);

// Ürün için kategori eşleşmesini getir
router.get('/product/:productId', categoryMappingController.getCategoryMappingByProduct);

module.exports = router; 