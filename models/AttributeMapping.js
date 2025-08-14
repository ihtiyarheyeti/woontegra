const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttributeMapping = sequelize.define('AttributeMapping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  source_attribute: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target_attribute: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source_value: {
    type: DataTypes.STRING,
    allowNull: true
  },
  target_value: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mapping_type: {
    type: DataTypes.ENUM('direct', 'transform', 'conditional'),
    defaultValue: 'direct'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'attribute_mappings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AttributeMapping;
