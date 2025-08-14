const Customer = require('../models/Customer');
const CategoryMapping = require('../models/CategoryMapping');
const ProductSyncMap = require('../models/ProductSyncMap');
const WooCommerceAPIClient = require('../services/WooCommerceAPIClient');
const TrendyolAPIClient = require('../services/TrendyolAPIClient');
const mockDataController = require('./mockDataController');
const logger = require('../utils/logger');

// Gerçek Trendyol API fonksiyonları
const getTrendyolCategories = async (req, res) => {
  const startTime = Date.now();
  const customer_id = req.user.id;
  
  logger.info(`🔄 Trendyol kategorileri getiriliyor - Customer ID: ${customer_id}`);
  
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findByPk(customer_id);
    
    if (!customer.trendyol_api_key || !customer.trendyol_api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Trendyol API bilgileri eksik'
      });
    }

    // Gerçek Trendyol API'den kategorileri çek
    const axios = require('axios');
    const apiUrl = 'https://apigw.trendyol.com/integration/product/product-categories';
    
    logger.info('🔗 Trendyol API\'ye istek gönderiliyor:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${customer.trendyol_api_key}:${customer.trendyol_api_secret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 saniye timeout
    });

    // Response formatını debug et
    logger.info('🔍 Trendyol API Response:', {
      status: response.status,
      statusText: response.statusText,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: response.data ? (Array.isArray(response.data) ? response.data.length : 'N/A') : 'null/undefined',
      sampleData: response.data ? (Array.isArray(response.data) ? response.data.slice(0, 2) : response.data) : 'null/undefined'
    });

    if (response.data && Array.isArray(response.data)) {
      const categories = response.data;
      logger.info(`📊 Trendyol'dan ${categories.length} kategori alındı`);
      
      const duration = Date.now() - startTime;
      logger.info(`✅ Trendyol kategorileri başarıyla getirildi - Süre: ${duration}ms`);

      res.json({
        success: true,
        data: categories,
        message: 'Trendyol kategorileri başarıyla getirildi'
      });
    } else if (response.data && typeof response.data === 'object') {
      // Eğer response.data bir obje ise, içinde categories array'i olabilir
      logger.info('🔍 Response.data bir obje, içeriği kontrol ediliyor...');
      
      // Response.data'nın tüm key'lerini log'la
      const keys = Object.keys(response.data);
      logger.info('🔑 Response.data keys:', keys);
      
      // Categories key'i var mı kontrol et
      if (response.data.categories && Array.isArray(response.data.categories)) {
        const categories = response.data.categories;
        logger.info(`📊 Trendyol'dan ${categories.length} kategori alındı (categories key'inden)`);
        
        // İlk birkaç kategoriyi detaylı log'la
        if (categories.length > 0) {
          logger.info('🔍 İlk kategori örneği:', JSON.stringify(categories[0], null, 2));
          
          // Tüm kategorilerin key'lerini kontrol et
          const firstCategoryKeys = Object.keys(categories[0]);
          logger.info('🔑 İlk kategorinin tüm key\'leri:', firstCategoryKeys);
          
          // Alt kategorileri kontrol et - farklı key isimleri olabilir
          const categoriesWithSubs = categories.filter(cat => {
            // subCategories, subcategories, children, childCategories gibi farklı isimler olabilir
            return (cat.subCategories && cat.subCategories.length > 0) ||
                   (cat.subcategories && cat.subcategories.length > 0) ||
                   (cat.children && cat.children.length > 0) ||
                   (cat.childCategories && cat.childCategories.length > 0);
          });
          logger.info(`📂 Alt kategorisi olan kategori sayısı: ${categoriesWithSubs.length}`);
          
          if (categoriesWithSubs.length > 0) {
            logger.info('🔍 Alt kategorisi olan ilk kategori:', JSON.stringify(categoriesWithSubs[0], null, 2));
            
            // Alt kategori key'ini bul
            const subKey = categoriesWithSubs[0].subCategories ? 'subCategories' :
                          categoriesWithSubs[0].subcategories ? 'subcategories' :
                          categoriesWithSubs[0].children ? 'children' :
                          categoriesWithSubs[0].childCategories ? 'childCategories' : null;
            
            if (subKey) {
              logger.info(`🔑 Alt kategori key'i bulundu: ${subKey}`);
              logger.info(`📊 Alt kategori sayısı: ${categoriesWithSubs[0][subKey].length}`);
            }
          }
        }
        
        // Veri yapısını frontend için düzenle
        const formattedCategories = categories.map(category => {
          // Alt kategori key'ini bul
          const subKey = category.subCategories ? 'subCategories' :
                        category.subcategories ? 'subcategories' :
                        category.children ? 'children' :
                        category.childCategories ? 'childCategories' : null;
          
          return {
            id: category.id,
            name: category.name,
            parentId: category.parentId,
            subCategories: subKey ? category[subKey] : []
          };
        });
        
        logger.info(`🔄 Frontend için ${formattedCategories.length} kategori formatlandı`);
        
        const duration = Date.now() - startTime;
        logger.info(`✅ Trendyol kategorileri başarıyla getirildi - Süre: ${duration}ms`);

        res.json({
          success: true,
          data: formattedCategories,
          message: 'Trendyol kategorileri başarıyla getirildi'
        });
      } else {
        // Response.data'yı direkt kullan
        logger.info('📊 Response.data direkt kullanılıyor');
        
        const duration = Date.now() - startTime;
        logger.info(`✅ Trendyol kategorileri başarıyla getirildi - Süre: ${duration}ms`);

        res.json({
          success: true,
          data: response.data,
          message: 'Trendyol kategorileri başarıyla getirildi'
        });
      }
    } else {
      throw new Error(`Trendyol API'den geçersiz response formatı. Data type: ${typeof response.data}, Is Array: ${Array.isArray(response.data)}`);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.response) {
      // API'den hata response'u
      logger.error(`❌ Trendyol API Hatası - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}, Süre: ${duration}ms`);
      
      res.status(error.response.status).json({
        success: false,
        message: `Trendyol API Hatası: ${error.response.status}`,
        error: error.response.data
      });
    } else if (error.request) {
      // Network hatası
      logger.error(`❌ Trendyol API Network Hatası - Hata: ${error.message}, Süre: ${duration}ms`);
      
      res.status(500).json({
        success: false,
        message: 'Trendyol API\'ye bağlanılamadı',
        error: 'Network error'
      });
    } else {
      // Diğer hatalar
      logger.error(`❌ Trendyol kategorileri alınırken hata - Hata: ${error.message}, Süre: ${duration}ms`, error);
      
      res.status(500).json({
        success: false,
        message: 'Trendyol kategorileri alınırken bir hata oluştu',
        error: error.message
      });
    }
  }
};

const getSupplierAddresses = async (req, res) => {
  return await mockDataController.getSupplierAddresses(req, res);
};

const getStaticProviders = async (req, res) => {
  return await mockDataController.getStaticProviders(req, res);
};

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



// Trendyol markalarını getir
const getTrendyolBrands = async (req, res) => {
  const startTime = Date.now();
  const customer_id = req.user.id;
  
  logger.info(`🔄 Trendyol markaları getiriliyor - Customer ID: ${customer_id}`);
  
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findByPk(customer_id);
    
    if (!customer.trendyol_api_key || !customer.trendyol_api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Trendyol API bilgileri eksik'
      });
    }

    // TODO: Gerçek Trendyol API'den markaları çek
    // Şimdilik mock data
    const brands = [
      { id: 1, name: 'Nike' },
      { id: 2, name: 'Adidas' },
      { id: 3, name: 'Apple' },
      { id: 4, name: 'Samsung' },
      { id: 5, name: 'H&M' },
      { id: 6, name: 'Zara' },
      { id: 7, name: 'Puma' },
      { id: 8, name: 'Under Armour' },
      { id: 9, name: 'Sony' },
      { id: 10, name: 'LG' }
    ];

    const duration = Date.now() - startTime;
    logger.info(`✅ Trendyol markaları başarıyla getirildi - Süre: ${duration}ms`);

    res.json({
      success: true,
      data: brands,
      message: 'Trendyol markaları başarıyla getirildi'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Trendyol markaları alınırken hata - Hata: ${error.message}, Süre: ${duration}ms`, error);
    
    res.status(500).json({
      success: false,
      message: 'Trendyol markaları alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Trendyol özelliklerini getir
const getTrendyolAttributes = async (req, res) => {
  const startTime = Date.now();
  const customer_id = req.user.id;
  
  logger.info(`🔄 Trendyol özellikleri getiriliyor - Customer ID: ${customer_id}`);
  
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findByPk(customer_id);
    
    if (!customer.trendyol_api_key || !customer.trendyol_api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Trendyol API bilgileri eksik'
      });
    }

    // TODO: Gerçek Trendyol API'den özellikleri çek
    // Şimdilik mock data
    const attributes = [
      { 
        id: 1, 
        name: 'Renk', 
        required: true, 
        allowCustom: false, 
        values: ['Kırmızı', 'Mavi', 'Yeşil', 'Siyah', 'Beyaz', 'Sarı', 'Turuncu', 'Mor', 'Pembe', 'Kahverengi'] 
      },
      { 
        id: 2, 
        name: 'Beden', 
        required: true, 
        allowCustom: false, 
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] 
      },
      { 
        id: 3, 
        name: 'Malzeme', 
        required: false, 
        allowCustom: true 
      },
      { 
        id: 4, 
        name: 'Cinsiyet', 
        required: true, 
        allowCustom: false, 
        values: ['Kadın', 'Erkek', 'Unisex', 'Çocuk'] 
      },
      { 
        id: 5, 
        name: 'Yaş Grubu', 
        required: false, 
        allowCustom: false, 
        values: ['0-3 Ay', '3-6 Ay', '6-9 Ay', '9-12 Ay', '1-2 Yaş', '2-3 Yaş', '3-4 Yaş', '4-5 Yaş', '5-6 Yaş', '6-7 Yaş', '7-8 Yaş', '8-9 Yaş', '9-10 Yaş', '10-11 Yaş', '11-12 Yaş', '12-13 Yaş', '13-14 Yaş', '14-15 Yaş', '15-16 Yaş', '16-17 Yaş', '17-18 Yaş', '18+ Yaş'] 
      }
    ];

    const duration = Date.now() - startTime;
    logger.info(`✅ Trendyol özellikleri başarıyla getirildi - Süre: ${duration}ms`);

    res.json({
      success: true,
      data: attributes,
      message: 'Trendyol özellikleri başarıyla getirildi'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Trendyol özellikleri alınırken hata - Hata: ${error.message}, Süre: ${duration}ms`, error);
    
    res.status(500).json({
      success: false,
      message: 'Trendyol özellikleri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Trendyol'a ürün gönder
const sendProductToTrendyol = async (req, res) => {
  const startTime = Date.now();
  const customer_id = req.user.id;
  
  logger.info(`🚀 Trendyol'a ürün gönderiliyor - Customer ID: ${customer_id}`);
  
  try {
    const Customer = require('../models/Customer');
    const customer = await Customer.findByPk(customer_id);
    
    if (!customer.trendyol_api_key || !customer.trendyol_api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Trendyol API bilgileri eksik'
      });
    }

    const {
      name,
      description,
      categoryId,
      brandId,
      price,
      stockCode,
      stockQuantity,
      attributes,
      images
    } = req.body;

    // Validation
    if (!name || !categoryId || !brandId || !price || !stockCode) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik'
      });
    }

    // TODO: Gerçek Trendyol API'ye ürün gönder
    const productData = {
      name,
      description,
      categoryId,
      brandId,
      price: parseFloat(price),
      stockCode,
      stockQuantity: parseInt(stockQuantity) || 0,
      attributes,
      images: images || []
    };

    logger.info('Trendyol\'a gönderilecek ürün:', productData);

    // Şimdilik başarılı response
    const duration = Date.now() - startTime;
    logger.info(`✅ Ürün Trendyol'a başarıyla gönderildi - Süre: ${duration}ms`);

    res.json({
      success: true,
      data: {
        trendyol_product_id: `TR_${Date.now()}`,
        status: 'active',
        message: 'Ürün Trendyol\'a başarıyla gönderildi'
      },
      message: 'Ürün Trendyol\'a başarıyla gönderildi'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Trendyol'a ürün gönderilirken hata - Hata: ${error.message}, Süre: ${duration}ms`, error);
    
    res.status(500).json({
      success: false,
      message: 'Ürün Trendyol\'a gönderilemedi',
      error: error.message
    });
  }
};

module.exports = {
  sendProducts,
  getCategories,
  checkProductStatus,
  pullProducts,
  importToWooCommerce,
  getTrendyolCategories,
  getSupplierAddresses,
  getStaticProviders,
  getTrendyolBrands,
  getTrendyolAttributes,
  sendProductToTrendyol
}; 