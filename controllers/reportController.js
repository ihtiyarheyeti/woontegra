const { Order, SyncLog, Product } = require('../models');
const logger = require('../utils/logger');

// Get summary statistics
const getSummary = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const { period = '30' } = req.query;

    // Mock summary data
    const summary = {
      total_orders: 156,
      total_revenue: 125000,
      total_products: 45,
      sync_success_rate: 94.5,
      orders_this_month: 23,
      revenue_this_month: 18500,
      avg_order_value: 801.28,
      top_platform: 'trendyol'
    };

    logger.info(`Summary report generated for customer ${customer_id}`);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error generating summary report:', error);
    res.status(500).json({
      success: false,
      message: 'Özet raporu oluşturulurken hata oluştu'
    });
  }
};

// Get sales by month
const getSalesByMonth = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const { year = new Date().getFullYear() } = req.query;

    // Mock monthly sales data
    const monthlySales = [
      { month: 'Ocak', sales: 12500, orders: 15 },
      { month: 'Şubat', sales: 15800, orders: 18 },
      { month: 'Mart', sales: 14200, orders: 16 },
      { month: 'Nisan', sales: 18900, orders: 22 },
      { month: 'Mayıs', sales: 22100, orders: 25 },
      { month: 'Haziran', sales: 19800, orders: 23 },
      { month: 'Temmuz', sales: 18500, orders: 21 },
      { month: 'Ağustos', sales: 16200, orders: 19 },
      { month: 'Eylül', sales: 14500, orders: 17 },
      { month: 'Ekim', sales: 17800, orders: 20 },
      { month: 'Kasım', sales: 20100, orders: 24 },
      { month: 'Aralık', sales: 23400, orders: 27 }
    ];

    logger.info(`Monthly sales report generated for customer ${customer_id}`);

    res.json({
      success: true,
      data: monthlySales
    });
  } catch (error) {
    logger.error('Error generating monthly sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Aylık satış raporu oluşturulurken hata oluştu'
    });
  }
};

// Get top products
const getTopProducts = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const { limit = 10 } = req.query;

    // Mock top products data
    const topProducts = [
      { name: 'iPhone 14 Pro', sales: 45, revenue: 2025000, platform: 'trendyol' },
      { name: 'Samsung Galaxy S23', sales: 38, revenue: 1444000, platform: 'trendyol' },
      { name: 'MacBook Pro 14"', sales: 12, revenue: 1020000, platform: 'woocommerce' },
      { name: 'Nike Air Max', sales: 67, revenue: 80400, platform: 'trendyol' },
      { name: 'Adidas Ultraboost', sales: 52, revenue: 93600, platform: 'woocommerce' },
      { name: 'iPad Pro', sales: 18, revenue: 324000, platform: 'trendyol' },
      { name: 'Sony WH-1000XM4', sales: 25, revenue: 62500, platform: 'woocommerce' },
      { name: 'Apple Watch Series 8', sales: 31, revenue: 124000, platform: 'trendyol' },
      { name: 'Samsung Galaxy Buds', sales: 42, revenue: 42000, platform: 'trendyol' },
      { name: 'Logitech MX Master 3', sales: 28, revenue: 28000, platform: 'woocommerce' }
    ].slice(0, parseInt(limit));

    logger.info(`Top products report generated for customer ${customer_id}`);

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    logger.error('Error generating top products report:', error);
    res.status(500).json({
      success: false,
      message: 'En çok satan ürünler raporu oluşturulurken hata oluştu'
    });
  }
};

// Get sync statistics
const getSyncStats = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const { period = '30' } = req.query;

    // Mock sync statistics
    const syncStats = {
      total_syncs: 1247,
      successful_syncs: 1178,
      failed_syncs: 69,
      success_rate: 94.5,
      by_platform: {
        woocommerce: { total: 623, success: 598, failed: 25 },
        trendyol: { total: 624, success: 580, failed: 44 }
      },
      by_operation: {
        product_sync: { total: 456, success: 432, failed: 24 },
        order_sync: { total: 523, success: 498, failed: 25 },
        stock_update: { total: 268, success: 248, failed: 20 }
      },
      recent_activity: [
        { date: '2024-01-15', operation: 'product_sync', platform: 'trendyol', status: 'success' },
        { date: '2024-01-15', operation: 'order_sync', platform: 'woocommerce', status: 'success' },
        { date: '2024-01-14', operation: 'stock_update', platform: 'trendyol', status: 'failed' },
        { date: '2024-01-14', operation: 'product_sync', platform: 'woocommerce', status: 'success' },
        { date: '2024-01-13', operation: 'order_sync', platform: 'trendyol', status: 'success' }
      ]
    };

    logger.info(`Sync statistics report generated for customer ${customer_id}`);

    res.json({
      success: true,
      data: syncStats
    });
  } catch (error) {
    logger.error('Error generating sync statistics report:', error);
    res.status(500).json({
      success: false,
      message: 'Senkronizasyon istatistikleri oluşturulurken hata oluştu'
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const { period = '30' } = req.query;

    // Mock order statistics
    const orderStats = {
      total_orders: 156,
      total_revenue: 125000,
      avg_order_value: 801.28,
      by_status: {
        pending: 23,
        processing: 18,
        completed: 98,
        cancelled: 17
      },
      by_platform: {
        woocommerce: { orders: 67, revenue: 53400 },
        trendyol: { orders: 89, revenue: 71600 }
      },
      by_payment_status: {
        paid: 134,
        pending: 15,
        failed: 4,
        refunded: 3
      },
      by_shipping_status: {
        pending: 28,
        shipped: 45,
        delivered: 83
      },
      monthly_trend: [
        { month: 'Ocak', orders: 15, revenue: 12500 },
        { month: 'Şubat', orders: 18, revenue: 15800 },
        { month: 'Mart', orders: 16, revenue: 14200 },
        { month: 'Nisan', orders: 22, revenue: 18900 },
        { month: 'Mayıs', orders: 25, revenue: 22100 },
        { month: 'Haziran', orders: 23, revenue: 19800 },
        { month: 'Temmuz', orders: 21, revenue: 18500 },
        { month: 'Ağustos', orders: 19, revenue: 16200 },
        { month: 'Eylül', orders: 17, revenue: 14500 },
        { month: 'Ekim', orders: 20, revenue: 17800 },
        { month: 'Kasım', orders: 24, revenue: 20100 },
        { month: 'Aralık', orders: 27, revenue: 23400 }
      ]
    };

    logger.info(`Order statistics report generated for customer ${customer_id}`);

    res.json({
      success: true,
      data: orderStats
    });
  } catch (error) {
    logger.error('Error generating order statistics report:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş istatistikleri oluşturulurken hata oluştu'
    });
  }
};

module.exports = {
  getSummary,
  getSalesByMonth,
  getTopProducts,
  getSyncStats,
  getOrderStats
}; 