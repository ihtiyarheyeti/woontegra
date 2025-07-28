const jwt = require('jsonwebtoken');
const { Customer } = require('../models');
const logger = require('../utils/logger');

/**
 * JWT Token doğrulama middleware'i
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcıyı veritabanından kontrol et
    const customer = await Customer.findByPk(decoded.userId);
    
    if (!customer || !customer.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    // Kullanıcı bilgilerini request'e ekle
    req.user = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: customer.role || 'user' // Varsayılan rol 'user'
    };

    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * API Key doğrulama middleware'i
 */
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    const customer = await Customer.findOne({
      where: { 
        api_key: apiKey,
        is_active: true
      }
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Kullanıcı bilgilerini request'e ekle
    req.user = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: customer.role || 'user' // Varsayılan rol 'user'
    };

    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Rol tabanlı yetkilendirme middleware'i
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin yetkilendirme middleware'i
 */
const requireAdmin = requireRole(['admin']);

/**
 * User yetkilendirme middleware'i
 */
const requireUser = requireRole(['admin', 'user']);

module.exports = {
  authenticateToken,
  validateApiKey,
  requireRole,
  requireAdmin,
  requireUser
}; 