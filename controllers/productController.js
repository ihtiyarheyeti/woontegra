const { Product, SyncLog, Customer } = require('../models');
const logger = require('../utils/logger');

/**
 * Get WooCommerce products
 * GET /api/products/woocommerce
 */
const getWooCommerceProducts = async (req, res) => {
  try {
    const { customer_id } = req.query;

    if (!customer_id) {
      return res.status(400).json({
        error: 'Missing customer_id',
        message: 'customer_id is required'
      });
    }

    // Mock WooCommerce products for demo
    // In production, this would fetch from WooCommerce API
    const wooProducts = [
      {
        id: 1,
        name: 'iPhone 14 Pro',
        sku: 'IPHONE14PRO',
        price: 45000,
        stock: 15,
        category: 'Elektronik',
        status: 'publish'
      },
      {
        id: 2,
        name: 'Samsung Galaxy S23',
        sku: 'SAMSUNG-S23',
        price: 38000,
        stock: 8,
        category: 'Elektronik',
        status: 'publish'
      },
      {
        id: 3,
        name: 'Nike Air Max',
        sku: 'NIKE-AIRMAX',
        price: 1200,
        stock: 25,
        category: 'Spor & Outdoor',
        status: 'publish'
      },
      {
        id: 4,
        name: 'MacBook Pro 14"',
        sku: 'MACBOOK-PRO-14',
        price: 85000,
        stock: 3,
        category: 'Elektronik',
        status: 'publish'
      },
      {
        id: 5,
        name: 'Adidas Ultraboost',
        sku: 'ADIDAS-ULTRABOOST',
        price: 1800,
        stock: 12,
        category: 'Spor & Outdoor',
        status: 'publish'
      }
    ];

    logger.info(`WooCommerce products fetched for customer ${customer_id}`);

    res.json({
      success: true,
      data: {
        products: wooProducts
      }
    });
  } catch (error) {
    logger.error('Get WooCommerce products error:', error);
    res.status(500).json({
      error: 'Failed to get WooCommerce products',
      message: 'An error occurred while fetching products'
    });
  }
};

/**
 * Get Trendyol products
 * GET /api/products/trendyol
 */
const getTrendyolProducts = async (req, res) => {
  try {
    const { customer_id } = req.query;

    if (!customer_id) {
      return res.status(400).json({
        error: 'Missing customer_id',
        message: 'customer_id is required'
      });
    }

    // Mock Trendyol products for demo
    // In production, this would fetch from Trendyol API
    const trendyolProducts = [
      {
        id: 101,
        name: 'iPhone 14 Pro',
        barcode: '1234567890123',
        price: 45000,
        stock: 15,
        category: 'Elektronik & Bilgisayar',
        status: 'active'
      },
      {
        id: 102,
        name: 'Samsung Galaxy S23',
        barcode: '1234567890124',
        price: 38000,
        stock: 8,
        category: 'Elektronik & Bilgisayar',
        status: 'active'
      },
      {
        id: 103,
        name: 'Nike Air Max',
        barcode: '1234567890125',
        price: 1200,
        stock: 25,
        category: 'Spor & Outdoor',
        status: 'active'
      },
      {
        id: 104,
        name: 'MacBook Pro 14"',
        barcode: '1234567890126',
        price: 85000,
        stock: 3,
        category: 'Elektronik & Bilgisayar',
        status: 'active'
      }
    ];

    logger.info(`Trendyol products fetched for customer ${customer_id}`);

    res.json({
      success: true,
      data: {
        products: trendyolProducts
      }
    });
  } catch (error) {
    logger.error('Get Trendyol products error:', error);
    res.status(500).json({
      error: 'Failed to get Trendyol products',
      message: 'An error occurred while fetching products'
    });
  }
};

/**
 * Sync products between platforms
 * POST /api/products/sync
 */
const syncProducts = async (req, res) => {
  try {
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        error: 'Missing customer_id',
        message: 'customer_id is required'
      });
    }

    // Mock sync process
    // In production, this would compare products and sync missing ones
    const syncResults = {
      total_woo_products: 5,
      total_trendyol_products: 4,
      synced_products: 1,
      failed_products: 0,
      sync_logs: [
        {
          product_name: 'Adidas Ultraboost',
          action: 'created',
          platform: 'trendyol',
          status: 'success'
        }
      ]
    };

    // Log the sync operation
    await SyncLog.create({
      customer_id,
      operation_type: 'product_sync',
      platform: 'both',
      direction: 'outbound',
      status: 'success',
      data: syncResults
    });

    logger.info(`Product sync completed for customer ${customer_id}: ${syncResults.synced_products} products synced`);

    res.json({
      success: true,
      message: 'Product synchronization completed successfully',
      data: syncResults
    });
  } catch (error) {
    logger.error('Product sync error:', error);
    res.status(500).json({
      error: 'Failed to sync products',
      message: 'An error occurred during synchronization'
    });
  }
};

/**
 * Get stock and price information
 * GET /api/products/stocks-prices
 */
const getStocksAndPrices = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const { filter } = req.query;

    // Mock stock and price data
    const stockPriceData = [
      {
        id: 1,
        name: 'iPhone 14 Pro',
        sku: 'IPHONE14PRO',
        woo_price: 45000,
        trendyol_price: 45000,
        woo_stock: 15,
        trendyol_stock: 15,
        price_diff: 0,
        stock_diff: 0,
        needs_update: false,
        category: 'Elektronik'
      },
      {
        id: 2,
        name: 'Samsung Galaxy S23',
        sku: 'SAMSUNG-S23',
        woo_price: 38000,
        trendyol_price: 37500,
        woo_stock: 8,
        trendyol_stock: 8,
        price_diff: 500,
        stock_diff: 0,
        needs_update: true,
        category: 'Elektronik'
      },
      {
        id: 3,
        name: 'Nike Air Max',
        sku: 'NIKE-AIRMAX',
        woo_price: 1200,
        trendyol_price: 1200,
        woo_stock: 25,
        trendyol_stock: 20,
        price_diff: 0,
        stock_diff: 5,
        needs_update: true,
        category: 'Spor & Outdoor'
      },
      {
        id: 4,
        name: 'MacBook Pro 14"',
        sku: 'MACBOOK-PRO-14',
        woo_price: 85000,
        trendyol_price: 84000,
        woo_stock: 3,
        trendyol_stock: 3,
        price_diff: 1000,
        stock_diff: 0,
        needs_update: true,
        category: 'Elektronik'
      },
      {
        id: 5,
        name: 'Adidas Ultraboost',
        sku: 'ADIDAS-ULTRABOOST',
        woo_price: 1800,
        trendyol_price: 1800,
        woo_stock: 12,
        trendyol_stock: 12,
        price_diff: 0,
        stock_diff: 0,
        needs_update: false,
        category: 'Spor & Outdoor'
      }
    ];

    // Filter data based on query parameter
    let filteredData = stockPriceData;
    if (filter === 'needs_update') {
      filteredData = stockPriceData.filter(product => product.needs_update);
    } else if (filter === 'low_stock') {
      filteredData = stockPriceData.filter(product => 
        product.woo_stock < 10 || product.trendyol_stock < 10
      );
    }

    logger.info(`Stock and price data fetched for customer ${customer_id}`);

    res.json({
      success: true,
      data: filteredData,
      total: filteredData.length,
      needs_update: stockPriceData.filter(p => p.needs_update).length,
      low_stock: stockPriceData.filter(p => p.woo_stock < 10 || p.trendyol_stock < 10).length
    });
  } catch (error) {
    logger.error('Error fetching stocks and prices:', error);
    res.status(500).json({
      success: false,
      message: 'Stok ve fiyat bilgileri getirilirken hata oluştu'
    });
  }
};

/**
 * Update stock and price
 * POST /api/products/update-stock-price
 */
const updateStockPrice = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek ürün listesi gerekli'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { product_id, platform, price, stock } = update;

        if (!product_id || !platform) {
          errors.push({
            product_id,
            error: 'product_id ve platform gerekli'
          });
          continue;
        }

        // Mock update process
        const updateResult = {
          product_id,
          platform,
          old_price: price ? price - Math.floor(Math.random() * 1000) : null,
          new_price: price,
          old_stock: stock ? stock - Math.floor(Math.random() * 5) : null,
          new_stock: stock,
          status: 'success',
          updated_at: new Date()
        };

        // Log the update
        await SyncLog.create({
          customer_id,
          operation_type: 'stock_update',
          platform,
          direction: 'outbound',
          status: 'success',
          data: updateResult
        });

        results.push(updateResult);
        logger.info(`Stock/price updated for product ${product_id} on ${platform}`);
      } catch (error) {
        errors.push({
          product_id: update.product_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `${results.length} ürün başarıyla güncellendi`,
      data: {
        updated: results,
        errors: errors,
        total_processed: updates.length,
        success_count: results.length,
        error_count: errors.length
      }
    });
  } catch (error) {
    logger.error('Error updating stock and price:', error);
    res.status(500).json({
      success: false,
      message: 'Stok ve fiyat güncellenirken hata oluştu'
    });
  }
};

/**
 * Get sync logs
 * GET /api/products/sync-logs
 */
const getSyncLogs = async (req, res) => {
  try {
    const { customer_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!customer_id) {
      return res.status(400).json({
        error: 'Missing customer_id',
        message: 'customer_id is required'
      });
    }

    const { count, rows } = await SyncLog.findAndCountAll({
      where: { 
        customer_id,
        operation_type: ['product_sync', 'stock_update', 'price_update']
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get sync logs error:', error);
    res.status(500).json({
      error: 'Failed to get sync logs',
      message: 'An error occurred while fetching logs'
    });
  }
};

module.exports = {
  getWooCommerceProducts,
  getTrendyolProducts,
  syncProducts,
  getStocksAndPrices,
  updateStockPrice,
  getSyncLogs
}; 