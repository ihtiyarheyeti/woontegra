const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Get all categories with pagination and filtering
router.get('/', categoryController.getAllCategories);

// Get active categories (for dropdowns)
router.get('/active', categoryController.getActiveCategories);

// Create new category
router.post('/', categoryController.createCategory);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Update category
router.put('/:id', categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router; 