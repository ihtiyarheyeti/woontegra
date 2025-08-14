const { DataTypes } = require('sequelize');
const sequelize = require('./index');

/**
 * Brand Model
 * Marka bilgilerini saklar
 */
const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Kiracı ID'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Marka adı'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Marka açıklaması'
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Marka logosu URL'
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Marka web sitesi'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Marka aktif mi?'
  }
}, {
  tableName: 'brands',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Markalar tablosu',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'name']
    }
  ]
});

module.exports = Brand; 