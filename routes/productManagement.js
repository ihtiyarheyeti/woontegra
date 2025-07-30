const express = require('express');
const router = express.Router();
const productManagementController = require('../controllers/productManagementController');
const { authenticateToken, requireAdmin, requireViewer } = require('../middleware/auth');

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Import products from external API (Admin only)
router.post('/import', requireAdmin, productManagementController.importProducts);

// Get all products with pagination and filtering (Viewer+)
router.get('/', requireViewer, productManagementController.getAllProducts);

// Create new product (Admin only)
router.post('/', requireAdmin, productManagementController.createProduct);

// Get product by ID (Viewer+)
router.get('/:id', requireViewer, productManagementController.getProductById);

// Update product (Admin only)
router.put('/:id', requireAdmin, productManagementController.updateProduct);

// Delete product (Admin only)
router.delete('/:id', requireAdmin, productManagementController.deleteProduct);

module.exports = router; 
 