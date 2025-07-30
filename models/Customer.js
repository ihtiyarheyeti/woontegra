const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Customer Model
 * Müşteri bilgilerini saklar
 */
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Müşteri adı'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'E-posta adresi'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Şifre (bcrypt ile hashlenmiş)'
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Kiracı ID'
  },
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'API anahtarı'
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    allowNull: false,
    defaultValue: 'viewer',
    comment: 'Kullanıcı rolü (admin: tam yetki, editor: düzenleme, viewer: sadece görüntüleme)'
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Refresh token (JWT yenileme için)'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Son giriş tarihi'
  },
  login_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Giriş sayısı'
  },
  woo_consumer_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'WooCommerce Consumer Key'
  },
  woo_consumer_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'WooCommerce Consumer Secret'
  },
  woo_store_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'WooCommerce Store URL'
  },
  trendyol_app_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Trendyol App Key'
  },
  trendyol_app_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Trendyol App Secret'
  },
  trendyol_supplier_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Trendyol Supplier ID'
  },
  // Yeni pazaryeri bağlantı alanları
  trendyol_seller_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Trendyol Seller ID'
  },
  trendyol_integration_code: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Trendyol Integration Reference Code'
  },
  trendyol_api_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Trendyol API Key'
  },
  trendyol_api_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Trendyol API Secret'
  },
  trendyol_token: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Trendyol Access Token'
  },
  hepsiburada_api_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Hepsiburada API anahtarı'
  },
  hepsiburada_api_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Hepsiburada API gizli anahtarı'
  },
  hepsiburada_merchant_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Hepsiburada Merchant ID'
  },
  n11_app_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'N11 App Key'
  },
  n11_app_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'N11 App Secret'
  },
  ciceksepeti_dealer_code: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ÇiçekSepeti Dealer Code'
  },
  ciceksepeti_api_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ÇiçekSepeti API Key'
  },
  ciceksepeti_secret_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ÇiçekSepeti Secret Key'
  },
  pazarama_merchant_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Pazarama Merchant ID'
  },
  pazarama_api_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Pazarama API Key'
  },
  pazarama_secret_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Pazarama Secret Key'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Müşteri aktif mi?'
  }
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Müşteriler tablosu'
});

module.exports = Customer; 