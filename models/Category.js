const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Category Model
 * Kategori bilgilerini saklar
 */
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Kategori adı'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Kategori açıklaması'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Kategori aktif mi?'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Ürün kategorileri tablosu'
});

module.exports = Category; 