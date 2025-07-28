const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SyncLog = sequelize.define('SyncLog', {
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
  operation_type: {
    type: DataTypes.ENUM('product_sync', 'order_sync', 'stock_update', 'price_update'),
    allowNull: false
  },
  platform: {
    type: DataTypes.ENUM('woocommerce', 'trendyol'),
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('success', 'error', 'pending'),
    defaultValue: 'pending'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sync_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['operation_type']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = SyncLog; 