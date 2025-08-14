-- Category Mappings Table for WooCommerce to Trendyol Integration
-- Bu tablo WooCommerce ve Trendyol kategorileri arasındaki eşleştirmeleri saklar

CREATE TABLE IF NOT EXISTS category_mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  woo_category_id VARCHAR(255) NOT NULL COMMENT 'WooCommerce kategori ID',
  trendyol_category_id VARCHAR(255) NOT NULL COMMENT 'Trendyol kategori ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Oluşturulma tarihi',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Güncellenme tarihi',
  UNIQUE KEY unique_mapping (woo_category_id) COMMENT 'Her WooCommerce kategorisi için tek eşleştirme',
  INDEX idx_trendyol_category (trendyol_category_id) COMMENT 'Trendyol kategori araması için index',
  INDEX idx_created_at (created_at) COMMENT 'Tarih bazlı aramalar için index'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='WooCommerce-Trendyol kategori eşleştirme tablosu';

-- Örnek veri ekleme (opsiyonel)
-- INSERT INTO category_mappings (woo_category_id, trendyol_category_id) VALUES 
-- ('electronics', '368'),
-- ('clothing', '411'),
-- ('books', '123');

-- Tablo yapısını kontrol etme
-- DESCRIBE category_mappings;

-- Mevcut eşleştirmeleri görüntüleme
-- SELECT * FROM category_mappings ORDER BY created_at DESC;
