const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Package Model
 * Paket bilgilerini saklar
 */
const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Paket adı (Başlangıç, Standart, Pro)'
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Paket slug (baslangic, standart, pro)'
  },
  max_products: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    comment: 'Maksimum ürün sayısı'
  },
  max_integrations: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Maksimum entegrasyon sayısı'
  },
  max_users: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: 'Maksimum kullanıcı sayısı'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Paket fiyatı (aylık)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Paket açıklaması'
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Paket özellikleri (array)',
    get() {
      const rawValue = this.getDataValue('features');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('features', JSON.stringify(value || []));
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Paket aktif mi?'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Sıralama sırası'
  }
}, {
  tableName: 'packages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Paketler tablosu',
  indexes: [
    {
      unique: true,
      fields: ['slug']
    }
  ]
});

module.exports = Package; 