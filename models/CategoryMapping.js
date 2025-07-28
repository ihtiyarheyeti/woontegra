const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CategoryMapping = sequelize.define('CategoryMapping', {
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
  woo_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  trendyol_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  woo_category_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  trendyol_category_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'category_mappings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      name: 'unique_mapping',
      fields: ['customer_id', 'woo_category_id', 'trendyol_category_id']
    }
  ]
});

module.exports = CategoryMapping; 