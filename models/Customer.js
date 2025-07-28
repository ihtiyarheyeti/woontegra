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
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'API anahtarı'
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    defaultValue: 'user',
    comment: 'Kullanıcı rolü'
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