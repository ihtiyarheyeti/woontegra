const logger = require('../utils/logger');
const TrendyolSync = require('../services/TrendyolSync');
const HepsiburadaSync = require('../services/HepsiburadaSync');
const N11Sync = require('../services/N11Sync');
const WooCommerceSync = require('../services/WooCommerceSync');
const { MarketplaceConnection } = require('../models');

/**
 * Marketplace Sync Controller
 * Tüm pazaryerleri için senkronizasyon işlemlerini yönetir
 */

// Senkronizasyon servislerini başlat
const syncServices = {
  trendyol: new TrendyolSync(),
  hepsiburada: new HepsiburadaSync(),
  n11: new N11Sync(),
  woocommerce: new WooCommerceSync()
};

/**
 * Desteklenen pazaryerlerini listele
 */
const getSupportedMarketplaces = async (req, res) => {
  try {
    const marketplaces = [
      {
        name: 'trendyol',
        display_name: 'Trendyol',
        description: 'Trendyol pazaryeri entegrasyonu'
      },
      {
        name: 'hepsiburada',
        display_name: 'Hepsiburada',
        description: 'Hepsiburada pazaryeri entegrasyonu'
      },
      {
        name: 'n11',
        display_name: 'N11',
        description: 'N11 pazaryeri entegrasyonu'
      },
      {
        name: 'woocommerce',
        display_name: 'WooCommerce',
        description: 'WooCommerce e-ticaret entegrasyonu'
      }
    ];

    res.json({
      success: true,
      data: marketplaces
    });

  } catch (error) {
    logger.error('Error getting supported marketplaces:', error);

    res.status(500).json({
      success: false,
      message: 'Pazaryeri listesi alınamadı',
      error: error.message
    });
  }
};

/**
 * Tüm pazaryerlerinin senkronizasyon durumunu getir
 */
const getAllMarketplaceStatus = async (req, res) => {
  try {
    const customerId = req.user.id;

    logger.info(`Getting all marketplace status for customer ${customerId}`);

    // Her pazaryeri için bağlantı kontrolü yap
    const allStatus = {};
    
    for (const [marketplace, syncService] of Object.entries(syncServices)) {
      try {
        const status = await syncService.getSyncStatus(customerId);
        allStatus[marketplace] = status;
      } catch (error) {
        logger.error(`Error getting status for ${marketplace}:`, error);
        allStatus[marketplace] = {
          last_sync: null,
          product_count: 0,
          has_connection: false
        };
      }
    }

    res.json({
      success: true,
      data: allStatus
    });

  } catch (error) {
    logger.error('Error getting all marketplace status:', error);

    res.status(500).json({
      success: false,
      message: 'Pazaryeri durumları alınamadı',
      error: error.message
    });
  }
};

/**
 * Belirli bir pazaryerinden ürünleri senkronize et
 */
const syncProductsFromMarketplace = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { marketplace } = req.params;

    logger.info(`${marketplace} product sync requested for customer ${customerId}`);

    // Pazaryeri destekleniyor mu kontrol et
    if (!syncServices[marketplace]) {
      return res.status(400).json({
        success: false,
        message: `Desteklenmeyen pazaryeri: ${marketplace}`
      });
    }

    // Senkronizasyon işlemini başlat
    const syncService = syncServices[marketplace];
    const result = await syncService.syncProducts(customerId);

    res.json({
      success: true,
      message: `${marketplace} ürünleri başarıyla senkronize edildi`,
      data: result
    });

  } catch (error) {
    logger.error(`Error in ${req.params.marketplace} product sync:`, error);

    res.status(500).json({
      success: false,
      message: `${req.params.marketplace} ürün senkronizasyonu başarısız`,
      error: error.message
    });
  }
};

/**
 * Pazaryeri senkronizasyon durumunu getir
 */
const getMarketplaceSyncStatus = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { marketplace } = req.params;

    logger.info(`Getting ${marketplace} sync status for customer ${customerId}`);

    // Pazaryeri destekleniyor mu kontrol et
    if (!syncServices[marketplace]) {
      return res.status(400).json({
        success: false,
        message: `Desteklenmeyen pazaryeri: ${marketplace}`
      });
    }

    const syncService = syncServices[marketplace];
    const status = await syncService.getSyncStatus(customerId);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error(`Error getting ${req.params.marketplace} sync status:`, error);

    res.status(500).json({
      success: false,
      message: 'Senkronizasyon durumu alınamadı',
      error: error.message
    });
  }
};

/**
 * Pazaryeri ürünlerini listele
 */
const getMarketplaceProducts = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { marketplace } = req.params;
    const { page = 1, limit = 10, search, status } = req.query;

    logger.info(`Getting ${marketplace} products for customer ${customerId}`);

    // Pazaryeri destekleniyor mu kontrol et
    if (!syncServices[marketplace]) {
      return res.status(400).json({
        success: false,
        message: `Desteklenmeyen pazaryeri: ${marketplace}`
      });
    }

    const syncService = syncServices[marketplace];
    const products = await syncService.getProducts(customerId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    logger.error(`Error getting ${req.params.marketplace} products:`, error);

    res.status(500).json({
      success: false,
      message: 'Ürünler alınamadı',
      error: error.message
    });
  }
};

module.exports = {
  getSupportedMarketplaces,
  getAllMarketplaceStatus,
  syncProductsFromMarketplace,
  getMarketplaceSyncStatus,
  getMarketplaceProducts
}; 
 