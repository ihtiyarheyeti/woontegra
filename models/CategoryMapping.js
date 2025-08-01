const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CategoryMapping = sequelize.define('CategoryMapping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  local_category_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'WooCommerce kategorisinin ID\'si'
  },
  local_category_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'WooCommerce kategori adı'
  },
  marketplace: {
    type: DataTypes.ENUM('trendyol', 'hepsiburada', 'n11', 'ciceksepeti', 'pazarama'),
    allowNull: false,
    defaultValue: 'trendyol',
    comment: 'Pazaryeri adı'
  },
  marketplace_category_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Pazaryeri kategori ID'
  },
  marketplace_category_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Pazaryeri kategori adı'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Eşleşmenin aktif olup olmadığı'
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
  tableName: 'category_mappings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id', 'customer_id']
    },
    {
      fields: ['local_category_id', 'marketplace']
    },
    {
      fields: ['marketplace_category_id']
    }
  ]
});

module.exports = CategoryMapping; 