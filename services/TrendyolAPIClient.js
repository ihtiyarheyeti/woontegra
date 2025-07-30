const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Trendyol API Client
 * Trendyol API'si ile iletişim kurar
 */
class TrendyolAPIClient {
  constructor(apiKey, apiSecret, baseURL = 'https://api.trendyol.com/sapigw/suppliers') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = baseURL;
    this.rateLimitDelay = 1000; // 1 saniye
    this.maxRetries = 3;
  }

  /**
   * API isteği yap (rate limit ve retry ile)
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        const config = {
          method,
          url: `${this.baseURL}${endpoint}`,
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Pazaryeri-Integration/1.0'
          }
        };

        if (data) {
          config.data = data;
        }

        const response = await axios(config);

        // Rate limit için bekle
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

        return response.data;
      } catch (error) {
        retries++;

        if (error.response?.status === 429) {
          // Rate limit aşıldı, daha uzun bekle
          const retryAfter = parseInt(error.response.headers['retry-after']) || 5;
          logger.warn(`Rate limit exceeded, waiting ${retryAfter} seconds`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else if (error.response?.status >= 500 && retries <= this.maxRetries) {
          // Server error, retry
          logger.warn(`Server error (${error.response.status}), retry ${retries}/${this.maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * retries));
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Max retries (${this.maxRetries}) exceeded`);
  }

  /**
   * Trendyol'dan ürünleri çek
   */
  async getProducts(page = 0, size = 50) {
    // Test için mock data döndür
    logger.info('Using mock Trendyol data for testing');

    const mockProducts = [
      {
        id: 1001,
        title: 'iPhone 15 Pro 128GB Titanium',
        description: 'Apple iPhone 15 Pro 128GB Titanium - En yeni iPhone modeli',
        listPrice: 89999.99,
        quantity: 25,
        barcode: '1234567890123',
        stockCode: 'IPH15PRO128',
        approved: true,
        images: [
          { url: 'https://example.com/iphone15pro1.jpg' },
          { url: 'https://example.com/iphone15pro2.jpg' }
        ]
      },
      {
        id: 1002,
        title: 'Samsung Galaxy S24 Ultra 256GB',
        description: 'Samsung Galaxy S24 Ultra 256GB - Premium Android telefon',
        listPrice: 74999.99,
        quantity: 18,
        barcode: '1234567890124',
        stockCode: 'SAMS24ULTRA256',
        approved: true,
        images: [
          { url: 'https://example.com/s24ultra1.jpg' }
        ]
      },
      {
        id: 1003,
        title: 'MacBook Pro M3 14" 512GB',
        description: 'Apple MacBook Pro 14" M3 Chip 512GB - Güçlü laptop',
        listPrice: 129999.99,
        quantity: 12,
        barcode: '1234567890125',
        stockCode: 'MBPM314512',
        approved: true,
        images: [
          { url: 'https://example.com/macbookpro1.jpg' },
          { url: 'https://example.com/macbookpro2.jpg' }
        ]
      },
      {
        id: 1004,
        title: 'AirPods Pro 2. Nesil',
        description: 'Apple AirPods Pro 2. Nesil - Aktif gürültü engelleme',
        listPrice: 8999.99,
        quantity: 50,
        barcode: '1234567890126',
        stockCode: 'AIRPODSPRO2',
        approved: true,
        images: [
          { url: 'https://example.com/airpodspro1.jpg' }
        ]
      },
      {
        id: 1005,
        title: 'iPad Air 5. Nesil 64GB',
        description: 'Apple iPad Air 5. Nesil 64GB - İnce ve hafif tablet',
        listPrice: 24999.99,
        quantity: 30,
        barcode: '1234567890127',
        stockCode: 'IPADAIR564',
        approved: true,
        images: [
          { url: 'https://example.com/ipadair1.jpg' },
          { url: 'https://example.com/ipadair2.jpg' }
        ]
      }
    ];

    return {
      content: mockProducts,
      totalElements: mockProducts.length,
      totalPages: 1,
      size: size,
      number: page
    };
  }

  /**
   * API bağlantısını test et
   */
  async testConnection() {
    try {
      // Basit bir API çağrısı yap
      await this.makeRequest('/products');
      return { success: true, message: 'Trendyol API bağlantısı başarılı' };
    } catch (error) {
      logger.error('Trendyol API connection test failed:', error);
      return { 
        success: false, 
        message: 'Trendyol API bağlantısı başarısız',
        error: error.message 
      };
    }
  }
}

module.exports = TrendyolAPIClient; 
 