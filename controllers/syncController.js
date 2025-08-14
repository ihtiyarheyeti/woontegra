const SyncLog = require('../models/SyncLog');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');

/**
 * Manual sync trigger
 * Manuel senkronizasyon tetikleme
 */
const triggerManualSync = async (req, res) => {
  try {
    const { customer_id } = req.user;
    
    logger.info(`Manual sync triggered for customer ${customer_id}`);
    
    // Burada senkronizasyon işlemleri yapılacak
    // Şimdilik mock response döndürüyoruz
    
    res.json({
      success: true,
      message: 'Manual sync triggered successfully',
      data: {
        customer_id,
        timestamp: new Date(),
        status: 'pending'
      }
    });
  } catch (error) {
    logger.error('Error in manual sync:', error);
    res.status(500).json({
      success: false,
      message: 'Manual sync failed',
      error: error.message
    });
  }
};

/**
 * Get sync logs
 * Senkronizasyon loglarını getir
 */
const getSyncLogs = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const logs = await SyncLog.findAndCountAll({
      where: { customer_id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        logs: logs.rows,
        total: logs.count,
        page: parseInt(page),
        totalPages: Math.ceil(logs.count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching sync logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync logs',
      error: error.message
    });
  }
};

/**
 * Get sync statistics
 * Senkronizasyon istatistiklerini getir
 */
const getSyncStats = async (req, res) => {
  try {
    const { customer_id } = req.user;
    
    const stats = await SyncLog.findAll({
      where: { customer_id },
      attributes: [
        'status',
        'operation_type',
        'platform',
        [SyncLog.sequelize.fn('COUNT', SyncLog.sequelize.col('id')), 'count']
      ],
      group: ['status', 'operation_type', 'platform']
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching sync stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync statistics',
      error: error.message
    });
  }
};

/**
 * Sync orders from Trendyol
 * Trendyol'dan siparişleri senkronize et
 */
const syncOrders = async (req, res) => {
  try {
    const { customer_id } = req.user;
    
    logger.info(`Order sync triggered for customer ${customer_id}`);
    
    // Mock order sync response
    res.json({
      success: true,
      message: 'Orders synced successfully',
      data: {
        customer_id,
        orders_synced: 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in order sync:', error);
    res.status(500).json({
      success: false,
      message: 'Order sync failed',
      error: error.message
    });
  }
};

/**
 * Sync stock updates
 * Stok güncellemelerini senkronize et
 */
const syncStock = async (req, res) => {
  try {
    const { customer_id } = req.user;
    
    logger.info(`Stock sync triggered for customer ${customer_id}`);
    
    // Mock stock sync response
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        customer_id,
        products_updated: 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in stock sync:', error);
    res.status(500).json({
      success: false,
      message: 'Stock sync failed',
      error: error.message
    });
  }
};

/**
 * Sync price updates
 * Fiyat güncellemelerini senkronize et
 */
const syncPrices = async (req, res) => {
  try {
    const { customer_id } = req.user;
    
    logger.info(`Price sync triggered for customer ${customer_id}`);
    
    // Mock price sync response
    res.json({
      success: true,
      message: 'Prices updated successfully',
      data: {
        customer_id,
        products_updated: 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in price sync:', error);
    res.status(500).json({
      success: false,
      message: 'Price sync failed',
      error: error.message
    });
  }
};

module.exports = {
  triggerManualSync,
  getSyncLogs,
  getSyncStats,
  syncOrders,
  syncStock,
  syncPrices
}; 