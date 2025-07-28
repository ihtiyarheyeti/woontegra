const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Create new customer
router.post('/', customerController.createCustomer);

// Get all customers
router.get('/', customerController.getCustomers);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Update customer
router.put('/:id', customerController.updateCustomer);

// Delete customer
router.delete('/:id', customerController.deleteCustomer);

// Get customer API keys
router.get('/:id/api-keys', customerController.getApiKeys);

// Regenerate API key
router.post('/:id/regenerate-api-key', customerController.regenerateApiKey);

// Get category mappings for customer
router.get('/:id/category-mappings', customerController.getCategoryMappings);

// Update category mappings
router.put('/:id/category-mappings', customerController.updateCategoryMappings);

module.exports = router; 