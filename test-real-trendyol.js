const axios = require('axios');
const logger = require('./utils/logger');

const testRealTrendyol = async () => {
  try {
    logger.info('🔍 Testing Real Trendyol API...');
    
    // Gerçek API bilgileri
    const appKey = 'CVn4MItx2ORADdD5VLZI';
    const appSecret = 'btLhur2HrPmhKjXC0Fz9';
    const supplierId = '113278';
    
    // Base64 encoding
    const base64 = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
    
    logger.info(`📋 API Info:`);
    logger.info(`  App Key: ${appKey}`);
    logger.info(`  App Secret: ${appSecret}`);
    logger.info(`  Supplier ID: ${supplierId}`);
    logger.info(`  Base64: ${base64}`);
    
    // Farklı endpoint'leri dene
    const endpoints = [
      `/suppliers/${supplierId}/categories`,
      '/product-categories',
      '/categories'
    ];
    
    const headers = {
      'Authorization': `Basic ${base64}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    
    for (const endpoint of endpoints) {
      try {
        const url = `https://api.trendyol.com/sapigw${endpoint}`;
        logger.info(`🌐 Trying endpoint: ${url}`);
        
        const response = await axios.get(url, {
          headers,
          timeout: 30000,
          maxRedirects: 5,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        });
        
        if (response.status === 200) {
          logger.info(`✅ API Response Status: ${response.status}`);
          logger.info(`📊 Response Data Type: ${typeof response.data}`);
          
          if (Array.isArray(response.data)) {
            logger.info(`✅ Categories fetched successfully! Count: ${response.data.length}`);
            logger.info(`📋 First 3 categories:`);
            response.data.slice(0, 3).forEach((cat, index) => {
              logger.info(`  ${index + 1}. ${cat.name} (ID: ${cat.id})`);
            });
          } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
            logger.info(`✅ Categories fetched successfully! Count: ${response.data.content.length}`);
            logger.info(`📋 First 3 categories:`);
            response.data.content.slice(0, 3).forEach((cat, index) => {
              logger.info(`  ${index + 1}. ${cat.name} (ID: ${cat.id})`);
            });
          } else {
            logger.warn(`⚠️ Unexpected response format from ${endpoint}:`, response.data);
            continue;
          }
          
          return response.data;
        } else {
          logger.warn(`⚠️ Endpoint ${endpoint} returned status: ${response.status}`);
          continue;
        }
      } catch (error) {
        logger.error(`❌ Endpoint ${endpoint} failed:`);
        logger.error(`  Status: ${error.response?.status}`);
        logger.error(`  Message: ${error.message}`);
        
        if (error.response?.status === 403) {
          logger.warn('403 Forbidden - Cloudflare protection detected');
        }
        
        continue;
      }
    }
    
    throw new Error('All Trendyol endpoints failed');
    
  } catch (error) {
    logger.error('❌ Trendyol API Error:');
    logger.error(`  Status: ${error.response?.status}`);
    logger.error(`  Message: ${error.message}`);
    if (error.response?.data) {
      logger.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
};

// Test'i çalıştır
testRealTrendyol()
  .then(data => {
    logger.info('🎯 Real Trendyol API test completed successfully!');
  })
  .catch(error => {
    logger.error('💥 Real Trendyol API test failed!');
    process.exit(1);
  }); 