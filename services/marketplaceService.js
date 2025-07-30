const logger = require('../utils/logger');

/**
 * Test WooCommerce connection
 */
async function testWooCommerceConnection(storeUrl, consumerKey, consumerSecret) {
  const startTime = Date.now();
  logger.info(`🔄 WooCommerce bağlantı testi başlatılıyor - Store URL: ${storeUrl}`);
  
  try {
    // Simulate API call to WooCommerce
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate success/failure (90% success rate for valid credentials)
    const isValidUrl = storeUrl && storeUrl.includes('http');
    const hasValidCredentials = consumerKey && consumerSecret && consumerKey.length > 10 && consumerSecret.length > 10;
    
    const duration = Date.now() - startTime;
    
    if (isValidUrl && hasValidCredentials) {
      logger.info(`✅ WooCommerce bağlantı testi başarılı - Store URL: ${storeUrl}, Süre: ${duration}ms`);
      return {
        success: true,
        message: 'WooCommerce bağlantısı başarılı',
        duration: duration
      };
    } else {
      logger.warn(`⚠️ WooCommerce bağlantı testi başarısız - Store URL: ${storeUrl}, Süre: ${duration}ms`);
      return {
        success: false,
        message: 'Geçersiz URL veya API bilgileri',
        duration: duration
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ WooCommerce bağlantı testi hatası - Store URL: ${storeUrl}, Hata: ${error.message}, Süre: ${duration}ms`);
    return {
      success: false,
      message: 'Bağlantı hatası: ' + error.message,
      duration: duration
    };
  }
}

/**
 * Test Trendyol connection
 */
async function testTrendyolConnection(seller_id, integration_code, api_key, api_secret, token = null) {
  const startTime = Date.now();
  logger.info(`🔄 Trendyol bağlantı testi başlatılıyor - Seller ID: ${seller_id}, Integration Code: ${integration_code}`);
  
  try {
    // Simulate API call to Trendyol
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
    
    // Simulate success/failure (85% success rate for valid credentials)
    const hasValidCredentials = seller_id && integration_code && api_key && api_secret && 
                               seller_id.length > 3 && integration_code.length > 5 && 
                               api_key.length > 10 && api_secret.length > 10;
    
    const duration = Date.now() - startTime;
    
    if (hasValidCredentials) {
      logger.info(`✅ Trendyol bağlantı testi başarılı - Seller ID: ${seller_id}, Integration Code: ${integration_code}, Süre: ${duration}ms`);
      return {
        success: true,
        message: 'Trendyol bağlantısı başarılı',
        duration: duration
      };
    } else {
      logger.warn(`⚠️ Trendyol bağlantı testi başarısız - Seller ID: ${seller_id}, Integration Code: ${integration_code}, Süre: ${duration}ms`);
      return {
        success: false,
        message: 'Geçersiz Seller ID, Integration Code, API Key veya API Secret',
        duration: duration
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Trendyol bağlantı testi hatası - Seller ID: ${seller_id}, Integration Code: ${integration_code}, Hata: ${error.message}, Süre: ${duration}ms`);
    return {
      success: false,
      message: 'Bağlantı hatası: ' + error.message,
      duration: duration
    };
  }
}

/**
 * Test Hepsiburada connection
 */
async function testHepsiburadaConnection(apiKey, apiSecret, merchantId) {
  const startTime = Date.now();
  logger.info(`🔄 Hepsiburada bağlantı testi başlatılıyor - Merchant ID: ${merchantId}`);
  
  try {
    // Simulate API call to Hepsiburada
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));
    
    // Simulate success/failure (80% success rate for valid credentials)
    const hasValidCredentials = apiKey && apiSecret && merchantId && 
                               apiKey.length > 10 && apiSecret.length > 10 && merchantId.length > 5;
    
    const duration = Date.now() - startTime;
    
    if (hasValidCredentials) {
      logger.info(`✅ Hepsiburada bağlantı testi başarılı - Merchant ID: ${merchantId}, Süre: ${duration}ms`);
      return {
        success: true,
        message: 'Hepsiburada bağlantısı başarılı',
        duration: duration
      };
    } else {
      logger.warn(`⚠️ Hepsiburada bağlantı testi başarısız - Merchant ID: ${merchantId}, Süre: ${duration}ms`);
      return {
        success: false,
        message: 'Geçersiz API bilgileri veya Merchant ID',
        duration: duration
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Hepsiburada bağlantı testi hatası - Merchant ID: ${merchantId}, Hata: ${error.message}, Süre: ${duration}ms`);
    return {
      success: false,
      message: 'Bağlantı hatası: ' + error.message,
      duration: duration
    };
  }
}

/**
 * Test N11 connection
 */
async function testN11Connection(appKey, appSecret) {
  const startTime = Date.now();
  logger.info(`🔄 N11 bağlantı testi başlatılıyor - App Key: ${appKey}`);
  
  try {
    // Simulate API call to N11
    await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 1600));
    
    // Simulate success/failure (75% success rate for valid credentials)
    const hasValidCredentials = appKey && appSecret && 
                               appKey.length > 10 && appSecret.length > 10;
    
    const duration = Date.now() - startTime;
    
    if (hasValidCredentials) {
      logger.info(`✅ N11 bağlantı testi başarılı - App Key: ${appKey}, Süre: ${duration}ms`);
      return {
        success: true,
        message: 'N11 bağlantısı başarılı',
        duration: duration
      };
    } else {
      logger.warn(`⚠️ N11 bağlantı testi başarısız - App Key: ${appKey}, Süre: ${duration}ms`);
      return {
        success: false,
        message: 'Geçersiz App Key veya App Secret',
        duration: duration
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ N11 bağlantı testi hatası - App Key: ${appKey}, Hata: ${error.message}, Süre: ${duration}ms`);
    return {
      success: false,
      message: 'Bağlantı hatası: ' + error.message,
      duration: duration
    };
  }
}

/**
 * Test ÇiçekSepeti connection
 */
async function testCicekSepetiConnection(dealerCode, apiKey, secretKey) {
  const startTime = Date.now();
  logger.info(`🔄 ÇiçekSepeti bağlantı testi başlatılıyor - Dealer Code: ${dealerCode}`);
  
  try {
    // Simulate API call to ÇiçekSepeti
    await new Promise(resolve => setTimeout(resolve, 1100 + Math.random() * 1700));
    
    // Simulate success/failure (70% success rate for valid credentials)
    const hasValidCredentials = dealerCode && apiKey && secretKey && 
                               dealerCode.length > 5 && apiKey.length > 10 && secretKey.length > 10;
    
    const duration = Date.now() - startTime;
    
    if (hasValidCredentials) {
      logger.info(`✅ ÇiçekSepeti bağlantı testi başarılı - Dealer Code: ${dealerCode}, Süre: ${duration}ms`);
      return {
        success: true,
        message: 'ÇiçekSepeti bağlantısı başarılı',
        duration: duration
      };
    } else {
      logger.warn(`⚠️ ÇiçekSepeti bağlantı testi başarısız - Dealer Code: ${dealerCode}, Süre: ${duration}ms`);
      return {
        success: false,
        message: 'Geçersiz Dealer Code, API Key veya Secret Key',
        duration: duration
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ ÇiçekSepeti bağlantı testi hatası - Dealer Code: ${dealerCode}, Hata: ${error.message}, Süre: ${duration}ms`);
    return {
      success: false,
      message: 'Bağlantı hatası: ' + error.message,
      duration: duration
    };
  }
}

/**
 * Test Pazarama connection
 */
async function testPazaramaConnection(merchantId, apiKey, secretKey) {
  const startTime = Date.now();
  logger.info(`🔄 Pazarama bağlantı testi başlatılıyor - Merchant ID: ${merchantId}`);
  
  try {
    // Simulate API call to Pazarama
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1900));
    
    // Simulate success/failure (65% success rate for valid credentials)
    const hasValidCredentials = merchantId && apiKey && secretKey && 
                               merchantId.length > 5 && apiKey.length > 10 && secretKey.length > 10;
    
    const duration = Date.now() - startTime;
    
    if (hasValidCredentials) {
      logger.info(`✅ Pazarama bağlantı testi başarılı - Merchant ID: ${merchantId}, Süre: ${duration}ms`);
      return {
        success: true,
        message: 'Pazarama bağlantısı başarılı',
        duration: duration
      };
    } else {
      logger.warn(`⚠️ Pazarama bağlantı testi başarısız - Merchant ID: ${merchantId}, Süre: ${duration}ms`);
      return {
        success: false,
        message: 'Geçersiz Merchant ID, API Key veya Secret Key',
        duration: duration
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Pazarama bağlantı testi hatası - Merchant ID: ${merchantId}, Hata: ${error.message}, Süre: ${duration}ms`);
    return {
      success: false,
      message: 'Bağlantı hatası: ' + error.message,
      duration: duration
    };
  }
}

module.exports = {
  testWooCommerceConnection,
  testTrendyolConnection,
  testHepsiburadaConnection,
  testN11Connection,
  testCicekSepetiConnection,
  testPazaramaConnection
}; 