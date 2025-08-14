const express = require('express');
const router = express.Router();
const mappingController = require('../controllers/mappingController');
const { authenticateToken } = require('../middleware/auth');

// Authentication middleware
router.use(authenticateToken);

// Attribute mappings
router.get('/attribute/product/:productId', mappingController.getAttributeMappings);
router.get('/attribute/category/:categoryId', mappingController.getAttributeMappings);

// Product mappings
router.get('/product/:productId', mappingController.getProductMappings);
router.post('/product', mappingController.createProductMapping);
router.put('/product/:id', mappingController.updateProductMapping);
router.delete('/product/:id', mappingController.deleteProductMapping);

// Category mappings
router.get('/category', mappingController.getCategoryMappings);
router.post('/category', mappingController.createCategoryMapping);
router.put('/category/:id', mappingController.updateCategoryMapping);
router.delete('/category/:id', mappingController.deleteCategoryMapping);

module.exports = router;
