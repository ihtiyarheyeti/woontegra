const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply JWT authentication to all routes
router.use(authenticateToken);

// All package routes require admin privileges
router.use(requireAdmin);

// Get all packages
router.get('/', packageController.getAllPackages);

// Get package statistics
router.get('/stats', packageController.getPackageStats);

// Get package by ID
router.get('/:id', packageController.getPackageById);

// Create new package
router.post('/', packageController.createPackage);

// Update package
router.put('/:id', packageController.updatePackage);

// Delete package
router.delete('/:id', packageController.deletePackage);

module.exports = router; 