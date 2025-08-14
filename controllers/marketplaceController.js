const Customer = require('../models/Customer');
const MarketplaceConnection = require('../models/MarketplaceConnection');
const marketplaceService = require('../services/marketplaceService');
const logger = require('../utils/logger');

/**
 * Test WooCommerce connection
 * POST /api/marketplaces/test-woocommerce
 */
async function testWooCommerceConnection(req, res) {
  const startTime = Date.now();
  const { storeUrl, consumerKey, consumerSecret } = req.body;
  const customer_id = req.user.id;

  logger.info(`🔄 WooCommerce bağlantı testi isteği - Customer ID: ${customer_id}`);

  try {
    if (!storeUrl || !consumerKey || !consumerSecret) {
      return res.status(400).json({
        success: false,
        message: 'Store URL, Consumer Key ve Consumer Secret gereklidir'
      });
    }

    const result = await marketplaceService.testWooCommerceConnection(storeUrl, consumerKey, consumerSecret);
    
    const duration = Date.now() - startTime;
    logger.info(`✅ WooCommerce bağlantı testi tamamlandı - Customer ID: ${customer_id}, Başarılı: ${result.success}, Süre: ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ WooCommerce bağlantı testi hatası - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Bağlantı testi sırasında hata oluştu',
      error: error.message
    });
  }
}

/**
 * Test Trendyol connection
 * POST /api/marketplaces/test-trendyol
 */
async function testTrendyolConnection(req, res) {
  const startTime = Date.now();
  const { seller_id, integration_code, api_key, api_secret, token } = req.body;
  const customer_id = req.user.id;

  logger.info(`🔄 Trendyol bağlantı testi isteği - Customer ID: ${customer_id}`);

  try {
    // Validate required fields
    if (!seller_id || !integration_code || !api_key || !api_secret) {
      logger.warn(`⚠️ Trendyol bağlantı testi - eksik zorunlu alanlar - Customer ID: ${customer_id}`);
      return res.status(400).json({
        success: false,
        message: 'Seller ID, Integration Code, API Key ve API Secret alanları zorunludur'
      });
    }

    const result = await marketplaceService.testTrendyolConnection(seller_id, integration_code, api_key, api_secret, token);
    
    const duration = Date.now() - startTime;
    logger.info(`✅ Trendyol bağlantı testi tamamlandı - Customer ID: ${customer_id}, Başarılı: ${result.success}, Süre: ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Trendyol bağlantı testi hatası - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Bağlantı testi sırasında hata oluştu',
      error: error.message
    });
  }
}

/**
 * Test Hepsiburada connection
 * POST /api/marketplaces/test-hepsiburada
 */
async function testHepsiburadaConnection(req, res) {
  const startTime = Date.now();
  const { merchant_id, api_key, api_secret } = req.body;
  const customer_id = req.user.id;

  logger.info(`🔄 Hepsiburada bağlantı testi isteği - Customer ID: ${customer_id}`);

  try {
    if (!merchant_id || !api_key || !api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Merchant ID, API Key ve API Secret gereklidir'
      });
    }

    const result = await marketplaceService.testHepsiburadaConnection(api_key, api_secret, merchant_id);
    
    const duration = Date.now() - startTime;
    logger.info(`✅ Hepsiburada bağlantı testi tamamlandı - Customer ID: ${customer_id}, Başarılı: ${result.success}, Süre: ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Hepsiburada bağlantı testi hatası - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Bağlantı testi sırasında hata oluştu',
      error: error.message
    });
  }
}

/**
 * Test N11 connection
 * POST /api/marketplaces/test-n11
 */
async function testN11Connection(req, res) {
  const startTime = Date.now();
  const { app_key, app_secret } = req.body;
  const customer_id = req.user.id;

  logger.info(`🔄 N11 bağlantı testi isteği - Customer ID: ${customer_id}`);

  try {
    if (!app_key || !app_secret) {
      return res.status(400).json({
        success: false,
        message: 'App Key ve App Secret gereklidir'
      });
    }

    const result = await marketplaceService.testN11Connection(app_key, app_secret);
    
    const duration = Date.now() - startTime;
    logger.info(`✅ N11 bağlantı testi tamamlandı - Customer ID: ${customer_id}, Başarılı: ${result.success}, Süre: ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ N11 bağlantı testi hatası - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Bağlantı testi sırasında hata oluştu',
      error: error.message
    });
  }
}

/**
 * Test ÇiçekSepeti connection
 * POST /api/marketplaces/test-ciceksepeti
 */
async function testCicekSepetiConnection(req, res) {
  const startTime = Date.now();
  const { dealer_code, api_key, secret_key } = req.body;
  const customer_id = req.user.id;

  logger.info(`🔄 ÇiçekSepeti bağlantı testi isteği - Customer ID: ${customer_id}`);

  try {
    if (!dealer_code || !api_key || !secret_key) {
      return res.status(400).json({
        success: false,
        message: 'Dealer Code, API Key ve Secret Key gereklidir'
      });
    }

    const result = await marketplaceService.testCicekSepetiConnection(dealer_code, api_key, secret_key);
    
    const duration = Date.now() - startTime;
    logger.info(`✅ ÇiçekSepeti bağlantı testi tamamlandı - Customer ID: ${customer_id}, Başarılı: ${result.success}, Süre: ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ ÇiçekSepeti bağlantı testi hatası - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Bağlantı testi sırasında hata oluştu',
      error: error.message
    });
  }
}

/**
 * Test Pazarama connection
 * POST /api/marketplaces/test-pazarama
 */
async function testPazaramaConnection(req, res) {
  const startTime = Date.now();
  const { merchant_id, api_key, secret_key } = req.body;
  const customer_id = req.user.id;

  logger.info(`🔄 Pazarama bağlantı testi isteği - Customer ID: ${customer_id}`);

  try {
    if (!merchant_id || !api_key || !secret_key) {
      return res.status(400).json({
        success: false,
        message: 'Merchant ID, API Key ve Secret Key gereklidir'
      });
    }

    const result = await marketplaceService.testPazaramaConnection(merchant_id, api_key, secret_key);
    
    const duration = Date.now() - startTime;
    logger.info(`✅ Pazarama bağlantı testi tamamlandı - Customer ID: ${customer_id}, Başarılı: ${result.success}, Süre: ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Pazarama bağlantı testi hatası - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Bağlantı testi sırasında hata oluştu',
      error: error.message
    });
  }
}

/**
 * Save marketplace connection
 * POST /api/marketplaces/save-connection
 */
async function saveMarketplaceConnection(req, res) {
  const startTime = Date.now();
  const customer_id = req.user.id;
  const tenant_id = req.user.tenant_id;
  
  logger.info(`🔄 Pazaryeri bağlantısı kaydediliyor - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);
  
  try {
    const { marketplace_name, store_name, api_key, api_secret, additional_config } = req.body;
    
    if (!marketplace_name || !store_name || !api_key || !api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik'
      });
    }
    
    const MarketplaceConnection = require('../models/MarketplaceConnection');
    
    // Mevcut bağlantıyı kontrol et
    const existingConnection = await MarketplaceConnection.findOne({
      where: { 
        tenant_id, 
        marketplace_name 
      }
    });
    
    let connection;
    if (existingConnection) {
      // Mevcut bağlantıyı güncelle
      connection = await existingConnection.update({
        store_name,
        api_key,
        api_secret,
        additional_config,
        updated_at: new Date()
      });
      logger.info(`🔄 Pazaryeri bağlantısı güncellendi - ID: ${connection.id}`);
    } else {
      // Yeni bağlantı oluştur
      connection = await MarketplaceConnection.create({
        tenant_id,
        customer_id,
        marketplace_name,
        store_name,
        api_key,
        api_secret,
        additional_config,
        status: 'active'
      });
      logger.info(`🆕 Yeni pazaryeri bağlantısı oluşturuldu - ID: ${connection.id}`);
    }

    const duration = Date.now() - startTime;
    logger.info(`✅ Pazaryeri bağlantısı başarıyla kaydedildi - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}, Marketplace: ${marketplace_name}, Süre: ${duration}ms`);

    res.json({
      success: true,
      message: `${marketplace_name} bağlantısı başarıyla kaydedildi`,
      data: connection,
      duration: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Pazaryeri bağlantısı kaydedilirken hata - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Pazaryeri bağlantısı kaydedilirken bir hata oluştu',
      error: error.message,
      duration: duration
    });
  }
}

/**
 * Get marketplace connections
 * GET /api/marketplaces/connections
 */
async function getMarketplaceConnections(req, res) {
  const startTime = Date.now();
  const customer_id = req.user.id;
  const tenant_id = req.user.tenant_id;
  
  logger.info(`🔄 Pazaryeri bağlantıları getiriliyor - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);
  
  try {
    const MarketplaceConnection = require('../models/MarketplaceConnection');
    
    const connections = await MarketplaceConnection.findAll({
      where: { tenant_id },
      order: [['created_at', 'DESC']]
    });

    const duration = Date.now() - startTime;
    logger.info(`✅ Pazaryeri bağlantıları başarıyla getirildi - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}, Bağlantı Sayısı: ${connections.length}, Süre: ${duration}ms`);

    res.json({
      success: true,
      message: 'Pazaryeri bağlantıları başarıyla getirildi',
      data: connections,
      duration: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Pazaryeri bağlantıları alınırken hata - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Pazaryeri bağlantıları alınırken bir hata oluştu',
      error: error.message,
      duration: duration
    });
  }
}

module.exports = {
  testWooCommerceConnection,
  testTrendyolConnection,
  testHepsiburadaConnection,
  testN11Connection,
  testCicekSepetiConnection,
  testPazaramaConnection,
  saveMarketplaceConnection,
  getMarketplaceConnections
}; 