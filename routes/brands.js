const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticateToken, requireAdmin, requireViewer } = require('../middleware/auth');

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Get all brands (Viewer+)
router.get('/', requireViewer, brandController.getAllBrands);

// Get brand by ID (Viewer+)
router.get('/:id', requireViewer, brandController.getBrandById);

// Create new brand (Admin only)
router.post('/', requireAdmin, brandController.createBrand);

// Update brand (Admin only)
router.put('/:id', requireAdmin, brandController.updateBrand);

// Delete brand (Admin only)
router.delete('/:id', requireAdmin, brandController.deleteBrand);

module.exports = router; 