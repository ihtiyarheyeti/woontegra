const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * MarketplaceConnection Model
 * Kullanıcıların pazaryeri bağlantılarını saklar
 */
const MarketplaceConnection = sequelize.define('MarketplaceConnection', {
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
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Bağlantıyı oluşturan kullanıcının ID\'si'
  },
  marketplace_name: {
    type: DataTypes.ENUM('trendyol', 'hepsiburada', 'n11', 'amazon', 'woocommerce'),
    allowNull: false,
    comment: 'Pazaryeri adı'
  },
  store_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Mağaza adı'
  },
  api_key: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'API anahtarı (şifrelenmiş olarak saklanacak)'
  },
  api_secret: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'API gizli anahtarı (şifrelenmiş olarak saklanacak)'
  },
  status: {
    type: DataTypes.ENUM('active', 'passive'),
    defaultValue: 'active',
    comment: 'Bağlantı durumu'
  },
  additional_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Ek yapılandırma bilgileri (URL, port, vb.)'
  }
}, {
  tableName: 'marketplace_connections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Pazaryeri bağlantıları tablosu'
});

module.exports = MarketplaceConnection; 
 