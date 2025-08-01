const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductSyncMap = sequelize.define('ProductSyncMap', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  trendyol_product_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Trendyol ürün ID\'si'
  },
  woo_product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'WooCommerce ürün ID\'si'
  },
  sync_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('imported', 'updated', 'failed', 'deleted'),
    allowNull: false,
    defaultValue: 'imported'
  },
  sync_direction: {
    type: DataTypes.ENUM('trendyol_to_woo', 'woo_to_trendyol'),
    allowNull: false,
    defaultValue: 'trendyol_to_woo'
  },
  last_sync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'product_sync_map',
  timestamps: true,
  indexes: [
    {
      fields: ['customer_id']
    },
    {
      fields: ['trendyol_product_id']
    },
    {
      fields: ['woo_product_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['sync_date']
    }
  ]
});

module.exports = ProductSyncMap; 