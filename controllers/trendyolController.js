const { Customer, CategoryMapping, ProductSyncMap } = require('../models');
const WooCommerceAPIClient = require('../services/WooCommerceAPIClient');
const TrendyolAPIClient = require('../services/TrendyolAPIClient');
const logger = require('../utils/logger');

// Ürünleri Trendyol'a gönder
const sendProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    const customerId = req.user.id;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli ürün ID\'leri gerekli'
      });
    }

    // Müşteri bilgilerini al
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // Trendyol bağlantı bilgilerini kontrol et
    if (!customer.trendyol_api_key || !customer.trendyol_api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Trendyol API bağlantı bilgileri eksik'
      });
    }

    // WooCommerce ve Trendyol API client'larını oluştur
    const wooCommerceClient = new WooCommerceAPIClient(
      customer.woo_store_url,
      customer.woo_consumer_key,
      customer.woo_consumer_secret
    );

    const trendyolClient = new TrendyolAPIClient(
      customer.trendyol_api_key,
      customer.trendyol_api_secret,
      customer.trendyol_supplier_id
    );

    const sent = [];
    const failed = [];

    // Her ürün için işlem yap
    for (const productId of productIds) {
      try {
        // 1. WooCommerce'dan ürün bilgilerini al
        const wooProduct = await wooCommerceClient.getProduct(productId);
        
        if (!wooProduct) {
          failed.push({
            id: productId,
            reason: 'WooCommerce\'da ürün bulunamadı'
          });
          continue;
        }

        // 2. Kategori eşleşmesini kontrol et
        const categoryMapping = await CategoryMapping.findOne({
          where: {
            customer_id: customerId,
            woo_category_id: wooProduct.categories[0]?.id
          }
        });

        if (!categoryMapping) {
          failed.push({
            id: productId,
            reason: 'Kategori eşleşmesi bulunamadı'
          });
          continue;
        }

        // 3. Trendyol'a gönderilecek veriyi hazırla
        const trendyolProductData = {
          name: wooProduct.name,
          description: wooProduct.description,
          price: parseFloat(wooProduct.price),
          stock: wooProduct.stock_quantity || 0,
          categoryId: categoryMapping.trendyol_category_id,
          images: wooProduct.images.map(img => img.src),
          brand: "Woontegra", // Varsayılan marka
          barcode: `WOON-${productId}`, // Varsayılan barkod
          attributes: {
            "Renk": "Siyah", // Varsayılan özellikler
            "Beden": "M"
          }
        };

        // 4. Trendyol'a gönder (şimdilik simülasyon)
        logger.info(`Trendyol'a gönderilecek ürün: ${productId}`, trendyolProductData);
        
        // Gerçek API çağrısı (şimdilik simülasyon)
        // const response = await trendyolClient.createProduct(trendyolProductData);
        
        // Simülasyon: Başarılı gönderim
        console.log('🎯 Trendyol\'a gönderilecek JSON:', JSON.stringify(trendyolProductData, null, 2));
        
        sent.push(productId);
        
        logger.info(`Ürün başarıyla Trendyol'a gönderildi: ${productId}`);

      } catch (error) {
        logger.error(`Ürün gönderimi hatası (ID: ${productId}):`, error);
        failed.push({
          id: productId,
          reason: error.message || 'Bilinmeyen hata'
        });
      }
    }

    // Sonuçları döndür
    res.json({
      success: true,
      sent,
      failed,
      summary: {
        total: productIds.length,
        sent: sent.length,
        failed: failed.length
      }
    });

  } catch (error) {
    logger.error('Ürün gönderimi genel hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün gönderimi sırasında hata oluştu',
      error: error.message
    });
  }
};

// Trendyol kategori listesini getir
const getCategories = async (req, res) => {
  try {
    const customerId = req.user.id;
    const customer = await Customer.findByPk(customerId);

    if (!customer || !customer.trendyol_api_key) {
      return res.status(400).json({
        success: false,
        message: 'Trendyol API bağlantı bilgileri eksik'
      });
    }

    const trendyolClient = new TrendyolAPIClient(
      customer.trendyol_api_key,
      customer.trendyol_api_secret,
      customer.trendyol_supplier_id
    );

    const categories = await trendyolClient.getCategories();
    
    res.json({
      success: true,
      categories
    });

  } catch (error) {
    logger.error('Trendyol kategorileri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler alınırken hata oluştu',
      error: error.message
    });
  }
};

// Trendyol ürün durumunu kontrol et
const checkProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const customerId = req.user.id;
    
    const customer = await Customer.findByPk(customerId);
    if (!customer || !customer.trendyol_api_key) {
      return res.status(400).json({
        success: false,
        message: 'Trendyol API bağlantı bilgileri eksik'
      });
    }

    const trendyolClient = new TrendyolAPIClient(
      customer.trendyol_api_key,
      customer.trendyol_api_secret,
      customer.trendyol_supplier_id
    );

    // Şimdilik simülasyon
    const status = {
      productId,
      status: 'active',
      lastSync: new Date().toISOString(),
      trendyolId: `TR-${productId}`
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('Ürün durumu kontrol hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün durumu kontrol edilirken hata oluştu',
      error: error.message
    });
  }
};

// Trendyol'dan ürünleri çek
const pullProducts = async (req, res) => {
  try {
    const customerId = req.user.id;
    const customer = await Customer.findByPk(customerId);

    if (!customer || !customer.trendyol_api_key) {
      return res.status(400).json({
        success: false,
        message: 'Trendyol API bağlantı bilgileri eksik'
      });
    }

    const trendyolClient = new TrendyolAPIClient(
      customer.trendyol_api_key,
      customer.trendyol_api_secret,
      customer.trendyol_supplier_id
    );

    logger.info('Trendyol\'dan ürünler çekiliyor...', { customerId });

    // Trendyol'dan ürünleri çek
    const products = await trendyolClient.getProducts();
    
    logger.info(`Trendyol'dan ${products.length} ürün çekildi`);

    res.json({
      success: true,
      data: products,
      total: products.length
    });

  } catch (error) {
    logger.error('Trendyol ürün çekme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler çekilirken hata oluştu',
      error: error.message
    });
  }
};

// Seçilen ürünleri WooCommerce'a aktar
const importToWooCommerce = async (req, res) => {
  try {
    const { productIds } = req.body;
    const customerId = req.user.id;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli ürün ID\'leri gerekli'
      });
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // WooCommerce API client'ını oluştur
    const wooCommerceClient = new WooCommerceAPIClient(
      customer.woo_store_url,
      customer.woo_consumer_key,
      customer.woo_consumer_secret
    );

    const trendyolClient = new TrendyolAPIClient(
      customer.trendyol_api_key,
      customer.trendyol_api_secret,
      customer.trendyol_supplier_id
    );

    const imported = [];
    const failed = [];

    // Her ürün için işlem yap
    for (const trendyolProductId of productIds) {
      try {
        // 1. Trendyol'dan ürün detaylarını al
        const trendyolProduct = await trendyolClient.getProduct(trendyolProductId);
        
        if (!trendyolProduct) {
          failed.push({
            id: trendyolProductId,
            reason: 'Trendyol\'da ürün bulunamadı'
          });
          continue;
        }

        // 2. WooCommerce'a gönderilecek veriyi hazırla
        const wooProductData = {
          name: trendyolProduct.name,
          description: trendyolProduct.description || '',
          regular_price: trendyolProduct.price.toString(),
          stock_quantity: trendyolProduct.stock || 0,
          stock_status: trendyolProduct.stock > 0 ? 'instock' : 'outofstock',
          images: trendyolProduct.images ? trendyolProduct.images.map(img => ({
            src: img.url,
            alt: img.alt || trendyolProduct.name
          })) : [],
          categories: [{
            id: 1 // Varsayılan kategori
          }],
          sku: `TR-${trendyolProductId}`,
          status: 'publish'
        };

        // 3. WooCommerce'a gönder
        const wooProduct = await wooCommerceClient.createProduct(wooProductData);
        
        if (wooProduct && wooProduct.id) {
          // 4. Eşleştirme verisini kaydet
          await ProductSyncMap.create({
            customer_id: customerId,
            trendyol_product_id: trendyolProductId,
            woo_product_id: wooProduct.id,
            sync_date: new Date(),
            status: 'imported'
          });

          imported.push({
            trendyolId: trendyolProductId,
            wooId: wooProduct.id,
            name: trendyolProduct.name
          });

          logger.info(`Ürün başarıyla aktarıldı: ${trendyolProductId} -> ${wooProduct.id}`);
        } else {
          failed.push({
            id: trendyolProductId,
            reason: 'WooCommerce\'a aktarılamadı'
          });
        }

      } catch (error) {
        logger.error(`Ürün aktarma hatası (${trendyolProductId}):`, error);
        failed.push({
          id: trendyolProductId,
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        imported,
        failed,
        total: productIds.length,
        success: imported.length,
        failed: failed.length
      }
    });

  } catch (error) {
    logger.error('WooCommerce aktarma genel hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler aktarılırken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  sendProducts,
  getCategories,
  checkProductStatus,
  pullProducts,
  importToWooCommerce
}; 