const axios = require('axios');
const logger = require('../utils/logger');

/**
 * WooCommerce API Client
 * WooCommerce REST API ile iletişim kurar
 */
class WooCommerceAPIClient {
  constructor(user) {
    // User objesi verilmişse ondan al, yoksa eski parametreleri kullan
    if (user && typeof user === 'object') {
      this.consumerKey = user.woo_consumer_key;
      this.consumerSecret = user.woo_consumer_secret;
      this.storeUrl = this.validateAndFormatStoreUrl(user.woo_store_url);
    } else {
      // Eski constructor uyumluluğu için
      const [consumerKey, consumerSecret, storeUrl] = arguments;
      this.consumerKey = consumerKey;
      this.consumerSecret = consumerSecret;
      this.storeUrl = this.validateAndFormatStoreUrl(storeUrl);
    }
    
    this.rateLimitDelay = 1000; // 1 saniye
    this.maxRetries = 3;
  }

  /**
   * Store URL'ini doğrula ve formatla
   */
  validateAndFormatStoreUrl(url) {
    if (!url) {
      logger.warn('⚠️ WooCommerce store URL is empty');
      return '';
    }

    let formattedUrl = url.trim();
    
    // URL'de protokol yoksa https ekle
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
      logger.info(`🔧 Added https:// to store URL: ${formattedUrl}`);
    }
    
    // Sondaki slash'i kaldır
    formattedUrl = formattedUrl.replace(/\/$/, '');
    
    // URL formatını kontrol et
    try {
      new URL(formattedUrl);
      logger.info(`✅ Valid WooCommerce store URL: ${formattedUrl}`);
      return formattedUrl;
    } catch (error) {
      logger.error(`❌ Invalid WooCommerce store URL: ${formattedUrl}`);
      return '';
    }
  }

  /**
   * API isteği yap (rate limit ve retry ile)
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    // Store URL kontrolü
    if (!this.storeUrl) {
      throw new Error('Invalid URL: WooCommerce store URL is not configured');
    }

    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        const fullUrl = `${this.storeUrl}/wp-json/wc/v3${endpoint}`;
        
        logger.info(`🔗 WooCommerce API Client oluşturuluyor - Store URL: ${this.storeUrl}`);
        logger.info(`📦 WooCommerce'dan ürün sayısı alınıyor...`);
        
        const config = {
          method,
          url: fullUrl,
          auth: {
            username: this.consumerKey,
            password: this.consumerSecret
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Woontegra-Integration/1.0',
            'Accept': 'application/json'
          },
          timeout: 30000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        };

        if (data) {
          config.data = data;
        }

        const response = await axios(config);

        if (response.status === 200 || response.status === 201) {
          // Rate limit için bekle
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
          return response.data;
        } else {
          logger.warn(`⚠️ WooCommerce API Response: ${response.status} - ${response.statusText}`);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        retries++;
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          logger.error(`Error fetching products from WooCommerce: ${error.message}`);
          logger.warn(`⚠️ WooCommerce ürün sayısı alınamadı:`);
          logger.warn(`⚠️ WooCommerce bağlantı bilgileri:`);
          throw new Error('Invalid URL');
        }

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
   * WooCommerce'dan ürünleri çek
   */
  async getProducts(page = 1, perPage = 100, status = 'publish') {
    try {
      const endpoint = `/products?page=${page}&per_page=${perPage}&status=${status}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      logger.error('Error fetching products from WooCommerce:', error);
      
      // Test için mock data döndür
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        logger.info('Using mock WooCommerce data for testing');
        return this.getMockProducts();
      }
      
      throw error;
    }
  }

  /**
   * Belirli bir ürünü getir
   */
  async getProduct(productId) {
    try {
      return await this.makeRequest(`/products/${productId}`);
    } catch (error) {
      logger.error(`Error fetching product ${productId} from WooCommerce:`, error);
      throw error;
    }
  }

  /**
   * Ürün stokunu güncelle
   */
  async updateStock(productId, stockQuantity) {
    try {
      const data = {
        stock_quantity: stockQuantity,
        manage_stock: true
      };
      return await this.makeRequest(`/products/${productId}`, 'PUT', data);
    } catch (error) {
      logger.error(`Error updating stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Ürün fiyatını güncelle
   */
  async updatePrice(productId, regularPrice, salePrice = null) {
    try {
      const data = {
        regular_price: regularPrice.toString()
      };
      
      if (salePrice) {
        data.sale_price = salePrice.toString();
      }
      
      return await this.makeRequest(`/products/${productId}`, 'PUT', data);
    } catch (error) {
      logger.error(`Error updating price for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Kategorileri getir
   */
  async getCategories(page = 1, perPage = 100) {
    try {
      // WooCommerce bağlantı bilgilerini kontrol et
      if (!this.consumerKey || !this.consumerSecret || !this.storeUrl) {
        throw new Error('WooCommerce bağlantı bilgileri eksik');
      }

      // URL formatını kontrol et
      if (!this.storeUrl.startsWith('http')) {
        throw new Error('Geçersiz WooCommerce store URL');
      }

      const endpoint = `/products/categories?page=${page}&per_page=${perPage}&orderby=name&order=asc`;
      logger.info(`Fetching WooCommerce categories from: ${this.storeUrl}/wp-json/wc/v3${endpoint}`);
      
      const categories = await this.makeRequest(endpoint);
      
      // HTML response kontrolü
      if (typeof categories === 'string' && categories.includes('<!DOCTYPE html>')) {
        throw new Error('WooCommerce API HTML response - URL may be incorrect');
      }
      
      logger.info(`✅ WooCommerce categories fetched successfully. Count: ${categories.length}`);
      return categories;
    } catch (error) {
      logger.error('Error fetching categories from WooCommerce:', error);
      
      // Test için mock kategoriler döndür
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
          error.message.includes('Invalid URL') || error.message.includes('HTML response')) {
        logger.info('Using mock WooCommerce categories for testing');
        return this.getMockCategories();
      }
      
      throw error;
    }
  }

  /**
   * Siparişleri getir
   */
  async getOrders(page = 1, perPage = 50, status = 'processing') {
    try {
      const endpoint = `/orders?page=${page}&per_page=${perPage}&status=${status}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      logger.error('Error fetching orders from WooCommerce:', error);
      throw error;
    }
  }

  /**
   * Sipariş durumunu güncelle
   */
  async updateOrderStatus(orderId, status) {
    try {
      const data = { status };
      return await this.makeRequest(`/orders/${orderId}`, 'PUT', data);
    } catch (error) {
      logger.error(`Error updating order status for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Bağlantıyı test et
   */
  async testConnection() {
    try {
      await this.makeRequest('/products?per_page=1');
      return { success: true, message: 'WooCommerce bağlantısı başarılı' };
    } catch (error) {
      logger.error('WooCommerce connection test failed:', error);
      return { 
        success: false, 
        message: 'WooCommerce bağlantısı başarısız',
        error: error.message 
      };
    }
  }

  /**
   * Test için mock kategoriler
   */
  getMockCategories() {
    return [
      {
        id: 1,
        name: 'Elektronik',
        slug: 'elektronik',
        count: 45,
        description: 'Elektronik ürünler',
        parent: 0,
        image: null
      },
      {
        id: 2,
        name: 'Telefon',
        slug: 'telefon',
        count: 23,
        description: 'Telefon ve aksesuarları',
        parent: 1,
        image: null
      },
      {
        id: 3,
        name: 'Bilgisayar',
        slug: 'bilgisayar',
        count: 18,
        description: 'Bilgisayar ve bileşenleri',
        parent: 1,
        image: null
      },
      {
        id: 4,
        name: 'Moda',
        slug: 'moda',
        count: 67,
        description: 'Giyim ve aksesuarlar',
        parent: 0,
        image: null
      },
      {
        id: 5,
        name: 'Kadın Giyim',
        slug: 'kadin-giyim',
        count: 34,
        description: 'Kadın giyim ürünleri',
        parent: 4,
        image: null
      },
      {
        id: 6,
        name: 'Erkek Giyim',
        slug: 'erkek-giyim',
        count: 28,
        description: 'Erkek giyim ürünleri',
        parent: 4,
        image: null
      },
      {
        id: 7,
        name: 'Ev & Yaşam',
        slug: 'ev-yasam',
        count: 89,
        description: 'Ev ve yaşam ürünleri',
        parent: 0,
        image: null
      },
      {
        id: 8,
        name: 'Mobilya',
        slug: 'mobilya',
        count: 42,
        description: 'Mobilya ürünleri',
        parent: 7,
        image: null
      },
      {
        id: 9,
        name: 'Spor & Outdoor',
        slug: 'spor-outdoor',
        count: 56,
        description: 'Spor ve outdoor ürünleri',
        parent: 0,
        image: null
      },
      {
        id: 10,
        name: 'Kozmetik',
        slug: 'kozmetik',
        count: 78,
        description: 'Kozmetik ürünleri',
        parent: 0,
        image: null
      }
    ];
  }

  /**
   * Test için mock ürünler
   */
  getMockProducts() {
    return [
      {
        id: 4001,
        name: 'Microsoft Surface Laptop 5',
        description: 'Microsoft Surface Laptop 5 - Premium Windows laptop',
        price: '27999.99',
        regular_price: '27999.99',
        sale_price: '',
        stock_quantity: 20,
        stock_status: 'instock',
        sku: 'MSURFACELAPTOP5',
        images: [
          { src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop' },
          { src: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop' }
        ],
        status: 'publish',
        categories: [{ id: 1, name: 'Laptop', slug: 'laptop' }],
        date_created: '2024-01-15T10:30:00',
        date_modified: '2024-01-15T10:30:00'
      },
      {
        id: 4002,
        name: 'Bose QuietComfort 45',
        description: 'Bose QuietComfort 45 - Premium gürültü engelleme kulaklık',
        price: '8999.99',
        regular_price: '9999.99',
        sale_price: '8999.99',
        stock_quantity: 35,
        stock_status: 'instock',
        sku: 'BOSEQC45',
        images: [
          { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop' },
          { src: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=300&fit=crop' }
        ],
        status: 'publish',
        categories: [{ id: 2, name: 'Kulaklık', slug: 'kulaklik' }],
        date_created: '2024-01-14T15:45:00',
        date_modified: '2024-01-14T15:45:00'
      },
      {
        id: 4003,
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Samsung Galaxy S24 Ultra - En yeni Android flagship telefon',
        price: '44999.99',
        regular_price: '44999.99',
        sale_price: '',
        stock_quantity: 0,
        stock_status: 'outofstock',
        sku: 'SAMS24ULTRA',
        images: [
          { src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop' },
          { src: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop' }
        ],
        status: 'publish',
        categories: [{ id: 3, name: 'Telefon', slug: 'telefon' }],
        date_created: '2024-01-13T09:20:00',
        date_modified: '2024-01-13T09:20:00'
      },
      {
        id: 4004,
        name: 'Apple Watch Series 9',
        description: 'Apple Watch Series 9 - Akıllı saat',
        price: '15999.99',
        regular_price: '15999.99',
        sale_price: '',
        stock_quantity: 8,
        stock_status: 'instock',
        sku: 'APPLEWATCH9',
        images: [
          { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop' },
          { src: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=300&fit=crop' }
        ],
        status: 'publish',
        categories: [{ id: 4, name: 'Akıllı Saat', slug: 'akilli-saat' }],
        date_created: '2024-01-12T14:15:00',
        date_modified: '2024-01-12T14:15:00'
      }
    ];
  }
}

module.exports = WooCommerceAPIClient; 
 