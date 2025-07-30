const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Hepsiburada API Client
 * Hepsiburada API'si ile iletişim kurar
 */
class HepsiburadaAPIClient {
  constructor(apiKey, apiSecret, baseURL = 'https://marketplace.hepsiburada.com/api/v1') {
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
            'Authorization': `Bearer ${this.apiKey}`,
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
   * Hepsiburada'dan ürünleri çek
   */
  async getProducts(page = 0, size = 50) {
    // Test için mock data döndür
    logger.info('Using mock Hepsiburada data for testing');

    const mockProducts = [
      {
        id: 2001,
        title: 'Samsung Galaxy A54 128GB',
        description: 'Samsung Galaxy A54 128GB - Orta segment akıllı telefon',
        listPrice: 15999.99,
        quantity: 35,
        barcode: '1234567890130',
        stockCode: 'SAMA54128',
        approved: true,
        images: [
          { url: 'https://example.com/sama54_1.jpg' },
          { url: 'https://example.com/sama54_2.jpg' }
        ]
      },
      {
        id: 2002,
        title: 'Xiaomi Redmi Note 12 Pro',
        description: 'Xiaomi Redmi Note 12 Pro - Uygun fiyatlı güçlü telefon',
        listPrice: 12999.99,
        quantity: 42,
        barcode: '1234567890131',
        stockCode: 'XIAOMI12PRO',
        approved: true,
        images: [
          { url: 'https://example.com/xiaomi12pro_1.jpg' }
        ]
      },
      {
        id: 2003,
        title: 'Lenovo IdeaPad Gaming 3',
        description: 'Lenovo IdeaPad Gaming 3 - Oyun laptopu',
        listPrice: 24999.99,
        quantity: 15,
        barcode: '1234567890132',
        stockCode: 'LENOVOGAMING3',
        approved: true,
        images: [
          { url: 'https://example.com/lenovogaming_1.jpg' },
          { url: 'https://example.com/lenovogaming_2.jpg' }
        ]
      },
      {
        id: 2004,
        title: 'JBL Flip 6 Bluetooth Hoparlör',
        description: 'JBL Flip 6 - Taşınabilir Bluetooth hoparlör',
        listPrice: 2999.99,
        quantity: 60,
        barcode: '1234567890133',
        stockCode: 'JBLFLIP6',
        approved: true,
        images: [
          { url: 'https://example.com/jblflip6_1.jpg' }
        ]
      },
      {
        id: 2005,
        title: 'Canon EOS R50 Mirrorless Kamera',
        description: 'Canon EOS R50 - Giriş seviyesi mirrorless kamera',
        listPrice: 18999.99,
        quantity: 8,
        barcode: '1234567890134',
        stockCode: 'CANONEOSR50',
        approved: true,
        images: [
          { url: 'https://example.com/canoneosr50_1.jpg' },
          { url: 'https://example.com/canoneosr50_2.jpg' }
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
      await this.makeRequest('/test');
      return { success: true, message: 'Hepsiburada API bağlantısı başarılı' };
    } catch (error) {
      logger.error('Hepsiburada API connection test failed:', error);
      return { 
        success: false, 
        message: 'Hepsiburada API bağlantısı başarısız',
        error: error.message 
      };
    }
  }
}

module.exports = HepsiburadaAPIClient; 
 