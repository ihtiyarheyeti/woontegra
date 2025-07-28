const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
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
  woo_order_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  trendyol_order_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  order_number: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  customer_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  customer_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  customer_phone: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  billing_address: {
    type: DataTypes.JSON,
    allowNull: true
  },
  shipping_address: {
    type: DataTypes.JSON,
    allowNull: true
  },
  items: {
    type: DataTypes.JSON,
    allowNull: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  shipping_status: {
    type: DataTypes.ENUM('pending', 'shipped', 'delivered'),
    defaultValue: 'pending'
  },
  order_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['woo_order_id']
    },
    {
      fields: ['trendyol_order_id']
    },
    {
      fields: ['order_number']
    }
  ]
});

module.exports = Order; 