const { Customer } = require('../models');
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
  const { marketplace, connectionData } = req.body;
  const customer_id = req.user.id;

  logger.info(`🔄 Pazaryeri bağlantısı kaydediliyor - Customer ID: ${customer_id}, Marketplace: ${marketplace}`);

  try {
    if (!marketplace || !connectionData) {
      return res.status(400).json({
        success: false,
        message: 'Marketplace ve bağlantı bilgileri gereklidir'
      });
    }

    // Find customer and update marketplace connection data
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Update customer with marketplace connection data
    const updateData = {};
    
    switch (marketplace) {
      case 'woocommerce':
        updateData.woo_store_url = connectionData.storeUrl;
        updateData.woo_consumer_key = connectionData.consumerKey;
        updateData.woo_consumer_secret = connectionData.consumerSecret;
        break;
      case 'trendyol':
        updateData.trendyol_seller_id = connectionData.seller_id;
        updateData.trendyol_integration_code = connectionData.integration_code;
        updateData.trendyol_api_key = connectionData.api_key;
        updateData.trendyol_api_secret = connectionData.api_secret;
        updateData.trendyol_token = connectionData.token || null;
        break;
      case 'hepsiburada':
        updateData.hepsiburada_merchant_id = connectionData.merchant_id;
        updateData.hepsiburada_api_key = connectionData.api_key;
        updateData.hepsiburada_api_secret = connectionData.api_secret;
        break;
      case 'n11':
        updateData.n11_app_key = connectionData.app_key;
        updateData.n11_app_secret = connectionData.app_secret;
        break;
      case 'ciceksepeti':
        updateData.ciceksepeti_dealer_code = connectionData.dealer_code;
        updateData.ciceksepeti_api_key = connectionData.api_key;
        updateData.ciceksepeti_secret_key = connectionData.secret_key;
        break;
      case 'pazarama':
        updateData.pazarama_merchant_id = connectionData.merchant_id;
        updateData.pazarama_api_key = connectionData.api_key;
        updateData.pazarama_secret_key = connectionData.secret_key;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Geçersiz marketplace'
        });
    }

    await customer.update(updateData);

    const duration = Date.now() - startTime;
    logger.info(`✅ Pazaryeri bağlantısı kaydedildi - Customer ID: ${customer_id}, Marketplace: ${marketplace}, Süre: ${duration}ms`);

    res.json({
      success: true,
      message: `${marketplace} bağlantısı başarıyla kaydedildi`,
      data: {
        marketplace,
        savedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Pazaryeri bağlantısı kaydetme hatası - Customer ID: ${customer_id}, Marketplace: ${marketplace}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Bağlantı kaydedilirken hata oluştu',
      error: error.message
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

  logger.info(`🔄 Pazaryeri bağlantıları getiriliyor - Customer ID: ${customer_id}`);

  try {
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    const connections = {
      woocommerce: {
        storeUrl: customer.woo_store_url || '',
        consumerKey: customer.woo_consumer_key || '',
        consumerSecret: customer.woo_consumer_secret || '',
        isConnected: !!(customer.woo_store_url && customer.woo_consumer_key && customer.woo_consumer_secret)
      },
      trendyol: {
        seller_id: customer.trendyol_seller_id || '',
        integration_code: customer.trendyol_integration_code || '',
        api_key: customer.trendyol_api_key || '',
        api_secret: customer.trendyol_api_secret || '',
        token: customer.trendyol_token || '',
        isConnected: !!(customer.trendyol_seller_id && customer.trendyol_integration_code && customer.trendyol_api_key && customer.trendyol_api_secret)
      },
      hepsiburada: {
        merchant_id: customer.hepsiburada_merchant_id || '',
        api_key: customer.hepsiburada_api_key || '',
        api_secret: customer.hepsiburada_api_secret || '',
        isConnected: !!(customer.hepsiburada_merchant_id && customer.hepsiburada_api_key && customer.hepsiburada_api_secret)
      },
      n11: {
        app_key: customer.n11_app_key || '',
        app_secret: customer.n11_app_secret || '',
        isConnected: !!(customer.n11_app_key && customer.n11_app_secret)
      },
      ciceksepeti: {
        dealer_code: customer.ciceksepeti_dealer_code || '',
        api_key: customer.ciceksepeti_api_key || '',
        secret_key: customer.ciceksepeti_secret_key || '',
        isConnected: !!(customer.ciceksepeti_dealer_code && customer.ciceksepeti_api_key && customer.ciceksepeti_secret_key)
      },
      pazarama: {
        merchant_id: customer.pazarama_merchant_id || '',
        api_key: customer.pazarama_api_key || '',
        secret_key: customer.pazarama_secret_key || '',
        isConnected: !!(customer.pazarama_merchant_id && customer.pazarama_api_key && customer.pazarama_secret_key)
      }
    };

    const duration = Date.now() - startTime;
    logger.info(`✅ Pazaryeri bağlantıları getirildi - Customer ID: ${customer_id}, Süre: ${duration}ms`);

    res.json({
      success: true,
      data: connections
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Pazaryeri bağlantıları getirme hatası - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Bağlantılar getirilirken hata oluştu',
      error: error.message
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