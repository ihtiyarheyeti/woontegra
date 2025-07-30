const express = require('express');
const router = express.Router();
const userConnectionsController = require('../controllers/userConnectionsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/user-connections
 * @desc    Get all connections for authenticated user
 * @access  Private
 */
router.get('/', authenticateToken, userConnectionsController.getUserConnections);

/**
 * @route   POST /api/user-connections
 * @desc    Create new connection for authenticated user
 * @access  Private
 */
router.post('/', authenticateToken, userConnectionsController.createConnection);

/**
 * @route   GET /api/user-connections/:id
 * @desc    Get connection by ID (only if owned by user)
 * @access  Private
 */
router.get('/:id', authenticateToken, userConnectionsController.getConnectionById);

/**
 * @route   PUT /api/user-connections/:id
 * @desc    Update connection (only if owned by user)
 * @access  Private
 */
router.put('/:id', authenticateToken, userConnectionsController.updateConnection);

/**
 * @route   DELETE /api/user-connections/:id
 * @desc    Delete connection (only if owned by user)
 * @access  Private
 */
router.delete('/:id', authenticateToken, userConnectionsController.deleteConnection);

/**
 * @route   GET /api/user-connections/types/marketplaces
 * @desc    Get marketplace types
 * @access  Private
 */
router.get('/types/marketplaces', authenticateToken, userConnectionsController.getMarketplaceTypes);

module.exports = router;