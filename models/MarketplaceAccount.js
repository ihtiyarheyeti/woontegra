const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketplaceAccount = sequelize.define('MarketplaceAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  marketplace: {
    type: DataTypes.ENUM('trendyol', 'woocommerce'),
    allowNull: false
  },
  api_key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  api_secret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  supplier_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  store_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  consumer_key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  consumer_secret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_sync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sync_status: {
    type: DataTypes.ENUM('success', 'error', 'pending'),
    defaultValue: 'pending'
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
  tableName: 'marketplace_accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'marketplace'],
      unique: true
    }
  ]
});

module.exports = MarketplaceAccount;
