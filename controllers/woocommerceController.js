const WooCommerceAPIClient = require('../services/WooCommerceAPIClient');
const mockDataController = require('./mockDataController');
const logger = require('../utils/logger');

/**
 * Get WooCommerce products
 * GET /api/woocommerce/products
 */
const getProducts = async (req, res) => {
  const startTime = Date.now();
  const customer_id = req.user.id;
  
  logger.info(`🔄 WooCommerce ürünleri getiriliyor - Customer ID: ${customer_id}`);
  
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findByPk(customer_id);
    
    if (!customer || !customer.woo_store_url || !customer.woo_consumer_key || !customer.woo_consumer_secret) {
      logger.warn(`⚠️ WooCommerce bağlantı bilgileri eksik - Customer ID: ${customer_id}`);
      return res.status(400).json({
        success: false,
        message: 'WooCommerce bağlantı bilgileri eksik'
      });
    }

    const apiClient = new WooCommerceAPIClient(
      customer.woo_consumer_key,
      customer.woo_consumer_secret,
      customer.woo_store_url
    );
    
    logger.info(`📦 WooCommerce'dan ürünler çekiliyor...`);
    const products = await apiClient.getProducts();

    const duration = Date.now() - startTime;
    logger.info(`✅ WooCommerce ürünleri başarıyla getirildi - Customer ID: ${customer_id}, Ürün Sayısı: ${products.length}, Süre: ${duration}ms`);

    res.json({
      success: true,
      message: 'WooCommerce ürünleri başarıyla getirildi',
      data: products,
      duration: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ WooCommerce ürünleri alınırken hata - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'WooCommerce ürünleri alınırken bir hata oluştu',
      error: error.message,
      duration: duration
    });
  }
};

/**
 * Get WooCommerce product by ID
 * GET /api/woocommerce/products/:id
 */
const getProductById = async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const customer_id = req.user.id;
  
  logger.info(`🔄 WooCommerce ürün detayı getiriliyor - Product ID: ${id}, Customer ID: ${customer_id}`);
  
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findByPk(customer_id);
    
    if (!customer || !customer.woo_store_url || !customer.woo_consumer_key || !customer.woo_consumer_secret) {
      logger.warn(`⚠️ WooCommerce bağlantı bilgileri eksik - Customer ID: ${customer_id}`);
      return res.status(400).json({
        success: false,
        message: 'WooCommerce bağlantı bilgileri eksik'
      });
    }

    const apiClient = new WooCommerceAPIClient(
      customer.woo_consumer_key,
      customer.woo_consumer_secret,
      customer.woo_store_url
    );
    
    logger.info(`📦 WooCommerce'dan ürün detayı çekiliyor - Product ID: ${id}`);
    const product = await apiClient.getProduct(id);

    const duration = Date.now() - startTime;
    logger.info(`✅ WooCommerce ürün detayı başarıyla getirildi - Product ID: ${id}, Customer ID: ${customer_id}, Süre: ${duration}ms`);

    res.json({
      success: true,
      message: 'WooCommerce ürünü başarıyla getirildi',
      data: product,
      duration: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ WooCommerce ürün detayı alınırken hata - Product ID: ${id}, Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'WooCommerce ürünü alınırken bir hata oluştu',
      error: error.message,
      duration: duration
    });
  }
};

/**
 * Sync WooCommerce products to local database
 * POST /api/woocommerce/sync
 */
const syncProducts = async (req, res) => {
  const startTime = Date.now();
  const customer_id = req.user.id;
  const tenant_id = req.user.tenant_id;
  
  logger.info(`🔄 WooCommerce senkronizasyonu başlatılıyor - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);
  
  try {
    const Customer = require('../models/Customer');
    const Product = require('../models/Product');
    const customer = await Customer.findByPk(customer_id);
    
    if (!customer || !customer.woo_store_url || !customer.woo_consumer_key || !customer.woo_consumer_secret) {
      logger.warn(`⚠️ WooCommerce bağlantı bilgileri eksik - Customer ID: ${customer_id}`);
      return res.status(400).json({
        success: false,
        message: 'WooCommerce bağlantı bilgileri eksik'
      });
    }

    const apiClient = new WooCommerceAPIClient(
      customer.woo_consumer_key,
      customer.woo_consumer_secret,
      customer.woo_store_url
    );

    // WooCommerce'dan tüm ürünleri al
    logger.info(`📦 WooCommerce'dan ürünler çekiliyor...`);
    const wooProducts = await apiClient.getProducts(1, 100, 'publish');
    
    let syncedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    logger.info(`🔄 ${wooProducts.length} ürün için senkronizasyon başlatılıyor...`);

    // Her ürün için yerel veritabanını güncelle
    for (const wooProduct of wooProducts) {
      try {
        const existingProduct = await Product.findOne({
          where: {
            external_id: wooProduct.id.toString(),
            customer_id: customer_id,
            source_marketplace: 'woocommerce'
          }
        });

        const productData = {
          tenant_id: tenant_id,
          customer_id: customer_id,
          external_id: wooProduct.id.toString(),
          name: wooProduct.name,
          description: wooProduct.description,
          price: parseFloat(wooProduct.price),
          stock: wooProduct.stock_quantity || 0,
          status: wooProduct.status === 'publish' ? 'active' : 'inactive',
          source_marketplace: 'woocommerce',
          images: wooProduct.images ? wooProduct.images.map(img => img.src) : [],
          seller_sku: wooProduct.sku || null
        };

        if (existingProduct) {
          await existingProduct.update(productData);
          updatedCount++;
          logger.debug(`🔄 Ürün güncellendi - Product ID: ${wooProduct.id}, Name: ${wooProduct.name}`);
        } else {
          await Product.create(productData);
          syncedCount++;
          logger.debug(`✅ Yeni ürün eklendi - Product ID: ${wooProduct.id}, Name: ${wooProduct.name}`);
        }
      } catch (productError) {
        errorCount++;
        logger.error(`❌ Ürün senkronizasyon hatası - Product ID: ${wooProduct.id}, Hata: ${productError.message}`);
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`✅ WooCommerce senkronizasyonu tamamlandı - Customer ID: ${customer_id}, Yeni: ${syncedCount}, Güncellenen: ${updatedCount}, Hata: ${errorCount}, Süre: ${duration}ms`);

    res.json({
      success: true,
      message: 'WooCommerce ürünleri başarıyla senkronize edildi',
      data: {
        total: wooProducts.length,
        synced: syncedCount,
        updated: updatedCount,
        errors: errorCount,
        duration: duration
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ WooCommerce senkronizasyonu sırasında hata - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'WooCommerce senkronizasyonu sırasında bir hata oluştu',
      error: error.message,
      duration: duration
    });
  }
};

/**
 * Get WooCommerce product attributes
 * GET /api/woocommerce/product-attributes
 */
const getProductAttributes = async (req, res) => {
  // Mock data kullan
  return await mockDataController.getProductAttributes(req, res);
};

/**
 * Test WooCommerce connection
 * GET /api/woocommerce/test-connection
 */
const testConnection = async (req, res) => {
  const startTime = Date.now();
  const customer_id = req.user.id;
  
  logger.info(`🔄 WooCommerce bağlantı testi başlatılıyor - Customer ID: ${customer_id}`);
  
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findByPk(customer_id);
    
    if (!customer || !customer.woo_store_url || !customer.woo_consumer_key || !customer.woo_consumer_secret) {
      logger.warn(`⚠️ WooCommerce bağlantı bilgileri eksik - Customer ID: ${customer_id}`);
      return res.status(400).json({
        success: false,
        message: 'WooCommerce bağlantı bilgileri eksik'
      });
    }

    const apiClient = new WooCommerceAPIClient(
      customer.woo_consumer_key,
      customer.woo_consumer_secret,
      customer.woo_store_url
    );

    logger.info(`🔗 WooCommerce API bağlantısı test ediliyor - Store URL: ${customer.woo_store_url}`);
    const result = await apiClient.testConnection();

    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info(`✅ WooCommerce bağlantı testi başarılı - Customer ID: ${customer_id}, Süre: ${duration}ms`);
    } else {
      logger.warn(`⚠️ WooCommerce bağlantı testi başarısız - Customer ID: ${customer_id}, Hata: ${result.error}, Süre: ${duration}ms`);
    }

    res.json({
      success: result.success,
      message: result.message,
      error: result.error,
      duration: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ WooCommerce bağlantı testi sırasında hata - Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'WooCommerce bağlantı testi sırasında bir hata oluştu',
      error: error.message,
      duration: duration
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  syncProducts,
  testConnection,
  getProductAttributes
}; 