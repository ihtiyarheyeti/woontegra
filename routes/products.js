const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, requireAdmin, requireViewer } = require('../middleware/auth');

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Get all products with enhanced filtering (Viewer+)
router.get('/', requireViewer, productController.getAllProducts);

// Get WooCommerce products (Viewer+)
router.get('/woocommerce', requireViewer, productController.getWooCommerceProducts);

// Get WooCommerce product attributes (Viewer+)
router.get('/woocommerce/attributes', requireViewer, productController.getProductAttributes);

// Get product statistics (Viewer+)
router.get('/stats', requireViewer, productController.getProductStats);

// Create new product (Admin only)
router.post('/', requireAdmin, productController.createProduct);

// Bulk upload products (Admin only)
router.post('/bulk-upload', requireAdmin, productController.upload.single('file'), productController.bulkUploadProducts);

// Get product by ID (Viewer+)
router.get('/:id', requireViewer, productController.getProductById);

// Update product (Admin only)
router.put('/:id', requireAdmin, productController.updateProduct);

// Delete product (Admin only)
router.delete('/:id', requireAdmin, productController.deleteProduct);

// Send product to marketplaces (Admin only)
router.post('/:id/send-to-marketplaces', requireAdmin, productController.sendProductToMarketplaces);

module.exports = router; 