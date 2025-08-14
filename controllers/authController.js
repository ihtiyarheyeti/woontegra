const Customer = require('../models/Customer');
const Tenant = require('../models/Tenant');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const crypto = require('crypto');

class AuthController {
  /**
   * Register new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const { name, email, password, role = 'viewer', tenant_id } = req.body;

      // Validate required fields
      if (!name || !email || !password || !tenant_id) {
        return res.status(400).json({
          success: false,
          message: 'Ad, e-posta, şifre ve kiracı ID zorunludur'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir e-posta adresi giriniz'
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Şifre en az 6 karakter olmalıdır'
        });
      }

      // Validate role
      if (!['admin', 'editor', 'viewer'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz rol'
        });
      }

      // Check if tenant exists
      const tenant = await Tenant.findByPk(tenant_id);
      if (!tenant) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz kiracı ID'
        });
      }

      // Check if email already exists
      const existingCustomer = await Customer.findOne({
        where: { email }
      });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: 'Bu e-posta adresi zaten kullanılıyor'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate API key
      const apiKey = AuthController.generateApiKey();

      // Generate refresh token
      const refreshToken = AuthController.generateRefreshToken();

      // Create customer
      const customer = await Customer.create({
        name,
        email,
        password: hashedPassword,
        tenant_id,
        api_key: apiKey,
        role,
        refresh_token: refreshToken
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: customer.id, 
          email: customer.email, 
          role: customer.role,
          tenant_id: customer.tenant_id
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      logger.info(`User registered: ${email} (ID: ${customer.id}, Tenant: ${tenant_id}, Role: ${role})`);

      res.status(201).json({
        success: true,
        message: 'Kullanıcı başarıyla oluşturuldu',
        data: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
          tenant_id: customer.tenant_id,
          api_key: customer.api_key,
          token,
          refresh_token: refreshToken
        }
      });
    } catch (error) {
      logger.error('Error in register:', error);
      res.status(500).json({
        success: false,
        message: 'Kayıt işlemi sırasında bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'E-posta ve şifre zorunludur'
        });
      }

      // Find customer by email
      const customer = await Customer.findOne({
        where: { email, is_active: true },
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'status', 'plan', 'max_users', 'max_connections']
        }]
      });

      if (!customer) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz e-posta veya şifre'
        });
      }

      // Check if tenant is active
      if (customer.tenant.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Kiracı hesabınız aktif değil'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, customer.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz e-posta veya şifre'
        });
      }

      // Generate new refresh token
      const refreshToken = AuthController.generateRefreshToken();

      // Update last login and login count
      await customer.update({
        last_login: new Date(),
        login_count: customer.login_count + 1,
        refresh_token: refreshToken
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: customer.id, 
          email: customer.email, 
          role: customer.role,
          tenant_id: customer.tenant_id
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      logger.info(`User logged in: ${email} (ID: ${customer.id}, Tenant: ${customer.tenant_id}, Role: ${customer.role})`);

      res.json({
        success: true,
        message: 'Giriş başarılı',
        data: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
          tenant_id: customer.tenant_id,
          tenant_name: customer.tenant.name,
          tenant_plan: customer.tenant.plan,
          api_key: customer.api_key,
          last_login: customer.last_login,
          login_count: customer.login_count,
          token,
          refresh_token: refreshToken
        }
      });
    } catch (error) {
      logger.error('Error in login:', error);
      res.status(500).json({
        success: false,
        message: 'Giriş işlemi sırasında bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token gerekli'
        });
      }

      // Find customer by refresh token
      const customer = await Customer.findOne({
        where: { refresh_token, is_active: true },
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'status']
        }]
      });

      if (!customer) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz refresh token'
        });
      }

      // Check if tenant is active
      if (customer.tenant.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Kiracı hesabınız aktif değil'
        });
      }

      // Generate new tokens
      const newRefreshToken = AuthController.generateRefreshToken();
      const newToken = jwt.sign(
        { 
          id: customer.id, 
          email: customer.email, 
          role: customer.role,
          tenant_id: customer.tenant_id
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Update refresh token
      await customer.update({
        refresh_token: newRefreshToken
      });

      res.json({
        success: true,
        message: 'Token yenilendi',
        data: {
          token: newToken,
          refresh_token: newRefreshToken
        }
      });
    } catch (error) {
      logger.error('Error in refreshToken:', error);
      res.status(500).json({
        success: false,
        message: 'Token yenileme sırasında bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      // Clear refresh token
      await Customer.update(
        { refresh_token: null },
        { where: { id: req.user.id } }
      );

      logger.info(`User logged out: ${req.user.email} (ID: ${req.user.id})`);

      res.json({
        success: true,
        message: 'Çıkış başarılı'
      });
    } catch (error) {
      logger.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        message: 'Çıkış işlemi sırasında bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Get current user info
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async me(req, res) {
    try {
      const customer = await Customer.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'refresh_token'] },
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'status', 'plan', 'max_users', 'max_connections']
        }]
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      logger.error('Error in me:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı bilgileri alınırken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Get users by tenant (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUsersByTenant(req, res) {
    try {
      const { tenant_id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const where = {};
      if (tenant_id) {
        where.tenant_id = tenant_id;
      }

      const users = await Customer.findAndCountAll({
        where,
        attributes: { exclude: ['password', 'refresh_token'] },
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'status', 'plan']
        }],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            page,
            limit,
            total: users.count,
            pages: Math.ceil(users.count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error in getUsersByTenant:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcılar alınırken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Update user role (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateUserRole(req, res) {
    try {
      const { user_id } = req.params;
      const { role } = req.body;

      if (!['admin', 'editor', 'viewer'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz rol'
        });
      }

      const user = await Customer.findByPk(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      await user.update({ role });

      logger.info(`User role updated: ${user.email} (ID: ${user.id}, New Role: ${role})`);

      res.json({
        success: true,
        message: 'Kullanıcı rolü güncellendi',
        data: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Error in updateUserRole:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı rolü güncellenirken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Generate API key
   * @returns {string} Generated API key
   */
  static generateApiKey() {
    return 'pk_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate refresh token
   * @returns {string} Generated refresh token
   */
  static generateRefreshToken() {
    return 'rt_' + crypto.randomBytes(64).toString('hex');
  }
}

module.exports = new AuthController();