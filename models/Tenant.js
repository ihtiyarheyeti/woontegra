const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Kiracı ID'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Kiracı adı'
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Kiracı slug (URL için)'
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Şirket adı'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'İletişim e-posta adresi'
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'İletişim telefon numarası'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    comment: 'Kiracı durumu'
  },
  package_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Paket ID (foreign key)'
  },
  // Legacy fields (for backward compatibility)
  plan: {
    type: DataTypes.ENUM('basic', 'premium', 'enterprise'),
    defaultValue: 'basic',
    comment: 'Kiracı planı (legacy)'
  },
  max_users: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: 'Maksimum kullanıcı sayısı (legacy)'
  },
  max_connections: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Maksimum pazaryeri bağlantı sayısı (legacy)'
  },
  // Stripe subscription fields
  stripe_customer_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Stripe müşteri ID'
  },
  subscription_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Stripe abonelik ID'
  },
  subscription_status: {
    type: DataTypes.ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing'),
    allowNull: true,
    comment: 'Abonelik durumu'
  },
  plan_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Plan bitiş tarihi'
  },
  trial_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Deneme süresi bitiş tarihi'
  },
  settings: {
    type: DataTypes.JSON,
    comment: 'Kiracı ayarları'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Oluşturulma tarihi'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Güncellenme tarihi'
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Kiracılar tablosu'
});

module.exports = Tenant; 