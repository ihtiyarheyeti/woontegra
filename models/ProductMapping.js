const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductMapping = sequelize.define('ProductMapping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  marketplace: {
    type: DataTypes.ENUM('trendyol', 'woocommerce'),
    allowNull: false
  },
  marketplace_product_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  marketplace_sku: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending', 'error'),
    defaultValue: 'pending'
  },
  sync_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'product_mappings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ProductMapping;
