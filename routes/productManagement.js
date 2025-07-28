const express = require('express');
const router = express.Router();
const productManagementController = require('../controllers/productManagementController');
const { validateApiKey, requireAdmin, requireUser } = require('../middleware/auth');

// Apply API key validation to all routes
router.use(validateApiKey);

// Import products from external API (Admin only)
router.post('/import', requireAdmin, productManagementController.importProducts);

// Get all products with pagination and filtering (User+)
router.get('/', requireUser, productManagementController.getAllProducts);

// Create new product (Admin only)
router.post('/', requireAdmin, productManagementController.createProduct);

// Get product by ID (User+)
router.get('/:id', requireUser, productManagementController.getProductById);

// Update product (Admin only)
router.put('/:id', requireAdmin, productManagementController.updateProduct);

// Delete product (Admin only)
router.delete('/:id', requireAdmin, productManagementController.deleteProduct);

module.exports = router; 