const { Customer, CategoryMapping } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const logger = require('../utils/logger');

class CustomerController {
  /**
   * Create new customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createCustomer(req, res) {
    try {
      const {
        name,
        email,
        woo_consumer_key,
        woo_consumer_secret,
        woo_store_url,
        trendyol_app_key,
        trendyol_app_secret,
        trendyol_supplier_id
      } = req.body;

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Name and email are required'
        });
      }

      // Check if email already exists
      const existingCustomer = await Customer.findOne({
        where: { email }
      });

      if (existingCustomer) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'A customer with this email already exists'
        });
      }

      // Generate API key
      const apiKey = CustomerController.generateApiKey();

      // Create customer
      const customer = await Customer.create({
        name,
        email,
        api_key: apiKey,
        woo_consumer_key: woo_consumer_key || null,
        woo_consumer_secret: woo_consumer_secret || null,
        woo_store_url: woo_store_url || null,
        trendyol_app_key: trendyol_app_key || null,
        trendyol_app_secret: trendyol_app_secret || null,
        trendyol_supplier_id: trendyol_supplier_id || null
      });

      logger.info(`Customer created: ${email} (ID: ${customer.id})`);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          api_key: customer.api_key,
          created_at: customer.created_at
        }
      });
    } catch (error) {
      logger.error('Error in createCustomer:', error);
      res.status(500).json({
        error: 'Failed to create customer',
        message: error.message
      });
    }
  }

  /**
   * Get all customers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCustomers(req, res) {
    try {
      const { page = 1, limit = 50, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: customers } = await Customer.findAndCountAll({
        where: whereClause,
        attributes: ['id', 'name', 'email', 'is_active', 'created_at', 'updated_at'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error in getCustomers:', error);
      res.status(500).json({
        error: 'Failed to fetch customers',
        message: error.message
      });
    }
  }

  /**
   * Get customer by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCustomerById(req, res) {
    try {
      const { id } = req.params;

      const customer = await Customer.findByPk(id);

      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found',
          message: 'Customer with the specified ID does not exist'
        });
      }

      // Mask sensitive data
      const maskedCustomer = {
        ...customer.toJSON(),
        woo_consumer_secret: CustomerController.maskSecret(customer.woo_consumer_secret),
        trendyol_app_secret: CustomerController.maskSecret(customer.trendyol_app_secret)
      };

      res.json({
        success: true,
        data: maskedCustomer
      });
    } catch (error) {
      logger.error('Error in getCustomerById:', error);
      res.status(500).json({
        error: 'Failed to fetch customer',
        message: error.message
      });
    }
  }

  /**
   * Update customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        woo_consumer_key,
        woo_consumer_secret,
        woo_store_url,
        trendyol_app_key,
        trendyol_app_secret,
        trendyol_supplier_id,
        is_active
      } = req.body;

      // Check if customer exists
      const existingCustomer = await Customer.findByPk(id);

      if (!existingCustomer) {
        return res.status(404).json({
          error: 'Customer not found',
          message: 'Customer with the specified ID does not exist'
        });
      }

      // Check if email is being changed and if it already exists
      if (email && email !== existingCustomer.email) {
        const emailCheck = await Customer.findOne({
          where: { email, id: { [Op.ne]: id } }
        });

        if (emailCheck) {
          return res.status(409).json({
            error: 'Email already exists',
            message: 'A customer with this email already exists'
          });
        }
      }

      // Update customer
      await Customer.update(
        {
          name: name || existingCustomer.name,
          email: email || existingCustomer.email,
          woo_consumer_key: woo_consumer_key !== undefined ? woo_consumer_key : existingCustomer.woo_consumer_key,
          woo_consumer_secret: woo_consumer_secret !== undefined ? woo_consumer_secret : existingCustomer.woo_consumer_secret,
          woo_store_url: woo_store_url !== undefined ? woo_store_url : existingCustomer.woo_store_url,
          trendyol_app_key: trendyol_app_key !== undefined ? trendyol_app_key : existingCustomer.trendyol_app_key,
          trendyol_app_secret: trendyol_app_secret !== undefined ? trendyol_app_secret : existingCustomer.trendyol_app_secret,
          trendyol_supplier_id: trendyol_supplier_id !== undefined ? trendyol_supplier_id : existingCustomer.trendyol_supplier_id,
          is_active: is_active !== undefined ? is_active : existingCustomer.is_active
        },
        { where: { id } }
      );

      // Get updated customer
      const updatedCustomer = await Customer.findByPk(id);

      logger.info(`Customer updated: ${updatedCustomer.email} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: {
          id: updatedCustomer.id,
          name: updatedCustomer.name,
          email: updatedCustomer.email,
          is_active: updatedCustomer.is_active,
          updated_at: updatedCustomer.updated_at
        }
      });
    } catch (error) {
      logger.error('Error in updateCustomer:', error);
      res.status(500).json({
        error: 'Failed to update customer',
        message: error.message
      });
    }
  }

  /**
   * Delete customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteCustomer(req, res) {
    try {
      const { id } = req.params;

      // Check if customer exists
      const existingCustomer = await Customer.findByPk(id);

      if (!existingCustomer) {
        return res.status(404).json({
          error: 'Customer not found',
          message: 'Customer with the specified ID does not exist'
        });
      }

      // Delete customer (cascade will handle related records)
      await Customer.destroy({ where: { id } });

      logger.info(`Customer deleted: ${existingCustomer.email} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteCustomer:', error);
      res.status(500).json({
        error: 'Failed to delete customer',
        message: error.message
      });
    }
  }

  /**
   * Get customer API keys
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getApiKeys(req, res) {
    try {
      const { id } = req.params;

      const customer = await Customer.findByPk(id, {
        attributes: ['id', 'name', 'email', 'api_key', 'created_at']
      });

      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found',
          message: 'Customer with the specified ID does not exist'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      logger.error('Error in getApiKeys:', error);
      res.status(500).json({
        error: 'Failed to fetch API keys',
        message: error.message
      });
    }
  }

  /**
   * Regenerate API key
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async regenerateApiKey(req, res) {
    try {
      const { id } = req.params;

      // Check if customer exists
      const existingCustomer = await Customer.findByPk(id);

      if (!existingCustomer) {
        return res.status(404).json({
          error: 'Customer not found',
          message: 'Customer with the specified ID does not exist'
        });
      }

      // Generate new API key
      const newApiKey = CustomerController.generateApiKey();

      // Update customer
      await Customer.update(
        { api_key: newApiKey },
        { where: { id } }
      );

      logger.info(`API key regenerated for customer: ${existingCustomer.email} (ID: ${id})`);

      res.json({
        success: true,
        message: 'API key regenerated successfully',
        data: {
          id: existingCustomer.id,
          name: existingCustomer.name,
          email: existingCustomer.email,
          api_key: newApiKey
        }
      });
    } catch (error) {
      logger.error('Error in regenerateApiKey:', error);
      res.status(500).json({
        error: 'Failed to regenerate API key',
        message: error.message
      });
    }
  }

  /**
   * Get category mappings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCategoryMappings(req, res) {
    try {
      const { id } = req.params;

      const mappings = await CategoryMapping.findAll({
        where: { customer_id: id },
        attributes: ['id', 'woo_category_id', 'trendyol_category_id', 'woo_category_name', 'trendyol_category_name', 'is_active']
      });

      res.json({
        success: true,
        data: mappings
      });
    } catch (error) {
      logger.error('Error in getCategoryMappings:', error);
      res.status(500).json({
        error: 'Failed to fetch category mappings',
        message: error.message
      });
    }
  }

  /**
   * Update category mappings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateCategoryMappings(req, res) {
    try {
      const { id } = req.params;
      const { mappings } = req.body;

      if (!Array.isArray(mappings)) {
        return res.status(400).json({
          error: 'Invalid mappings format',
          message: 'Mappings must be an array'
        });
      }

      // Delete existing mappings
      await CategoryMapping.destroy({ where: { customer_id: id } });

      // Create new mappings
      const mappingData = mappings.map(mapping => ({
        customer_id: id,
        woo_category_id: mapping.woo_category_id,
        trendyol_category_id: mapping.trendyol_category_id,
        woo_category_name: mapping.woo_category_name,
        trendyol_category_name: mapping.trendyol_category_name,
        is_active: mapping.is_active !== undefined ? mapping.is_active : true
      }));

      await CategoryMapping.bulkCreate(mappingData);

      logger.info(`Category mappings updated for customer ID: ${id}`);

      res.json({
        success: true,
        message: 'Category mappings updated successfully',
        data: { count: mappings.length }
      });
    } catch (error) {
      logger.error('Error in updateCategoryMappings:', error);
      res.status(500).json({
        error: 'Failed to update category mappings',
        message: error.message
      });
    }
  }

  // Helper methods

  /**
   * Generate API key
   * @returns {string} Generated API key
   */
  static generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Mask secret for display
   * @param {string} secret - Secret to mask
   * @returns {string} Masked secret
   */
  static maskSecret(secret) {
    if (!secret) return null;
    if (secret.length <= 8) return '*'.repeat(secret.length);
    return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
  }
}

module.exports = new CustomerController(); 