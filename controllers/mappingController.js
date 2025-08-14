const logger = require('../utils/logger');
const AttributeMapping = require('../models/AttributeMapping');
const ProductMapping = require('../models/ProductMapping');
const CategoryMapping = require('../models/CategoryMapping');

const mappingController = {
  // Attribute mappings
  getAttributeMappings: async (req, res) => {
    try {
      const { productId, categoryId } = req.params;
      let whereClause = {};

      if (productId) {
        whereClause.product_id = productId;
      } else if (categoryId) {
        whereClause.category_id = categoryId;
      }

      const mappings = await AttributeMapping.findAll({
        where: whereClause,
        include: [
          {
            model: require('../models/Product'),
            as: 'product',
            attributes: ['id', 'name', 'sku']
          },
          {
            model: require('../models/Category'),
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      return res.json({
        success: true,
        data: mappings
      });
    } catch (error) {
      logger.error('Attribute mappings getirme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Attribute mappings alınamadı'
      });
    }
  },

  createAttributeMapping: async (req, res) => {
    try {
      const mappingData = req.body;
      const mapping = await AttributeMapping.create(mappingData);

      return res.status(201).json({
        success: true,
        data: mapping,
        message: 'Attribute mapping başarıyla oluşturuldu'
      });
    } catch (error) {
      logger.error('Attribute mapping oluşturma hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Attribute mapping oluşturulamadı'
      });
    }
  },

  updateAttributeMapping: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const mapping = await AttributeMapping.findByPk(id);
      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: 'Attribute mapping bulunamadı'
        });
      }

      await mapping.update(updateData);

      return res.json({
        success: true,
        data: mapping,
        message: 'Attribute mapping başarıyla güncellendi'
      });
    } catch (error) {
      logger.error('Attribute mapping güncelleme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Attribute mapping güncellenemedi'
      });
    }
  },

  deleteAttributeMapping: async (req, res) => {
    try {
      const { id } = req.params;

      const mapping = await AttributeMapping.findByPk(id);
      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: 'Attribute mapping bulunamadı'
        });
      }

      await mapping.destroy();

      return res.json({
        success: true,
        message: 'Attribute mapping başarıyla silindi'
      });
    } catch (error) {
      logger.error('Attribute mapping silme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Attribute mapping silinemedi'
      });
    }
  },

  // Product mappings
  getProductMappings: async (req, res) => {
    try {
      const { productId } = req.params;

      const mappings = await ProductMapping.findAll({
        where: { product_id: productId },
        include: [
          {
            model: require('../models/Product'),
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }
        ]
      });

      return res.json({
        success: true,
        data: mappings
      });
    } catch (error) {
      logger.error('Product mappings getirme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Product mappings alınamadı'
      });
    }
  },

  createProductMapping: async (req, res) => {
    try {
      const mappingData = req.body;
      const mapping = await ProductMapping.create(mappingData);

      return res.status(201).json({
        success: true,
        data: mapping,
        message: 'Product mapping başarıyla oluşturuldu'
      });
    } catch (error) {
      logger.error('Product mapping oluşturma hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Product mapping oluşturulamadı'
      });
    }
  },

  updateProductMapping: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const mapping = await ProductMapping.findByPk(id);
      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: 'Product mapping bulunamadı'
        });
      }

      await mapping.update(updateData);

      return res.json({
        success: true,
        data: mapping,
        message: 'Product mapping başarıyla güncellendi'
      });
    } catch (error) {
      logger.error('Product mapping güncelleme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Product mapping güncellenemedi'
      });
    }
  },

  deleteProductMapping: async (req, res) => {
    try {
      const { id } = req.params;

      const mapping = await ProductMapping.findByPk(id);
      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: 'Product mapping bulunamadı'
        });
      }

      await mapping.destroy();

      return res.json({
        success: true,
        message: 'Product mapping başarıyla silindi'
      });
    } catch (error) {
      logger.error('Product mapping silme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Product mapping silinemedi'
      });
    }
  },

  // Category mappings
  getCategoryMappings: async (req, res) => {
    try {
      const mappings = await CategoryMapping.findAll({
        include: [
          {
            model: require('../models/Category'),
            as: 'sourceCategory',
            attributes: ['id', 'name']
          },
          {
            model: require('../models/Category'),
            as: 'targetCategory',
            attributes: ['id', 'name']
          }
        ]
      });

      return res.json({
        success: true,
        data: mappings
      });
    } catch (error) {
      logger.error('Category mappings getirme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Category mappings alınamadı'
      });
    }
  },

  createCategoryMapping: async (req, res) => {
    try {
      const mappingData = req.body;
      const mapping = await CategoryMapping.create(mappingData);

      return res.status(201).json({
        success: true,
        data: mapping,
        message: 'Category mapping başarıyla oluşturuldu'
      });
    } catch (error) {
      logger.error('Category mapping oluşturma hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Category mapping oluşturulamadı'
      });
    }
  },

  updateCategoryMapping: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const mapping = await CategoryMapping.findByPk(id);
      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: 'Category mapping bulunamadı'
        });
      }

      await mapping.update(updateData);

      return res.json({
        success: true,
        data: mapping,
        message: 'Category mapping başarıyla güncellendi'
      });
    } catch (error) {
      logger.error('Category mapping güncelleme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Category mapping güncellenemedi'
      });
    }
  },

  deleteCategoryMapping: async (req, res) => {
    try {
      const { id } = req.params;

      const mapping = await CategoryMapping.findByPk(id);
      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: 'Category mapping bulunamadı'
        });
      }

      await mapping.destroy();

      return res.json({
        success: true,
        message: 'Category mapping başarıyla silindi'
      });
    } catch (error) {
      logger.error('Category mapping silme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Category mapping silinemedi'
      });
    }
  }
};

module.exports = mappingController;
