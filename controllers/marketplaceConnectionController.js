const { MarketplaceConnection, Customer } = require('../models');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * MarketplaceConnection Controller
 * Pazaryeri bağlantıları için CRUD işlemleri
 */

// Şifreleme anahtarı (production'da environment variable'dan alınmalı)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!'.padEnd(32, '!');

// API anahtarlarını şifrele
const encryptApiKey = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// API anahtarlarını çöz
const decryptApiKey = (encryptedText) => {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedData = textParts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Tüm bağlantıları listele
const getAllConnections = async (req, res) => {
  try {
    const { user } = req;
    let whereClause = {};

    // Admin değilse sadece kendi bağlantılarını görebilir
    if (user.role !== 'admin') {
      whereClause.customer_id = user.id;
    }

    const connections = await MarketplaceConnection.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // API anahtarlarını maskele
    const maskedConnections = connections.map(conn => ({
      ...conn.toJSON(),
      api_key: conn.api_key ? '***' + conn.api_key.slice(-4) : null,
      api_secret: conn.api_secret ? '***' + conn.api_secret.slice(-4) : null
    }));

    logger.info(`Bağlantılar listelendi. Kullanıcı: ${user.id}, Rol: ${user.role}`);
    res.json({
      success: true,
      data: maskedConnections
    });
  } catch (error) {
    logger.error('Bağlantılar listelenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bağlantılar listelenirken bir hata oluştu'
    });
  }
};

// Belirli bir bağlantıyı getir
const getConnectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const connection = await MarketplaceConnection.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Bağlantı bulunamadı'
      });
    }

    // Kullanıcı sadece kendi bağlantılarını görebilir (admin hariç)
    if (user.role !== 'admin' && connection.customer_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu bağlantıya erişim izniniz yok'
      });
    }

    // API anahtarlarını maskele
    const maskedConnection = {
      ...connection.toJSON(),
      api_key: connection.api_key ? '***' + connection.api_key.slice(-4) : null,
      api_secret: connection.api_secret ? '***' + connection.api_secret.slice(-4) : null
    };

    logger.info(`Bağlantı getirildi. ID: ${id}, Kullanıcı: ${user.id}`);
    res.json({
      success: true,
      data: maskedConnection
    });
  } catch (error) {
    logger.error('Bağlantı getirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bağlantı getirilirken bir hata oluştu'
    });
  }
};

// Yeni bağlantı oluştur
const createConnection = async (req, res) => {
  try {
    const { marketplace_name, store_name, api_key, api_secret, status, additional_config } = req.body;
    const { user } = req;

    // Validasyon
    if (!marketplace_name || !store_name || !api_key || !api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Tüm zorunlu alanları doldurun'
      });
    }

    // API anahtarlarını şifrele
    const encryptedApiKey = encryptApiKey(api_key);
    const encryptedApiSecret = encryptApiKey(api_secret);

    const connection = await MarketplaceConnection.create({
      customer_id: user.id,
      marketplace_name,
      store_name,
      api_key: encryptedApiKey,
      api_secret: encryptedApiSecret,
      status: status || 'active',
      additional_config: additional_config || null
    });

    // API anahtarlarını maskele
    const maskedConnection = {
      ...connection.toJSON(),
      api_key: '***' + api_key.slice(-4),
      api_secret: '***' + api_secret.slice(-4)
    };

    logger.info(`Yeni bağlantı oluşturuldu. ID: ${connection.id}, Kullanıcı: ${user.id}`);
    res.status(201).json({
      success: true,
      message: 'Bağlantı başarıyla oluşturuldu',
      data: maskedConnection
    });
  } catch (error) {
    logger.error('Bağlantı oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bağlantı oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// Bağlantıyı güncelle
const updateConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const { marketplace_name, store_name, api_key, api_secret, status, additional_config } = req.body;
    const { user } = req;

    const connection = await MarketplaceConnection.findByPk(id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Bağlantı bulunamadı'
      });
    }

    // Kullanıcı sadece kendi bağlantılarını güncelleyebilir (admin hariç)
    if (user.role !== 'admin' && connection.customer_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu bağlantıyı güncelleme izniniz yok'
      });
    }

    // Güncelleme verilerini hazırla
    const updateData = {};
    if (marketplace_name) updateData.marketplace_name = marketplace_name;
    if (store_name) updateData.store_name = store_name;
    if (status) updateData.status = status;
    if (additional_config !== undefined) updateData.additional_config = additional_config;

    // API anahtarları varsa şifrele
    if (api_key) {
      updateData.api_key = encryptApiKey(api_key);
    }
    if (api_secret) {
      updateData.api_secret = encryptApiKey(api_secret);
    }

    await connection.update(updateData);

    // API anahtarlarını maskele
    const maskedConnection = {
      ...connection.toJSON(),
      api_key: connection.api_key ? '***' + connection.api_key.slice(-4) : null,
      api_secret: connection.api_secret ? '***' + connection.api_secret.slice(-4) : null
    };

    logger.info(`Bağlantı güncellendi. ID: ${id}, Kullanıcı: ${user.id}`);
    res.json({
      success: true,
      message: 'Bağlantı başarıyla güncellendi',
      data: maskedConnection
    });
  } catch (error) {
    logger.error('Bağlantı güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bağlantı güncellenirken bir hata oluştu'
    });
  }
};

// Bağlantıyı sil
const deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const connection = await MarketplaceConnection.findByPk(id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Bağlantı bulunamadı'
      });
    }

    // Kullanıcı sadece kendi bağlantılarını silebilir (admin hariç)
    if (user.role !== 'admin' && connection.customer_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu bağlantıyı silme izniniz yok'
      });
    }

    await connection.destroy();

    logger.info(`Bağlantı silindi. ID: ${id}, Kullanıcı: ${user.id}`);
    res.json({
      success: true,
      message: 'Bağlantı başarıyla silindi'
    });
  } catch (error) {
    logger.error('Bağlantı silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bağlantı silinirken bir hata oluştu'
    });
  }
};

// Pazaryeri türlerini getir
const getMarketplaceTypes = async (req, res) => {
  try {
    const marketplaceTypes = [
      { value: 'trendyol', label: 'Trendyol' },
      { value: 'hepsiburada', label: 'Hepsiburada' },
      { value: 'n11', label: 'N11' },
      { value: 'amazon', label: 'Amazon' },
      { value: 'woocommerce', label: 'WooCommerce' }
    ];

    res.json({
      success: true,
      data: marketplaceTypes
    });
  } catch (error) {
    logger.error('Pazaryeri türleri getirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Pazaryeri türleri getirilirken bir hata oluştu'
    });
  }
};

// Bağlantıyı test et (yeni bağlantı için)
const testConnection = async (req, res) => {
  try {
    const { marketplace_name, store_name, api_key, api_secret, additional_config } = req.body;
    const { user } = req;

    // Validasyon
    if (!marketplace_name || !store_name || !api_key || !api_secret) {
      return res.status(400).json({
        success: false,
        message: 'Tüm zorunlu alanları doldurun'
      });
    }

    // Pazaryeri türüne göre test yap
    let testResult;
    switch (marketplace_name) {
      case 'trendyol':
        testResult = await testTrendyolConnection(api_key, api_secret, additional_config);
        break;
      case 'hepsiburada':
        testResult = await testHepsiburadaConnection(api_key, api_secret, additional_config);
        break;
      case 'n11':
        testResult = await testN11Connection(api_key, api_secret);
        break;
      case 'woocommerce':
        testResult = await testWooCommerceConnection(api_key, api_secret, additional_config);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Desteklenmeyen pazaryeri türü'
        });
    }

    if (testResult.success) {
      logger.info(`Bağlantı testi başarılı. Pazaryeri: ${marketplace_name}, Kullanıcı: ${user.id}`);
      res.json({
        success: true,
        message: `${marketplace_name} bağlantısı başarıyla test edildi`,
        data: testResult.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: testResult.message || 'Bağlantı testi başarısız'
      });
    }

  } catch (error) {
    logger.error('Bağlantı testi sırasında hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bağlantı testi sırasında bir hata oluştu',
      error: error.message
    });
  }
};

// Mevcut bağlantıyı test et
const testExistingConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const connection = await MarketplaceConnection.findByPk(id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Bağlantı bulunamadı'
      });
    }

    // Kullanıcı sadece kendi bağlantılarını test edebilir (admin hariç)
    if (user.role !== 'admin' && connection.customer_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu bağlantıyı test etme izniniz yok'
      });
    }

    // API anahtarlarını çöz
    const apiKey = decryptApiKey(connection.api_key);
    const apiSecret = decryptApiKey(connection.api_secret);

    // Pazaryeri türüne göre test yap
    let testResult;
    switch (connection.marketplace_name) {
      case 'trendyol':
        testResult = await testTrendyolConnection(apiKey, apiSecret, connection.additional_config);
        break;
      case 'hepsiburada':
        testResult = await testHepsiburadaConnection(apiKey, apiSecret, connection.additional_config);
        break;
      case 'n11':
        testResult = await testN11Connection(apiKey, apiSecret);
        break;
      case 'woocommerce':
        testResult = await testWooCommerceConnection(apiKey, apiSecret, connection.additional_config);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Desteklenmeyen pazaryeri türü'
        });
    }

    if (testResult.success) {
      logger.info(`Bağlantı testi başarılı. ID: ${id}, Kullanıcı: ${user.id}`);
      res.json({
        success: true,
        message: `${connection.marketplace_name} bağlantısı başarıyla test edildi`,
        data: testResult.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: testResult.message || 'Bağlantı testi başarısız'
      });
    }

  } catch (error) {
    logger.error('Bağlantı testi sırasında hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bağlantı testi sırasında bir hata oluştu',
      error: error.message
    });
  }
};

// Trendyol bağlantısını test et
const testTrendyolConnection = async (apiKey, apiSecret, additionalConfig) => {
  try {
    // Mock test - gerçek uygulamada Trendyol API'sine istek atılır
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş gecikme
    
    // Başarılı test sonucu
    return {
      success: true,
      data: {
        supplier_id: apiKey,
        store_name: 'Test Mağaza',
        product_count: 150
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Trendyol API bağlantısı başarısız: ' + error.message
    };
  }
};

// Hepsiburada bağlantısını test et
const testHepsiburadaConnection = async (merchantId, username, password) => {
  try {
    // Mock test - gerçek uygulamada Hepsiburada API'sine istek atılır
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş gecikme
    
    return {
      success: true,
      data: {
        merchant_id: merchantId,
        store_name: 'Test Mağaza',
        product_count: 200
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Hepsiburada API bağlantısı başarısız: ' + error.message
    };
  }
};

// N11 bağlantısını test et
const testN11Connection = async (appKey, appSecret) => {
  try {
    // Mock test - gerçek uygulamada N11 API'sine istek atılır
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş gecikme
    
    return {
      success: true,
      data: {
        app_key: appKey,
        store_name: 'Test Mağaza',
        product_count: 100
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'N11 API bağlantısı başarısız: ' + error.message
    };
  }
};

// WooCommerce bağlantısını test et
const testWooCommerceConnection = async (siteUrl, consumerKey, consumerSecret) => {
  try {
    // Mock test - gerçek uygulamada WooCommerce API'sine istek atılır
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş gecikme
    
    return {
      success: true,
      data: {
        site_url: siteUrl,
        store_name: 'Test Mağaza',
        product_count: 300
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'WooCommerce API bağlantısı başarısız: ' + error.message
    };
  }
};

module.exports = {
  getAllConnections,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection,
  getMarketplaceTypes,
  testConnection,
  testExistingConnection
}; 
 