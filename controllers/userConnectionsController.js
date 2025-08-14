const MarketplaceConnection = require('../models/MarketplaceConnection');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class UserConnectionsController {
  /**
   * Get all connections for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserConnections(req, res) {
    try {
      const userId = req.user.id;
      const tenantId = req.user.tenant_id;
      const { page = 1, limit = 50, search, status } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause with tenant filtering
      const whereClause = { 
        customer_id: userId,
        tenant_id: tenantId
      };
      
      if (search) {
        whereClause[Op.or] = [
          { store_name: { [Op.like]: `%${search}%` } },
          { marketplace_name: { [Op.like]: `%${search}%` } }
        ];
      }

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      // Get connections with pagination
      const { count, rows: connections } = await MarketplaceConnection.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      logger.info(`User connections retrieved. User: ${userId}, Tenant: ${tenantId}, Count: ${connections.length}`);

      res.json({
        success: true,
        data: connections,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Error in getUserConnections:', error);
      res.status(500).json({
        success: false,
        message: 'Bağlantılar alınırken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Create new connection for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createConnection(req, res) {
    try {
      const userId = req.user.id;
      const tenantId = req.user.tenant_id;
      const { marketplace_name, store_name, api_key, api_secret, additional_config, status = 'active' } = req.body;

      // Validate required fields
      if (!marketplace_name || !store_name || !api_key || !api_secret) {
        return res.status(400).json({
          success: false,
          message: 'Pazaryeri adı, mağaza adı, API anahtarı ve API secret zorunludur'
        });
      }

      // Validate marketplace name
      const validMarketplaces = ['trendyol', 'hepsiburada', 'n11', 'amazon', 'woocommerce'];
      if (!validMarketplaces.includes(marketplace_name)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz pazaryeri adı'
        });
      }

      // Check if connection already exists for this user and marketplace
      const existingConnection = await MarketplaceConnection.findOne({
        where: {
          customer_id: userId,
          tenant_id: tenantId,
          marketplace_name,
          store_name
        }
      });

      if (existingConnection) {
        return res.status(409).json({
          success: false,
          message: 'Bu pazaryeri için zaten bir bağlantınız bulunuyor'
        });
      }

      // Create connection
      const connection = await MarketplaceConnection.create({
        customer_id: userId,
        tenant_id: tenantId,
        marketplace_name,
        store_name,
        api_key,
        api_secret,
        additional_config: additional_config || {},
        status
      });

      logger.info(`Connection created. User: ${userId}, Tenant: ${tenantId}, Marketplace: ${marketplace_name}, Store: ${store_name}`);

      res.status(201).json({
        success: true,
        message: 'Bağlantı başarıyla oluşturuldu',
        data: connection
      });
    } catch (error) {
      logger.error('Error in createConnection:', error);
      res.status(500).json({
        success: false,
        message: 'Bağlantı oluşturulurken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Update connection (only if owned by the user)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateConnection(req, res) {
    try {
      const userId = req.user.id;
      const tenantId = req.user.tenant_id;
      const connectionId = req.params.id;
      const { marketplace_name, store_name, api_key, api_secret, additional_config, status } = req.body;

      // Find connection and verify ownership
      const connection = await MarketplaceConnection.findOne({
        where: {
          id: connectionId,
          customer_id: userId,
          tenant_id: tenantId
        }
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Bağlantı bulunamadı veya bu bağlantıyı düzenleme yetkiniz yok'
        });
      }

      // Validate marketplace name if provided
      if (marketplace_name) {
        const validMarketplaces = ['trendyol', 'hepsiburada', 'n11', 'amazon', 'woocommerce'];
        if (!validMarketplaces.includes(marketplace_name)) {
          return res.status(400).json({
            success: false,
            message: 'Geçersiz pazaryeri adı'
          });
        }
      }

      // Update connection
      const updateData = {};
      if (marketplace_name) updateData.marketplace_name = marketplace_name;
      if (store_name) updateData.store_name = store_name;
      if (api_key) updateData.api_key = api_key;
      if (api_secret) updateData.api_secret = api_secret;
      if (additional_config) updateData.additional_config = additional_config;
      if (status) updateData.status = status;

      await connection.update(updateData);

      logger.info(`Connection updated. User: ${userId}, Tenant: ${tenantId}, Connection ID: ${connectionId}`);

      res.json({
        success: true,
        message: 'Bağlantı başarıyla güncellendi',
        data: connection
      });
    } catch (error) {
      logger.error('Error in updateConnection:', error);
      res.status(500).json({
        success: false,
        message: 'Bağlantı güncellenirken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Delete connection (only if owned by the user)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteConnection(req, res) {
    try {
      const userId = req.user.id;
      const tenantId = req.user.tenant_id;
      const connectionId = req.params.id;

      // Find connection and verify ownership
      const connection = await MarketplaceConnection.findOne({
        where: {
          id: connectionId,
          customer_id: userId,
          tenant_id: tenantId
        }
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Bağlantı bulunamadı veya bu bağlantıyı silme yetkiniz yok'
        });
      }

      // Delete connection
      await connection.destroy();

      logger.info(`Connection deleted. User: ${userId}, Tenant: ${tenantId}, Connection ID: ${connectionId}`);

      res.json({
        success: true,
        message: 'Bağlantı başarıyla silindi'
      });
    } catch (error) {
      logger.error('Error in deleteConnection:', error);
      res.status(500).json({
        success: false,
        message: 'Bağlantı silinirken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Get connection by ID (only if owned by the user)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getConnectionById(req, res) {
    try {
      const userId = req.user.id;
      const tenantId = req.user.tenant_id;
      const connectionId = req.params.id;

      // Find connection and verify ownership
      const connection = await MarketplaceConnection.findOne({
        where: {
          id: connectionId,
          customer_id: userId,
          tenant_id: tenantId
        }
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Bağlantı bulunamadı veya bu bağlantıya erişim yetkiniz yok'
        });
      }

      res.json({
        success: true,
        data: connection
      });
    } catch (error) {
      logger.error('Error in getConnectionById:', error);
      res.status(500).json({
        success: false,
        message: 'Bağlantı alınırken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Get marketplace types (static data)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMarketplaceTypes(req, res) {
    try {
      const marketplaceTypes = [
        { value: 'trendyol', label: 'Trendyol' },
        { value: 'hepsiburada', label: 'Hepsiburada' },
        { value: 'n11', label: 'N11' },
        { value: 'amazon', label: 'Amazon' },
        { value: 'woocommerce', label: 'WooCommerce' }
      ];

      res.json({
        success: true,
        data: marketplaceTypes
      });
    } catch (error) {
      logger.error('Error in getMarketplaceTypes:', error);
      res.status(500).json({
        success: false,
        message: 'Pazaryeri türleri alınırken bir hata oluştu',
        error: error.message
      });
    }
  }
}

module.exports = new UserConnectionsController();