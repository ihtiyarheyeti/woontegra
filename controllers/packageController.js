const { Package, Tenant } = require('../models');
const logger = require('../utils/logger');

class PackageController {
  /**
   * Get all packages
   * GET /api/packages
   */
  async getAllPackages(req, res) {
    try {
      const packages = await Package.findAll({
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
        include: [
          {
            model: Tenant,
            as: 'tenants',
            attributes: ['id', 'name', 'status']
          }
        ]
      });

      logger.info(`Packages fetched: ${packages.length} total`);

      res.json({
        success: true,
        data: packages
      });

    } catch (error) {
      logger.error('Error fetching packages:', error);
      res.status(500).json({
        success: false,
        message: 'Paketler alınırken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Get package by ID
   * GET /api/packages/:id
   */
  async getPackageById(req, res) {
    try {
      const { id } = req.params;

      const packageData = await Package.findByPk(id, {
        include: [
          {
            model: Tenant,
            as: 'tenants',
            attributes: ['id', 'name', 'status', 'created_at']
          }
        ]
      });

      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: 'Paket bulunamadı'
        });
      }

      res.json({
        success: true,
        data: packageData
      });

    } catch (error) {
      logger.error('Error fetching package:', error);
      res.status(500).json({
        success: false,
        message: 'Paket alınırken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Create new package
   * POST /api/packages
   */
  async createPackage(req, res) {
    try {
      const {
        name,
        slug,
        max_products,
        max_integrations,
        max_users,
        price,
        description,
        features = [],
        is_active = true,
        sort_order = 0
      } = req.body;

      // Validate required fields
      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: 'Paket adı ve slug zorunludur'
        });
      }

      // Check if slug already exists
      const existingPackage = await Package.findOne({
        where: { slug }
      });

      if (existingPackage) {
        return res.status(409).json({
          success: false,
          message: 'Bu slug zaten kullanılıyor'
        });
      }

      const packageData = await Package.create({
        name,
        slug,
        max_products: parseInt(max_products) || 100,
        max_integrations: parseInt(max_integrations) || 5,
        max_users: parseInt(max_users) || 3,
        price: parseFloat(price) || 0.00,
        description,
        features: Array.isArray(features) ? features : [],
        is_active,
        sort_order: parseInt(sort_order) || 0
      });

      logger.info(`Package created: ${packageData.name} (ID: ${packageData.id})`);

      res.status(201).json({
        success: true,
        message: 'Paket başarıyla oluşturuldu',
        data: packageData
      });

    } catch (error) {
      logger.error('Error creating package:', error);
      res.status(500).json({
        success: false,
        message: 'Paket oluşturulurken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Update package
   * PUT /api/packages/:id
   */
  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        slug,
        max_products,
        max_integrations,
        max_users,
        price,
        description,
        features,
        is_active,
        sort_order
      } = req.body;

      const packageData = await Package.findByPk(id);

      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: 'Paket bulunamadı'
        });
      }

      // Check if slug is being changed and if it already exists
      if (slug && slug !== packageData.slug) {
        const existingPackage = await Package.findOne({
          where: { slug, id: { [require('sequelize').Op.ne]: id } }
        });

        if (existingPackage) {
          return res.status(409).json({
            success: false,
            message: 'Bu slug zaten kullanılıyor'
          });
        }
      }

      // Update package
      await packageData.update({
        name: name || packageData.name,
        slug: slug || packageData.slug,
        max_products: max_products !== undefined ? parseInt(max_products) : packageData.max_products,
        max_integrations: max_integrations !== undefined ? parseInt(max_integrations) : packageData.max_integrations,
        max_users: max_users !== undefined ? parseInt(max_users) : packageData.max_users,
        price: price !== undefined ? parseFloat(price) : packageData.price,
        description: description !== undefined ? description : packageData.description,
        features: features !== undefined ? (Array.isArray(features) ? features : []) : packageData.features,
        is_active: is_active !== undefined ? is_active : packageData.is_active,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : packageData.sort_order
      });

      logger.info(`Package updated: ${packageData.name} (ID: ${packageData.id})`);

      res.json({
        success: true,
        message: 'Paket başarıyla güncellendi',
        data: packageData
      });

    } catch (error) {
      logger.error('Error updating package:', error);
      res.status(500).json({
        success: false,
        message: 'Paket güncellenirken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Delete package
   * DELETE /api/packages/:id
   */
  async deletePackage(req, res) {
    try {
      const { id } = req.params;

      const packageData = await Package.findByPk(id, {
        include: [
          {
            model: Tenant,
            as: 'tenants',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: 'Paket bulunamadı'
        });
      }

      // Check if package has associated tenants
      if (packageData.tenants && packageData.tenants.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu pakete sahip kiracılar bulunduğu için silinemez',
          data: {
            tenants: packageData.tenants.map(t => ({ id: t.id, name: t.name }))
          }
        });
      }

      await packageData.destroy();

      logger.info(`Package deleted: ${packageData.name} (ID: ${packageData.id})`);

      res.json({
        success: true,
        message: 'Paket başarıyla silindi'
      });

    } catch (error) {
      logger.error('Error deleting package:', error);
      res.status(500).json({
        success: false,
        message: 'Paket silinirken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Get package statistics
   * GET /api/packages/stats
   */
  async getPackageStats(req, res) {
    try {
      const stats = await Package.findAll({
        attributes: [
          'id',
          'name',
          'slug',
          [require('sequelize').fn('COUNT', require('sequelize').col('tenants.id')), 'tenant_count'],
          [require('sequelize').fn('SUM', require('sequelize').col('tenants.id')), 'total_tenants']
        ],
        include: [
          {
            model: Tenant,
            as: 'tenants',
            attributes: []
          }
        ],
        group: ['Package.id', 'Package.name', 'Package.slug'],
        order: [['sort_order', 'ASC']]
      });

      const totalPackages = await Package.count();
      const activePackages = await Package.count({ where: { is_active: true } });

      res.json({
        success: true,
        data: {
          total_packages: totalPackages,
          active_packages: activePackages,
          package_breakdown: stats
        }
      });

    } catch (error) {
      logger.error('Error fetching package stats:', error);
      res.status(500).json({
        success: false,
        message: 'Paket istatistikleri alınırken bir hata oluştu',
        error: error.message
      });
    }
  }
}

module.exports = new PackageController(); 