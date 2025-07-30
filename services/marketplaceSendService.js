const logger = require('../utils/logger');

/**
 * Send product to Trendyol
 */
async function sendToTrendyol(product) {
  const startTime = Date.now();
  logger.info(`🟠 Trendyol'a gönderiliyor - Product: ${product.name} (ID: ${product.id})`);
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate success/failure (80% success rate)
    const isSuccess = Math.random() > 0.2;
    
    const duration = Date.now() - startTime;
    
    if (isSuccess) {
      logger.info(`✅ Trendyol'a başarıyla gönderildi - Product: ${product.name}, Süre: ${duration}ms`);
      return { success: true, marketplace: 'Trendyol', duration };
    } else {
      logger.warn(`⚠️ Trendyol'a gönderilemedi - Product: ${product.name}, Süre: ${duration}ms`);
      throw new Error('Trendyol API hatası');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Trendyol'a gönderme hatası - Product: ${product.name}, Hata: ${error.message}, Süre: ${duration}ms`);
    throw error;
  }
}

/**
 * Send product to Hepsiburada
 */
async function sendToHepsiburada(product) {
  const startTime = Date.now();
  logger.info(`🟡 Hepsiburada'ya gönderiliyor - Product: ${product.name} (ID: ${product.id})`);
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
    
    // Simulate success/failure (85% success rate)
    const isSuccess = Math.random() > 0.15;
    
    const duration = Date.now() - startTime;
    
    if (isSuccess) {
      logger.info(`✅ Hepsiburada'ya başarıyla gönderildi - Product: ${product.name}, Süre: ${duration}ms`);
      return { success: true, marketplace: 'Hepsiburada', duration };
    } else {
      logger.warn(`⚠️ Hepsiburada'ya gönderilemedi - Product: ${product.name}, Süre: ${duration}ms`);
      throw new Error('Hepsiburada API hatası');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Hepsiburada'ya gönderme hatası - Product: ${product.name}, Hata: ${error.message}, Süre: ${duration}ms`);
    throw error;
  }
}

/**
 * Send product to N11
 */
async function sendToN11(product) {
  const startTime = Date.now();
  logger.info(`🔵 N11'e gönderiliyor - Product: ${product.name} (ID: ${product.id})`);
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));
    
    // Simulate success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    const duration = Date.now() - startTime;
    
    if (isSuccess) {
      logger.info(`✅ N11'e başarıyla gönderildi - Product: ${product.name}, Süre: ${duration}ms`);
      return { success: true, marketplace: 'N11', duration };
    } else {
      logger.warn(`⚠️ N11'e gönderilemedi - Product: ${product.name}, Süre: ${duration}ms`);
      throw new Error('N11 API hatası');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ N11'e gönderme hatası - Product: ${product.name}, Hata: ${error.message}, Süre: ${duration}ms`);
    throw error;
  }
}

/**
 * Send product to ÇiçekSepeti
 */
async function sendToCicekSepeti(product) {
  const startTime = Date.now();
  logger.info(`🌸 ÇiçekSepeti'ne gönderiliyor - Product: ${product.name} (ID: ${product.id})`);
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 1600));
    
    // Simulate success/failure (75% success rate)
    const isSuccess = Math.random() > 0.25;
    
    const duration = Date.now() - startTime;
    
    if (isSuccess) {
      logger.info(`✅ ÇiçekSepeti'ne başarıyla gönderildi - Product: ${product.name}, Süre: ${duration}ms`);
      return { success: true, marketplace: 'ÇiçekSepeti', duration };
    } else {
      logger.warn(`⚠️ ÇiçekSepeti'ne gönderilemedi - Product: ${product.name}, Süre: ${duration}ms`);
      throw new Error('ÇiçekSepeti API hatası');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ ÇiçekSepeti'ne gönderme hatası - Product: ${product.name}, Hata: ${error.message}, Süre: ${duration}ms`);
    throw error;
  }
}

// Marketplace functions mapping
const marketplaceFunctions = {
  'trendyol': sendToTrendyol,
  'hepsiburada': sendToHepsiburada,
  'n11': sendToN11,
  'ciceksepeti': sendToCicekSepeti
};

/**
 * Send product to multiple marketplaces
 */
async function sendToMarketplaces(product, marketplaces) {
  const startTime = Date.now();
  logger.info(`🚀 Çoklu pazaryeri gönderimi başlatılıyor - Product: ${product.name}, Marketplaces: ${marketplaces.join(', ')}`);
  
  const results = [];
  const success = [];
  const failed = [];
  
  // Send to each marketplace concurrently
  const promises = marketplaces.map(async (marketplace) => {
    const marketplaceFunction = marketplaceFunctions[marketplace];
    
    if (!marketplaceFunction) {
      logger.warn(`⚠️ Bilinmeyen marketplace: ${marketplace}`);
      failed.push(marketplace);
      return;
    }
    
    try {
      const result = await marketplaceFunction(product);
      if (result.success) {
        success.push(result.marketplace);
      }
    } catch (error) {
      logger.error(`❌ ${marketplace} gönderimi başarısız - Product: ${product.name}, Hata: ${error.message}`);
      failed.push(marketplace);
    }
  });
  
  await Promise.all(promises);
  
  const totalDuration = Date.now() - startTime;
  logger.info(`🏁 Çoklu pazaryeri gönderimi tamamlandı - Product: ${product.name}, Başarılı: ${success.length}, Başarısız: ${failed.length}, Toplam Süre: ${totalDuration}ms`);
  
  return {
    success,
    failed,
    totalDuration
  };
}

module.exports = {
  sendToMarketplaces,
  sendToTrendyol,
  sendToHepsiburada,
  sendToN11,
  sendToCicekSepeti
}; 