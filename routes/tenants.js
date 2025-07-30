const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Admin only routes
router.get('/', authenticateToken, requireAdmin, tenantController.getAllTenants);
router.post('/', authenticateToken, requireAdmin, tenantController.createTenant);
router.get('/:id', authenticateToken, requireAdmin, tenantController.getTenantById);
router.put('/:id', authenticateToken, requireAdmin, tenantController.updateTenant);
router.delete('/:id', authenticateToken, requireAdmin, tenantController.deleteTenant);
router.get('/:id/stats', authenticateToken, requireAdmin, tenantController.getTenantStats);

module.exports = router; 