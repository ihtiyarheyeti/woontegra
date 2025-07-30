const { Brand } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all brands for a tenant
 * GET /api/brands
 */
const getAllBrands = async (req, res) => {
  try {
    const { search, is_active } = req.query;

    // Build where clause
    const whereClause = {
      tenant_id: req.user.tenant_id
    };

    if (search) {
      whereClause.name = {
        [require('sequelize').Op.like]: `%${search}%`
      };
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const brands = await Brand.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: brands
    });

  } catch (error) {
    logger.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Markalar getirilemedi',
      error: error.message
    });
  }
};

/**
 * Get brand by ID
 * GET /api/brands/:id
 */
const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findOne({
      where: {
        id: id,
        tenant_id: req.user.tenant_id
      }
    });
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Marka bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: brand
    });

  } catch (error) {
    logger.error('Error fetching brand:', error);
    res.status(500).json({
      success: false,
      message: 'Marka getirilemedi',
      error: error.message
    });
  }
};

/**
 * Create new brand
 * POST /api/brands
 */
const createBrand = async (req, res) => {
  try {
    const { name, description, logo_url, website, is_active = true } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Marka adı zorunludur'
      });
    }

    // Check if brand name already exists in tenant
    const existingBrand = await Brand.findOne({
      where: {
        name: name,
        tenant_id: req.user.tenant_id
      }
    });

    if (existingBrand) {
      return res.status(409).json({
        success: false,
        message: 'Bu marka adı zaten kullanılıyor'
      });
    }

    const brand = await Brand.create({
      tenant_id: req.user.tenant_id,
      name,
      description,
      logo_url,
      website,
      is_active
    });

    logger.info(`Brand created: ${brand.name} (ID: ${brand.id}) by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Marka başarıyla oluşturuldu',
      data: brand
    });

  } catch (error) {
    logger.error('Error creating brand:', error);
    res.status(500).json({
      success: false,
      message: 'Marka oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Update brand
 * PUT /api/brands/:id
 */
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, logo_url, website, is_active } = req.body;

    const brand = await Brand.findOne({
      where: {
        id: id,
        tenant_id: req.user.tenant_id
      }
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Marka bulunamadı'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({
        where: {
          name: name,
          tenant_id: req.user.tenant_id,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingBrand) {
        return res.status(409).json({
          success: false,
          message: 'Bu marka adı zaten kullanılıyor'
        });
      }
    }

    await brand.update({
      name: name || brand.name,
      description: description !== undefined ? description : brand.description,
      logo_url: logo_url !== undefined ? logo_url : brand.logo_url,
      website: website !== undefined ? website : brand.website,
      is_active: is_active !== undefined ? is_active : brand.is_active
    });

    logger.info(`Brand updated: ${brand.name} (ID: ${brand.id}) by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Marka başarıyla güncellendi',
      data: brand
    });

  } catch (error) {
    logger.error('Error updating brand:', error);
    res.status(500).json({
      success: false,
      message: 'Marka güncellenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Delete brand
 * DELETE /api/brands/:id
 */
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findOne({
      where: {
        id: id,
        tenant_id: req.user.tenant_id
      }
    });
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Marka bulunamadı'
      });
    }

    await brand.destroy();

    logger.info(`Brand deleted: ${brand.id} - ${brand.name} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Marka başarıyla silindi'
    });

  } catch (error) {
    logger.error('Error deleting brand:', error);
    res.status(500).json({
      success: false,
      message: 'Marka silinirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand
}; 