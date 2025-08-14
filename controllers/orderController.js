const Order = require('../models/Order');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

/**
 * Get all orders
 * Tüm siparişleri getir
 */
const getAllOrders = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { customer_id };
    
    if (status) {
      whereClause.status = status;
    }
    
    const orders = await Order.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        page: parseInt(page),
        totalPages: Math.ceil(orders.count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

/**
 * Get order by ID
 * ID'ye göre sipariş getir
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer_id = req.user.id;
    
    const order = await Order.findOne({
      where: { id, customer_id }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

/**
 * Get orders by status
 * Duruma göre siparişleri getir
 */
const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const customer_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const orders = await Order.findAndCountAll({
      where: { customer_id, status },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        page: parseInt(page),
        totalPages: Math.ceil(orders.count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching orders by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders by status',
      error: error.message
    });
  }
};

/**
 * Update order status
 * Sipariş durumunu güncelle
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const customer_id = req.user.id;
    
    const order = await Order.findOne({
      where: { id, customer_id }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    await order.update({ status });
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

/**
 * Sync orders from Trendyol
 * Trendyol'dan siparişleri senkronize et
 */
const syncOrdersFromTrendyol = async (req, res) => {
  try {
    const customer_id = req.user.id;
    
    logger.info(`Trendyol order sync triggered for customer ${customer_id}`);
    
    // Mock Trendyol order sync
    // Gerçek implementasyonda Trendyol API'si çağrılacak
    
    res.json({
      success: true,
      message: 'Orders synced from Trendyol successfully',
      data: {
        customer_id,
        orders_synced: 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error syncing orders from Trendyol:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync orders from Trendyol',
      error: error.message
    });
  }
};

/**
 * Get order statistics
 * Sipariş istatistiklerini getir
 */
const getOrderStats = async (req, res) => {
  try {
    const customer_id = req.user.id;
    
    // Get total orders
    const totalOrders = await Order.count({
      where: { customer_id }
    });
    
    // Get pending orders
    const pendingOrders = await Order.count({
      where: { 
        customer_id,
        status: 'pending'
      }
    });
    
    // Get total revenue (sum of all order totals)
    const totalRevenue = await Order.sum('total_amount', {
      where: { 
        customer_id,
        status: 'completed' // Only count completed orders for revenue
      }
    });
    
    // Get orders by status for detailed stats
    const statsByStatus = await Order.findAll({
      where: { customer_id },
      attributes: [
        'status',
        [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    res.json({
      success: true,
      data: {
        total: totalOrders,
        pending: pendingOrders,
        totalRevenue: totalRevenue || 0,
        statsByStatus: statsByStatus
      }
    });
  } catch (error) {
    logger.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByStatus,
  updateOrderStatus,
  syncOrdersFromTrendyol,
  getOrderStats
}; 