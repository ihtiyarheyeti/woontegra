const CategoryMapping = require('../models/CategoryMapping');
const WooCommerceAPIClient = require('../services/WooCommerceAPIClient');
const TrendyolAPIClient = require('../services/TrendyolAPIClient');
const HepsiburadaAPIClient = require('../services/HepsiburadaAPIClient');
const N11APIClient = require('../services/N11APIClient');
const CiceksepetiAPIClient = require('../services/CiceksepetiAPIClient');
const PazaramaAPIClient = require('../services/PazaramaAPIClient');
const logger = require('../utils/logger');

// Kategori eşleştirmelerini getir
const getCategoryMappings = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    logger.info(`GET /api/category-mappings - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    const mappings = await CategoryMapping.findAll({
      where: {
        customer_id,
        tenant_id,
        is_active: true
      },
      order: [['created_at', 'DESC']]
    });

    logger.info(`✅ Kategori eşleştirmeleri getirildi - Customer ID: ${customer_id}, Count: ${mappings.length}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: mappings
    });
  } catch (error) {
    logger.error(`❌ Kategori eşleştirmeleri getirilirken hata - Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategori eşleştirmeleri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// WooCommerce kategorilerini getir
const getWooCommerceCategories = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    logger.info(`GET /api/category-mappings/woo-categories - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // WooCommerce API'den kategorileri al
    const wooCommerceClient = new WooCommerceAPIClient(req.user);
    const categories = await wooCommerceClient.getCategories();

    logger.info(`✅ WooCommerce kategorileri getirildi - Customer ID: ${customer_id}, Count: ${categories.length}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`❌ WooCommerce kategorileri getirilirken hata - Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'WooCommerce kategorileri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Trendyol kategorilerini getir
const getTrendyolCategories = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    logger.info(`GET /api/category-mappings/trendyol-categories - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // Trendyol API'den kategorileri al
    const trendyolClient = new TrendyolAPIClient(req.user);
    const categories = await trendyolClient.getCategories();

    logger.info(`✅ Trendyol kategorileri getirildi - Customer ID: ${customer_id}, Count: ${categories.length}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`❌ Trendyol kategorileri getirilirken hata - Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Trendyol kategorileri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Hepsiburada kategorilerini getir
const getHepsiburadaCategories = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    logger.info(`GET /api/category-mappings/hepsiburada-categories - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // Hepsiburada API'den kategorileri al
    const hepsiburadaClient = new HepsiburadaAPIClient(req.user);
    const categories = await hepsiburadaClient.getCategories();

    logger.info(`✅ Hepsiburada kategorileri getirildi - Customer ID: ${customer_id}, Count: ${categories.length}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`❌ Hepsiburada kategorileri getirilirken hata - Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Hepsiburada kategorileri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// N11 kategorilerini getir
const getN11Categories = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    logger.info(`GET /api/category-mappings/n11-categories - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // N11 API'den kategorileri al
    const n11Client = new N11APIClient(req.user);
    const categories = await n11Client.getCategories();

    logger.info(`✅ N11 kategorileri getirildi - Customer ID: ${customer_id}, Count: ${categories.length}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`❌ N11 kategorileri getirilirken hata - Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'N11 kategorileri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Çiçeksepeti kategorilerini getir
const getCiceksepetiCategories = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    logger.info(`GET /api/category-mappings/ciceksepeti-categories - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // Çiçeksepeti API'den kategorileri al
    const ciceksepetiClient = new CiceksepetiAPIClient(req.user);
    const categories = await ciceksepetiClient.getCategories();

    logger.info(`✅ Çiçeksepeti kategorileri getirildi - Customer ID: ${customer_id}, Count: ${categories.length}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`❌ Çiçeksepeti kategorileri getirilirken hata - Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Çiçeksepeti kategorileri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Pazarama kategorilerini getir
const getPazaramaCategories = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    logger.info(`GET /api/category-mappings/pazarama-categories - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // Pazarama API'den kategorileri al
    const pazaramaClient = new PazaramaAPIClient(req.user);
    const categories = await pazaramaClient.getCategories();

    logger.info(`✅ Pazarama kategorileri getirildi - Customer ID: ${customer_id}, Count: ${categories.length}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`❌ Pazarama kategorileri getirilirken hata - Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Pazarama kategorileri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Kategori eşleştirmesi oluştur
const createCategoryMapping = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;
    const {
      local_category_id,
      local_category_name,
      marketplace,
      marketplace_category_id,
      marketplace_category_name
    } = req.body;

    logger.info(`POST /api/category-mappings - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // Gerekli alanları kontrol et
    if (!local_category_id || !local_category_name || !marketplace || !marketplace_category_id || !marketplace_category_name) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar gereklidir'
      });
    }

    // Aynı eşleştirmenin var olup olmadığını kontrol et
    const existingMapping = await CategoryMapping.findOne({
      where: {
        customer_id,
        tenant_id,
        local_category_id,
        marketplace,
        is_active: true
      }
    });

    if (existingMapping) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategori için zaten bir eşleştirme mevcut'
      });
    }

    // Yeni eşleştirme oluştur
    const mapping = await CategoryMapping.create({
      tenant_id,
      customer_id,
      local_category_id,
      local_category_name,
      marketplace,
      marketplace_category_id,
      marketplace_category_name,
      is_active: true
    });

    logger.info(`✅ Kategori eşleştirmesi oluşturuldu - Customer ID: ${customer_id}, Mapping ID: ${mapping.id}, Süre: ${Date.now() - req.startTime}ms`);

    res.status(201).json({
      success: true,
      data: mapping,
      message: 'Kategori eşleştirmesi başarıyla oluşturuldu'
    });
  } catch (error) {
    logger.error(`❌ Kategori eşleştirmesi oluşturulurken hata - Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategori eşleştirmesi oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// Kategori eşleştirmesi güncelle
const updateCategoryMapping = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;
    const { id } = req.params;
    const {
      marketplace_category_id,
      marketplace_category_name
    } = req.body;

    logger.info(`PUT /api/category-mappings/${id} - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // Eşleştirmeyi bul
    const mapping = await CategoryMapping.findOne({
      where: {
        id,
        customer_id,
        tenant_id,
        is_active: true
      }
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Kategori eşleştirmesi bulunamadı'
      });
    }

    // Güncelle
    await mapping.update({
      marketplace_category_id,
      marketplace_category_name
    });

    logger.info(`✅ Kategori eşleştirmesi güncellendi - Customer ID: ${customer_id}, Mapping ID: ${id}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: mapping,
      message: 'Kategori eşleştirmesi başarıyla güncellendi'
    });
  } catch (error) {
    logger.error(`❌ Kategori eşleştirmesi güncellenirken hata - Customer ID: ${req.user?.id}, Mapping ID: ${req.params.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategori eşleştirmesi güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Kategori eşleştirmesi sil
const deleteCategoryMapping = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;
    const { id } = req.params;

    logger.info(`DELETE /api/category-mappings/${id} - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // Eşleştirmeyi bul
    const mapping = await CategoryMapping.findOne({
      where: {
        id,
        customer_id,
        tenant_id,
        is_active: true
      }
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Kategori eşleştirmesi bulunamadı'
      });
    }

    // Soft delete - is_active'i false yap
    await mapping.update({ is_active: false });

    logger.info(`✅ Kategori eşleştirmesi silindi - Customer ID: ${customer_id}, Mapping ID: ${id}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      message: 'Kategori eşleştirmesi başarıyla silindi'
    });
  } catch (error) {
    logger.error(`❌ Kategori eşleştirmesi silinirken hata - Customer ID: ${req.user?.id}, Mapping ID: ${req.params.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategori eşleştirmesi silinirken hata oluştu',
      error: error.message
    });
  }
};

// Kategori eşleştirmesi getir (ID ile)
const getCategoryMappingById = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;
    const { id } = req.params;

    logger.info(`GET /api/category-mappings/${id} - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    const mapping = await CategoryMapping.findOne({
      where: {
        id,
        customer_id,
        tenant_id,
        is_active: true
      }
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Kategori eşleştirmesi bulunamadı'
      });
    }

    logger.info(`✅ Kategori eşleştirmesi getirildi - Customer ID: ${customer_id}, Mapping ID: ${id}, Süre: ${Date.now() - req.startTime}ms`);

    res.json({
      success: true,
      data: mapping
    });
  } catch (error) {
    logger.error(`❌ Kategori eşleştirmesi getirilirken hata - Customer ID: ${req.user?.id}, Mapping ID: ${req.params.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Kategori eşleştirmesi getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Ürün için kategori eşleşmesini getir
const getCategoryMappingByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const customer_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    logger.info(`GET /api/category-mappings/product/${productId} - Customer ID: ${customer_id}, Tenant ID: ${tenant_id}`);

    // Önce WooCommerce'dan ürün bilgilerini al
    const wooCommerceClient = new WooCommerceAPIClient(req.user);
    const product = await wooCommerceClient.getProduct(productId);

    if (!product || !product.categories || product.categories.length === 0) {
      return res.json({
        success: false,
        message: 'Ürün kategorisi bulunamadı'
      });
    }

    const wooCategoryId = product.categories[0].id;

    // Kategori eşleşmesini bul
    const mapping = await CategoryMapping.findOne({
      where: {
        woo_category_id: wooCategoryId,
        customer_id,
        tenant_id,
        is_active: true
      }
    });

    if (!mapping) {
      return res.json({
        success: false,
        message: 'Bu ürün için kategori eşleşmesi bulunamadı'
      });
    }

    logger.info(`✅ Ürün kategori eşleşmesi getirildi - Product ID: ${productId}, Woo Category ID: ${wooCategoryId}, Customer ID: ${customer_id}`);

    res.json({
      success: true,
      mapping: {
        id: mapping.id,
        name: mapping.trendyol_category_name,
        category_id: mapping.trendyol_category_id
      }
    });
  } catch (error) {
    logger.error(`❌ Ürün kategori eşleşmesi getirilirken hata - Product ID: ${req.params?.productId}, Customer ID: ${req.user?.id}, Hata: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Ürün kategori eşleşmesi getirilirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getCategoryMappings,
  getCategoryMappingById,
  createCategoryMapping,
  updateCategoryMapping,
  deleteCategoryMapping,
  getWooCommerceCategories,
  getTrendyolCategories,
  getHepsiburadaCategories,
  getN11Categories,
  getCiceksepetiCategories,
  getPazaramaCategories,
  getCategoryMappingByProduct
}; 