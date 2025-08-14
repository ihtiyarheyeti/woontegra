const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin, requireTenantAccess } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticateToken, authController.me);

/**
 * @route   GET /api/auth/users/:tenant_id?
 * @desc    Get users by tenant (admin only)
 * @access  Private (Admin)
 */
router.get('/users/:tenant_id?', authenticateToken, requireAdmin, authController.getUsersByTenant);

/**
 * @route   PUT /api/auth/users/:user_id/role
 * @desc    Update user role (admin only)
 * @access  Private (Admin)
 */
router.put('/users/:user_id/role', authenticateToken, requireAdmin, authController.updateUserRole);

module.exports = router; 

