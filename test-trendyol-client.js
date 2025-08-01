const TrendyolAPIClient = require('./services/TrendyolAPIClient');
const logger = require('./utils/logger');

// Test kullanıcı verisi
const testUser = {
  trendyol_app_key: 'CVn4MItx2ORADdD5VLZI',
  trendyol_app_secret: 'btLhur2HrPmhKjXC0Fz9',
  trendyol_supplier_id: '113278',
  trendyol_seller_id: '12345',
  trendyol_token: null
};

const testTrendyolClient = async () => {
  try {
    logger.info('🧪 Testing Trendyol API Client...');
    
    // Client oluştur
    const client = new TrendyolAPIClient(testUser);
    
    // Kategorileri getir
    logger.info('📋 Fetching categories...');
    const categories = await client.getCategories();
    
    logger.info(`✅ Categories fetched successfully! Count: ${categories.length}`);
    
    // İlk 3 kategoriyi göster
    logger.info('📋 First 3 categories:');
    categories.slice(0, 3).forEach((cat, index) => {
      logger.info(`  ${index + 1}. ${cat.name} (ID: ${cat.id})`);
      if (cat.children && cat.children.length > 0) {
        logger.info(`     Subcategories: ${cat.children.length}`);
        cat.children.slice(0, 2).forEach((subCat, subIndex) => {
          logger.info(`       ${subIndex + 1}. ${subCat.name} (ID: ${subCat.id})`);
        });
      }
    });
    
    // Bağlantı testi
    logger.info('🔗 Testing connection...');
    const connectionTest = await client.testConnection();
    
    if (connectionTest.success) {
      logger.info(`✅ Connection test successful! Duration: ${connectionTest.duration}ms`);
    } else {
      logger.warn(`⚠️ Connection test failed: ${connectionTest.message}`);
    }
    
    return {
      success: true,
      categories: categories.length,
      connection: connectionTest
    };
    
  } catch (error) {
    logger.error('❌ Trendyol Client Test Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test'i çalıştır
testTrendyolClient()
  .then(result => {
    if (result.success) {
      logger.info('🎯 Trendyol Client test completed successfully!');
      logger.info(`📊 Results: ${result.categories} categories, Connection: ${result.connection.success ? 'OK' : 'Failed'}`);
    } else {
      logger.error('💥 Trendyol Client test failed!');
      logger.error(`Error: ${result.error}`);
    }
  })
  .catch(error => {
    logger.error('💥 Unexpected error:', error.message);
    process.exit(1);
  }); 