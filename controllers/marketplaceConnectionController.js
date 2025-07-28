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

module.exports = {
  getAllConnections,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection,
  getMarketplaceTypes
}; 