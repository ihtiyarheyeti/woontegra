const logger = require('../utils/logger');
const { Product, MarketplaceConnection, SyncLog } = require('../models');
const crypto = require('crypto');

// Şifreleme anahtarı
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!'.padEnd(32, '!');

/**
 * Base Marketplace Sync Class
 * Tüm pazaryerleri için ortak senkronizasyon altyapısı
 */
class BaseMarketplaceSync {
  constructor(marketplaceName) {
    this.marketplaceName = marketplaceName;
    this.rateLimitDelay = 1000; // 1 saniye
    this.maxRetries = 3;
  }

  /**
   * API anahtarlarını çöz
   */
  decryptApiKey(encryptedText) {
    try {
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift(), 'hex');
      const encryptedData = textParts.join(':');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error(`Error decrypting API key for ${this.marketplaceName}:`, error);
      throw new Error('Invalid API key format');
    }
  }

  /**
   * Kullanıcının pazaryeri bağlantısını bul
   */
  async getConnection(customerId) {
    const connection = await MarketplaceConnection.findOne({
      where: {
        customer_id: customerId,
        marketplace_name: this.marketplaceName,
        status: 'active'
      }
    });

    if (!connection) {
      throw new Error(`${this.marketplaceName} bağlantısı bulunamadı. Lütfen önce pazaryeri bağlantısı oluşturun.`);
    }

    return connection;
  }

  /**
   * Ürün verilerini standart formata çevir
   */
  standardizeProductData(rawProduct, customerId) {
    // Bu method her pazaryeri için override edilecek
    throw new Error('standardizeProductData method must be implemented');
  }

  /**
   * Mevcut ürünü kontrol et ve güncelle/oluştur
   */
  async upsertProduct(productData, customerId) {
    try {
      // Mevcut ürünü kontrol et (barcode veya seller_sku ile)
      let existingProduct = null;

      if (productData.barcode) {
        existingProduct = await Product.findOne({
          where: {
            user_id: customerId,
            barcode: productData.barcode
          }
        });
      }

      if (!existingProduct && productData.seller_sku) {
        existingProduct = await Product.findOne({
          where: {
            user_id: customerId,
            seller_sku: productData.seller_sku
          }
        });
      }

      if (existingProduct) {
        // Mevcut ürünü güncelle
        await existingProduct.update(productData);
        logger.info(`Product updated: ${productData.name} (ID: ${existingProduct.id})`);
        return { action: 'updated', product: existingProduct };
      } else {
        // Yeni ürün oluştur
        const newProduct = await Product.create(productData);
        logger.info(`Product imported: ${productData.name}`);
        return { action: 'imported', product: newProduct };
      }
    } catch (error) {
      logger.error(`Error upserting product: ${error.message}`, {
        product: productData.name,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Senkronizasyon logunu oluştur
   */
  async createSyncLog(customerId, status = 'pending', data = {}) {
    return await SyncLog.create({
      customer_id: customerId,
      operation_type: 'product_sync',
      platform: this.marketplaceName,
      direction: 'inbound',
      status,
      data: { message: `${this.marketplaceName} ürün senkronizasyonu başlatıldı`, ...data }
    });
  }

  /**
   * Senkronizasyon logunu güncelle
   */
  async updateSyncLog(syncLog, status, data = {}) {
    await syncLog.update({
      status,
      data: {
        message: `${this.marketplaceName} ürün senkronizasyonu ${status === 'success' ? 'tamamlandı' : 'başarısız'}`,
        ...data
      }
    });
  }

  /**
   * Ana senkronizasyon metodu
   */
  async syncProducts(customerId) {
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      total_processed: 0
    };

    logger.info(`${this.marketplaceName} product sync started for customer ${customerId}`);

    // Bağlantıyı kontrol et
    const connection = await this.getConnection(customerId);

    // Sync log başlat
    const syncLog = await this.createSyncLog(customerId);

    try {
      // API client'ı oluştur
      const apiClient = this.createAPIClient(connection);

      // Ürünleri çek ve işle
      await this.processProducts(apiClient, customerId, results);

      // Sync log'u güncelle
      await this.updateSyncLog(syncLog, 'success', { results });

      logger.info(`${this.marketplaceName} sync completed for customer ${customerId}`, results);

      return {
        success: true,
        message: `${this.marketplaceName} ürünleri başarıyla senkronize edildi`,
        data: {
          sync_log_id: syncLog.id,
          results,
          timestamp: new Date()
        }
      };

    } catch (error) {
      // Sync log'u hata ile güncelle
      await this.updateSyncLog(syncLog, 'error', {
        results,
        error: error.message
      });

      logger.error(`Error in ${this.marketplaceName} product sync:`, error);

      throw error;
    }
  }

  /**
   * API Client oluştur (her pazaryeri için override edilecek)
   */
  createAPIClient(connection) {
    throw new Error('createAPIClient method must be implemented');
  }

  /**
   * Ürünleri işle (her pazaryeri için override edilebilir)
   */
  async processProducts(apiClient, customerId, results) {
    throw new Error('processProducts method must be implemented');
  }

  /**
   * Senkronizasyon durumunu getir
   */
  async getSyncStatus(customerId) {
    const lastSync = await SyncLog.findOne({
      where: {
        customer_id: customerId,
        operation_type: 'product_sync',
        platform: this.marketplaceName,
        direction: 'inbound'
      },
      order: [['created_at', 'DESC']]
    });

    const productCount = await Product.count({
      where: {
        user_id: customerId,
        source_marketplace: this.marketplaceName
      }
    });

    const connection = await MarketplaceConnection.findOne({
      where: {
        customer_id: customerId,
        marketplace_name: this.marketplaceName,
        status: 'active'
      }
    });

    return {
      last_sync: lastSync,
      product_count: productCount,
      has_connection: !!connection
    };
  }

  /**
   * Ürünleri listele
   */
  async getProducts(customerId, options = {}) {
    const { page = 1, limit = 10, search, status } = options;
    const offset = (page - 1) * limit;
    
    const whereClause = {
      user_id: customerId,
      source_marketplace: this.marketplaceName
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

    return {
      products: products.rows,
      total: products.count,
      page: parseInt(page),
      totalPages: Math.ceil(products.count / limit)
    };
  }
}

module.exports = BaseMarketplaceSync; 
 