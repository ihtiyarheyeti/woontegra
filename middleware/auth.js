const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Public route bypass
    const publicList = String(process.env.PUBLIC_ROUTES || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (publicList.some(p => req.path.startsWith(p))) return next();
    if (process.env.AUTH_REQUIRED === 'false') return next();

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim token\'ı gerekli'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database with tenant info
    const user = await Customer.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refresh_token'] },
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'name', 'status', 'plan', 'max_users', 'max_connections']
      }]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token veya kullanıcı aktif değil'
      });
    }

    // Check if tenant is active
    if (user.tenant && user.tenant.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Kiracı hesabınız aktif değil'
      });
    }

    // Add user and tenant info to request object
    req.user = {
      ...user.toJSON(),
      tenant_id: user.tenant_id || decoded.tenant_id
    };
    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token süresi dolmuş'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token doğrulama hatası'
    });
  }
};

/**
 * Admin Authorization Middleware
 * Checks if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama gerekli'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin yetkisi gerekli'
    });
  }

  next();
};

/**
 * Editor Authorization Middleware
 * Checks if user has editor or admin role
 */
const requireEditor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama gerekli'
    });
  }

  if (req.user.role !== 'editor' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Düzenleme yetkisi gerekli'
    });
  }

  next();
};

/**
 * Viewer Authorization Middleware
 * Checks if user has any valid role
 */
const requireViewer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama gerekli'
    });
  }

  if (!['admin', 'editor', 'viewer'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Görüntüleme yetkisi gerekli'
    });
  }

  next();
};

/**
 * Tenant Access Middleware
 * Ensures user can only access their own tenant data
 */
const requireTenantAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama gerekli'
    });
  }

  // Admin users can access all tenants
  if (req.user.role === 'admin') {
    return next();
  }

  // Other users can only access their own tenant
  const requestedTenantId = req.params.tenantId || req.body.tenant_id || req.query.tenant_id;
  
  if (requestedTenantId && parseInt(requestedTenantId) !== req.user.tenant_id) {
    return res.status(403).json({
      success: false,
      message: 'Bu kiracıya erişim yetkiniz yok'
    });
  }

  next();
};

/**
 * Optional Authentication Middleware
 * Adds user to request if token exists, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await Customer.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'refresh_token'] },
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'status', 'plan', 'max_users', 'max_connections']
        }]
      });

      if (user && user.is_active && user.tenant && user.tenant.status === 'active') {
        req.user = {
          ...user.toJSON(),
          tenant_id: user.tenant_id || decoded.tenant_id
        };
      }
    }
  } catch (error) {
    // Ignore token errors for optional auth
    logger.debug('Optional auth token error:', error.message);
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEditor,
  requireViewer,
  requireTenantAccess,
  optionalAuth
}; 