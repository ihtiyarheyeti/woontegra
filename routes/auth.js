const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Customer } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Login endpoint
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    // Find customer by email (using email as username)
    const customer = await Customer.findOne({
      where: { email: username, is_active: true }
    });

    if (!customer) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid username or password'
      });
    }

    // For demo purposes, we'll use a simple password check
    // In production, you should store hashed passwords
    const isValidPassword = password === 'admin123'; // Demo password

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        name: customer.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`User logged in: ${customer.email} (ID: ${customer.id})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

/**
 * Verify token endpoint
 * GET /api/auth/verify
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authentication token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data
    const customer = await Customer.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'is_active']
    });

    if (!customer || !customer.is_active) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or inactive'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email
        }
      }
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
});

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  // JWT is stateless, so we just return success
  // Client should remove the token from localStorage
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router; 