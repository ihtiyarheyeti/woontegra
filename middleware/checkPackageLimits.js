const { Tenant, Product, MarketplaceConnection, Customer } = require('../models');
const logger = require('../utils/logger');

/**
 * Check if tenant has reached product limit
 */
const checkProductLimit = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    
    // Get tenant with package info
    const tenant = await Tenant.findByPk(tenant_id, {
      include: [{
        model: require('../models').Package,
        as: 'package',
        attributes: ['max_products']
      }]
    });

    if (!tenant || !tenant.package) {
      return res.status(400).json({
        success: false,
        message: 'Kiracı paket bilgisi bulunamadı'
      });
    }

    // Count current products
    const currentProductCount = await Product.count({
      where: { tenant_id }
    });

    if (currentProductCount >= tenant.package.max_products) {
      return res.status(403).json({
        success: false,
        message: `Ürün limitine ulaştınız. Maksimum ${tenant.package.max_products} ürün ekleyebilirsiniz.`,
        data: {
          current: currentProductCount,
          limit: tenant.package.max_products
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking product limit:', error);
    res.status(500).json({
      success: false,
      message: 'Limit kontrolü sırasında hata oluştu'
    });
  }
};

/**
 * Check if tenant has reached integration limit
 */
const checkIntegrationLimit = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    
    // Get tenant with package info
    const tenant = await Tenant.findByPk(tenant_id, {
      include: [{
        model: require('../models').Package,
        as: 'package',
        attributes: ['max_integrations']
      }]
    });

    if (!tenant || !tenant.package) {
      return res.status(400).json({
        success: false,
        message: 'Kiracı paket bilgisi bulunamadı'
      });
    }

    // Count current integrations
    const currentIntegrationCount = await MarketplaceConnection.count({
      where: { tenant_id }
    });

    if (currentIntegrationCount >= tenant.package.max_integrations) {
      return res.status(403).json({
        success: false,
        message: `Entegrasyon limitine ulaştınız. Maksimum ${tenant.package.max_integrations} entegrasyon ekleyebilirsiniz.`,
        data: {
          current: currentIntegrationCount,
          limit: tenant.package.max_integrations
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking integration limit:', error);
    res.status(500).json({
      success: false,
      message: 'Limit kontrolü sırasında hata oluştu'
    });
  }
};

/**
 * Check if tenant has reached user limit
 */
const checkUserLimit = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    
    // Get tenant with package info
    const tenant = await Tenant.findByPk(tenant_id, {
      include: [{
        model: require('../models').Package,
        as: 'package',
        attributes: ['max_users']
      }]
    });

    if (!tenant || !tenant.package) {
      return res.status(400).json({
        success: false,
        message: 'Kiracı paket bilgisi bulunamadı'
      });
    }

    // Count current users
    const currentUserCount = await Customer.count({
      where: { tenant_id }
    });

    if (currentUserCount >= tenant.package.max_users) {
      return res.status(403).json({
        success: false,
        message: `Kullanıcı limitine ulaştınız. Maksimum ${tenant.package.max_users} kullanıcı ekleyebilirsiniz.`,
        data: {
          current: currentUserCount,
          limit: tenant.package.max_users
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking user limit:', error);
    res.status(500).json({
      success: false,
      message: 'Limit kontrolü sırasında hata oluştu'
    });
  }
};

/**
 * Get tenant usage statistics
 */
const getTenantUsage = async (tenant_id) => {
  try {
    const tenant = await Tenant.findByPk(tenant_id, {
      include: [{
        model: require('../models').Package,
        as: 'package',
        attributes: ['max_products', 'max_integrations', 'max_users']
      }]
    });

    if (!tenant || !tenant.package) {
      return null;
    }

    const [productCount, integrationCount, userCount] = await Promise.all([
      Product.count({ where: { tenant_id } }),
      MarketplaceConnection.count({ where: { tenant_id } }),
      Customer.count({ where: { tenant_id } })
    ]);

    return {
      products: {
        current: productCount,
        limit: tenant.package.max_products,
        percentage: Math.round((productCount / tenant.package.max_products) * 100)
      },
      integrations: {
        current: integrationCount,
        limit: tenant.package.max_integrations,
        percentage: Math.round((integrationCount / tenant.package.max_integrations) * 100)
      },
      users: {
        current: userCount,
        limit: tenant.package.max_users,
        percentage: Math.round((userCount / tenant.package.max_users) * 100)
      }
    };
  } catch (error) {
    logger.error('Error getting tenant usage:', error);
    return null;
  }
};

module.exports = {
  checkProductLimit,
  checkIntegrationLimit,
  checkUserLimit,
  getTenantUsage
}; 