const express = require('express');
const router = express.Router();
const { authenticateToken, requireViewer } = require('../middleware/auth');
const marketplaceConnectionController = require('../controllers/marketplaceConnectionController');

/**
 * Marketplace Connections Routes
 * Pazaryeri bağlantıları için API endpoint'leri
 */

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Get marketplace types (Viewer+)
router.get('/types', requireViewer, marketplaceConnectionController.getMarketplaceTypes);

// Get all connections (Viewer+)
router.get('/', requireViewer, marketplaceConnectionController.getAllConnections);

// Get connection by ID (Viewer+)
router.get('/:id', requireViewer, marketplaceConnectionController.getConnectionById);

// Create new connection (Viewer+)
router.post('/', requireViewer, marketplaceConnectionController.createConnection);

// Update connection (Viewer+)
router.put('/:id', requireViewer, marketplaceConnectionController.updateConnection);

// Delete connection (Viewer+)
router.delete('/:id', requireViewer, marketplaceConnectionController.deleteConnection);

// Test connection (Viewer+)
router.post('/test', requireViewer, marketplaceConnectionController.testConnection);

// Test existing connection (Viewer+)
router.post('/:id/test', requireViewer, marketplaceConnectionController.testExistingConnection);

module.exports = router; 
 