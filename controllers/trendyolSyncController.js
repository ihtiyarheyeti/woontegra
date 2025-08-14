const Product = require('../models/Product');
const MarketplaceConnection = require('../models/MarketplaceConnection');
const SyncLog = require('../models/SyncLog');
const logger = require('../utils/logger');
const axios = require('axios');

/**
 * Trendyol API için rate limit ve retry mekanizması
 */
class TrendyolAPIClient {
  constructor(apiKey, apiSecret, baseURL = 'https://api.trendyol.com/sapigw/suppliers') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = baseURL;
    this.rateLimitDelay = 1000; // 1 saniye
    this.maxRetries = 3;
  }

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
}

/**
 * Trendyol'dan ürünleri senkronize et
 */
const syncProductsFromTrendyol = async (req, res) => {
  try {
    const customer_id = req.user.id;
    
    logger.info(`Trendyol product sync started for customer ${customer_id}`);

    // Kullanıcının Trendyol bağlantısını bul
    const connection = await MarketplaceConnection.findOne({
      where: {
        customer_id,
        marketplace_name: 'trendyol',
        status: 'active'
      }
    });

    if (!connection) {
      return res.status(400).json({
        success: false,
        message: 'Aktif Trendyol bağlantısı bulunamadı. Lütfen önce pazaryeri bağlantısı oluşturun.'
      });
    }

    // API anahtarlarını çöz
    const crypto = require('crypto');
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!'.padEnd(32, '!');
    
    const decryptApiKey = (encryptedText) => {
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift(), 'hex');
      const encryptedData = textParts.join(':');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    };

    const apiKey = decryptApiKey(connection.api_key);
    const apiSecret = decryptApiKey(connection.api_secret);

    // Trendyol API client'ını oluştur
    const trendyolClient = new TrendyolAPIClient(apiKey, apiSecret);

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      total_processed: 0
    };

    let page = 0;
    const size = 50;
    let hasMore = true;

    // Sync log başlat
    const syncLog = await SyncLog.create({
      customer_id,
      operation_type: 'product_sync',
      platform: 'trendyol',
      direction: 'inbound',
      status: 'pending',
      data: { message: 'Trendyol ürün senkronizasyonu başlatıldı' }
    });

    try {
      while (hasMore) {
        logger.info(`Fetching Trendyol products page ${page}`);
        
        // Trendyol API'den ürünleri çek
        const response = await trendyolClient.getProducts(page, size);
        
        if (!response.content || response.content.length === 0) {
          hasMore = false;
          break;
        }

        for (const trendyolProduct of response.content) {
          try {
            results.total_processed++;
            
            // Ürün verilerini hazırla
            const productData = {
              user_id: customer_id,
              external_id: trendyolProduct.id?.toString(),
              name: trendyolProduct.title || 'İsimsiz Ürün',
              description: trendyolProduct.description || '',
              price: parseFloat(trendyolProduct.listPrice || 0),
              stock: parseInt(trendyolProduct.quantity || 0),
              source_marketplace: 'trendyol',
              barcode: trendyolProduct.barcode || null,
              seller_sku: trendyolProduct.stockCode || null,
              images: trendyolProduct.images ? trendyolProduct.images.map(img => img.url) : [],
              status: trendyolProduct.approved ? 'active' : 'inactive'
            };

            // Mevcut ürünü kontrol et (barcode veya seller_sku ile)
            let existingProduct = null;
            
            if (productData.barcode) {
              existingProduct = await Product.findOne({
                where: {
                  user_id: customer_id,
                  barcode: productData.barcode
                }
              });
            }
            
            if (!existingProduct && productData.seller_sku) {
              existingProduct = await Product.findOne({
                where: {
                  user_id: customer_id,
                  seller_sku: productData.seller_sku
                }
              });
            }

            if (existingProduct) {
              // Mevcut ürünü güncelle
              await existingProduct.update(productData);
              results.updated++;
              logger.info(`Product updated: ${productData.name} (ID: ${existingProduct.id})`);
            } else {
              // Yeni ürün oluştur
              await Product.create(productData);
              results.imported++;
              logger.info(`Product imported: ${productData.name}`);
            }
          } catch (productError) {
            results.errors++;
            logger.error(`Error processing product: ${productError.message}`, {
              product: trendyolProduct.title,
              error: productError.message
            });
          }
        }

        page++;
        
        // Rate limit için kısa bekle
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Sync log'u güncelle
      await syncLog.update({
        status: 'success',
        data: {
          message: 'Trendyol ürün senkronizasyonu tamamlandı',
          results
        }
      });

      logger.info(`Trendyol sync completed for customer ${customer_id}`, results);

      res.json({
        success: true,
        message: 'Trendyol ürünleri başarıyla senkronize edildi',
        data: {
          sync_log_id: syncLog.id,
          results,
          timestamp: new Date()
        }
      });

    } catch (syncError) {
      // Sync log'u hata ile güncelle
      await syncLog.update({
        status: 'error',
        error_message: syncError.message,
        data: {
          message: 'Trendyol ürün senkronizasyonu başarısız',
          results,
          error: syncError.message
        }
      });

      throw syncError;
    }

  } catch (error) {
    logger.error('Error in Trendyol product sync:', error);
    
    res.status(500).json({
      success: false,
      message: 'Trendyol ürün senkronizasyonu başarısız',
      error: error.message
    });
  }
};

/**
 * Trendyol senkronizasyon durumunu kontrol et
 */
const getTrendyolSyncStatus = async (req, res) => {
  try {
    const customer_id = req.user.id;
    
    // Son senkronizasyon logunu getir
    const lastSync = await SyncLog.findOne({
      where: {
        customer_id,
        operation_type: 'product_sync',
        platform: 'trendyol',
        direction: 'inbound'
      },
      order: [['created_at', 'DESC']]
    });

    // Trendyol ürün sayısını getir
    const trendyolProductCount = await Product.count({
      where: {
        user_id: customer_id,
        source_marketplace: 'trendyol'
      }
    });

    res.json({
      success: true,
      data: {
        last_sync: lastSync,
        product_count: trendyolProductCount,
        has_connection: true // Bu değer daha sonra kontrol edilebilir
      }
    });

  } catch (error) {
    logger.error('Error getting Trendyol sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Senkronizasyon durumu alınamadı',
      error: error.message
    });
  }
};

/**
 * Trendyol ürünlerini listele
 */
const getTrendyolProducts = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { page = 1, limit = 10, search, status } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {
      user_id: customer_id,
      source_marketplace: 'trendyol'
    };
    
    if (search) {
      whereClause.name = {
        [require('sequelize').Op.like]: `%${search}%`
      };
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    const products = await Product.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        products: products.rows,
        total: products.count,
        page: parseInt(page),
        totalPages: Math.ceil(products.count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching Trendyol products:', error);
    res.status(500).json({
      success: false,
      message: 'Trendyol ürünleri getirilemedi',
      error: error.message
    });
  }
};

module.exports = {
  syncProductsFromTrendyol,
  getTrendyolSyncStatus,
  getTrendyolProducts
}; 
 