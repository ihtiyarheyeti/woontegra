const Tenant = require('../models/Tenant');
const Customer = require('../models/Customer');
const Package = require('../models/Package');
const logger = require('../utils/logger');

class TenantController {
  /**
   * Get all tenants (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllTenants(req, res) {
    try {
      const tenants = await Tenant.findAll({
        include: [
          {
            model: Customer,
            as: 'customers',
            attributes: ['id', 'name', 'email', 'role', 'is_active']
          },
          {
            model: Package,
            as: 'package',
            attributes: ['id', 'name', 'slug', 'max_products', 'max_integrations', 'max_users', 'price']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: tenants
      });
    } catch (error) {
      logger.error('Error in getAllTenants:', error);
      res.status(500).json({
        success: false,
        message: 'Kiracılar alınırken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Get tenant by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTenantById(req, res) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customers',
            attributes: ['id', 'name', 'email', 'role', 'is_active', 'created_at']
          },
          {
            model: Package,
            as: 'package',
            attributes: ['id', 'name', 'slug', 'max_products', 'max_integrations', 'max_users', 'price', 'description', 'features']
          }
        ]
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Kiracı bulunamadı'
        });
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      logger.error('Error in getTenantById:', error);
      res.status(500).json({
        success: false,
        message: 'Kiracı bilgileri alınırken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Create new tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTenant(req, res) {
    try {
      const { 
        name, 
        slug, 
        company_name,
        email,
        phone,
        package_id,
        status = 'active',
        settings = {} 
      } = req.body;

      // Validate required fields
      if (!name || !slug || !package_id) {
        return res.status(400).json({
          success: false,
          message: 'Kiracı adı, slug ve paket ID zorunludur'
        });
      }

      // Check if slug already exists
      const existingTenant = await Tenant.findOne({
        where: { slug }
      });

      if (existingTenant) {
        return res.status(409).json({
          success: false,
          message: 'Bu slug zaten kullanılıyor'
        });
      }

      // Check if package exists
      const packageData = await Package.findByPk(package_id);
      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: 'Belirtilen paket bulunamadı'
        });
      }

      // Create tenant
      const tenant = await Tenant.create({
        name,
        slug,
        company_name,
        email,
        phone,
        package_id,
        status,
        settings
      });

      logger.info(`Tenant created: ${name} (ID: ${tenant.id}, Package: ${packageData.name})`);

      res.status(201).json({
        success: true,
        message: 'Kiracı başarıyla oluşturuldu',
        data: tenant
      });
    } catch (error) {
      logger.error('Error in createTenant:', error);
      res.status(500).json({
        success: false,
        message: 'Kiracı oluşturulurken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Update tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, 
        slug, 
        company_name,
        email,
        phone,
        package_id,
        status, 
        settings 
      } = req.body;

      const tenant = await Tenant.findByPk(id);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Kiracı bulunamadı'
        });
      }

      // Check if slug already exists (if changing)
      if (slug && slug !== tenant.slug) {
        const existingTenant = await Tenant.findOne({
          where: { slug }
        });

        if (existingTenant) {
          return res.status(409).json({
            success: false,
            message: 'Bu slug zaten kullanılıyor'
          });
        }
      }

      // Check if package exists (if changing)
      if (package_id && package_id !== tenant.package_id) {
        const packageData = await Package.findByPk(package_id);
        if (!packageData) {
          return res.status(404).json({
            success: false,
            message: 'Belirtilen paket bulunamadı'
          });
        }
      }

      // Update tenant
      await tenant.update({
        name: name || tenant.name,
        slug: slug || tenant.slug,
        company_name: company_name !== undefined ? company_name : tenant.company_name,
        email: email !== undefined ? email : tenant.email,
        phone: phone !== undefined ? phone : tenant.phone,
        package_id: package_id || tenant.package_id,
        status: status || tenant.status,
        settings: settings || tenant.settings
      });

      logger.info(`Tenant updated: ${tenant.name} (ID: ${tenant.id})`);

      res.json({
        success: true,
        message: 'Kiracı başarıyla güncellendi',
        data: tenant
      });
    } catch (error) {
      logger.error('Error in updateTenant:', error);
      res.status(500).json({
        success: false,
        message: 'Kiracı güncellenirken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Delete tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteTenant(req, res) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Kiracı bulunamadı'
        });
      }

      // Check if tenant has customers
      const customerCount = await Customer.count({
        where: { tenant_id: id }
      });

      if (customerCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu kiracının kullanıcıları bulunmaktadır. Önce kullanıcıları siliniz.'
        });
      }

      await tenant.destroy();

      logger.info(`Tenant deleted: ${tenant.name} (ID: ${tenant.id})`);

      res.json({
        success: true,
        message: 'Kiracı başarıyla silindi'
      });
    } catch (error) {
      logger.error('Error in deleteTenant:', error);
      res.status(500).json({
        success: false,
        message: 'Kiracı silinirken bir hata oluştu',
        error: error.message
      });
    }
  }

  /**
   * Get tenant statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTenantStats(req, res) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customers',
            attributes: ['id', 'role', 'is_active']
          },
          {
            model: Package,
            as: 'package',
            attributes: ['id', 'name', 'max_products', 'max_integrations', 'max_users']
          }
        ]
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Kiracı bulunamadı'
        });
      }

      const stats = {
        total_users: tenant.customers.length,
        active_users: tenant.customers.filter(c => c.is_active).length,
        admin_users: tenant.customers.filter(c => c.role === 'admin').length,
        package_info: {
          name: tenant.package?.name || 'N/A',
          max_users: tenant.package?.max_users || 0,
          max_products: tenant.package?.max_products || 0,
          max_integrations: tenant.package?.max_integrations || 0
        },
        usage_percentage: tenant.package ? Math.round((tenant.customers.length / tenant.package.max_users) * 100) : 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getTenantStats:', error);
      res.status(500).json({
        success: false,
        message: 'Kiracı istatistikleri alınırken bir hata oluştu',
        error: error.message
      });
    }
  }
}

module.exports = new TenantController(); 