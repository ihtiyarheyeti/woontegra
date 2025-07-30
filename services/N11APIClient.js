const axios = require('axios');
const logger = require('../utils/logger');

/**
 * N11 API Client
 * N11 API'si ile iletişim kurar
 */
class N11APIClient {
  constructor(apiKey, apiSecret, baseURL = 'https://api.n11.com/ws') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = baseURL;
    this.rateLimitDelay = 1000; // 1 saniye
    this.maxRetries = 3;
  }

  /**
   * API isteği yap (rate limit ve retry ile)
   */
  async makeRequest(endpoint, method = 'POST', data = null) {
    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        const config = {
          method,
          url: `${this.baseURL}${endpoint}`,
          headers: {
            'Content-Type': 'application/xml',
            'User-Agent': 'Pazaryeri-Integration/1.0'
          }
        };

        // N11 SOAP API için XML formatında veri gönder
        if (data) {
          config.data = this.buildSOAPRequest(data);
        }

        const response = await axios(config);

        // Rate limit için bekle
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

        return this.parseSOAPResponse(response.data);
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
   * SOAP request oluştur
   */
  buildSOAPRequest(data) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
   <soapenv:Header/>
   <soapenv:Body>
      <sch:${data.method}>
         <auth>
            <appKey>${this.apiKey}</appKey>
            <appSecret>${this.apiSecret}</appSecret>
         </auth>
         ${data.body || ''}
      </sch:${data.method}>
   </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * SOAP response parse et
   */
  parseSOAPResponse(xmlResponse) {
    // Basit XML parsing (production'da daha gelişmiş bir parser kullanılabilir)
    try {
      // Mock response için basit parsing
      return {
        success: true,
        data: xmlResponse
      };
    } catch (error) {
      logger.error('Error parsing N11 SOAP response:', error);
      throw new Error('Invalid SOAP response');
    }
  }

  /**
   * N11'den ürünleri çek
   */
  async getProducts(page = 0, size = 50) {
    // Test için mock data döndür
    logger.info('Using mock N11 data for testing');

    const mockProducts = [
      {
        id: 3001,
        title: 'Oppo Reno 8 Lite 128GB',
        description: 'Oppo Reno 8 Lite 128GB - Şık tasarım akıllı telefon',
        listPrice: 8999.99,
        quantity: 28,
        barcode: '1234567890140',
        stockCode: 'OPPORENO8LITE',
        approved: true,
        images: [
          { url: 'https://example.com/opporeno8lite_1.jpg' },
          { url: 'https://example.com/opporeno8lite_2.jpg' }
        ]
      },
      {
        id: 3002,
        title: 'Asus TUF Gaming A15',
        description: 'Asus TUF Gaming A15 - Dayanıklı oyun laptopu',
        listPrice: 32999.99,
        quantity: 12,
        barcode: '1234567890141',
        stockCode: 'ASUSTUFA15',
        approved: true,
        images: [
          { url: 'https://example.com/asustufa15_1.jpg' }
        ]
      },
      {
        id: 3003,
        title: 'Sony WH-1000XM4 Kulaklık',
        description: 'Sony WH-1000XM4 - Premium gürültü engelleme kulaklık',
        listPrice: 7999.99,
        quantity: 25,
        barcode: '1234567890142',
        stockCode: 'SONYWH1000XM4',
        approved: true,
        images: [
          { url: 'https://example.com/sonywh1000xm4_1.jpg' },
          { url: 'https://example.com/sonywh1000xm4_2.jpg' }
        ]
      },
      {
        id: 3004,
        title: 'GoPro Hero 11 Black',
        description: 'GoPro Hero 11 Black - Aksiyon kamerası',
        listPrice: 15999.99,
        quantity: 18,
        barcode: '1234567890143',
        stockCode: 'GOPROHERO11',
        approved: true,
        images: [
          { url: 'https://example.com/goprohero11_1.jpg' }
        ]
      },
      {
        id: 3005,
        title: 'Dell Inspiron 15 3000',
        description: 'Dell Inspiron 15 3000 - Giriş seviyesi laptop',
        listPrice: 18999.99,
        quantity: 22,
        barcode: '1234567890144',
        stockCode: 'DELLINSPIRON15',
        approved: true,
        images: [
          { url: 'https://example.com/dellinspiron15_1.jpg' },
          { url: 'https://example.com/dellinspiron15_2.jpg' }
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
      await this.makeRequest('/ProductService.php', 'POST', {
        method: 'GetProductList',
        body: '<pagingData><currentPage>0</currentPage><pageSize>1</pageSize></pagingData>'
      });
      return { success: true, message: 'N11 API bağlantısı başarılı' };
    } catch (error) {
      logger.error('N11 API connection test failed:', error);
      return { 
        success: false, 
        message: 'N11 API bağlantısı başarısız',
        error: error.message 
      };
    }
  }
}

module.exports = N11APIClient; 
 