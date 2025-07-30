const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Product Model
 * Ürün bilgilerini saklar
 */
const Product = sequelize.define('Product', {
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
    comment: 'Ürünü oluşturan kullanıcının ID\'si'
  },
  external_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Dış sistem ürün ID\'si'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Ürün adı'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ürün açıklaması'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Ürün fiyatı'
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Stok miktarı'
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Kategori ID'
  },
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Marka ID'
  },
  source_marketplace: {
    type: DataTypes.ENUM('trendyol', 'hepsiburada', 'n11', 'amazon', 'woocommerce', 'internal'),
    allowNull: false,
    defaultValue: 'internal',
    comment: 'Ürünün kaynak pazaryeri'
  },
  barcode: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Ürün barkodu'
  },
  seller_sku: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Satıcı SKU kodu'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Ürün görselleri (URL array)',
    get() {
      const rawValue = this.getDataValue('images');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('images', JSON.stringify(value || []));
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'draft'),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Ürün durumu'
  },
  seo_title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'SEO başlığı'
  },
  seo_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'SEO açıklaması'
  },
  variants: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Ürün varyantları',
    get() {
      const rawValue = this.getDataValue('variants');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('variants', JSON.stringify(value || []));
    }
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Ürünler tablosu',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'customer_id', 'barcode'],
      where: {
        barcode: {
          [Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['tenant_id', 'customer_id', 'seller_sku'],
      where: {
        seller_sku: {
          [Op.ne]: null
        }
      }
    }
  ]
});

module.exports = Product; 