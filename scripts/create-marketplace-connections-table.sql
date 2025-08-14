-- Marketplace Connections Table for storing API credentials
-- Bu tablo farklı marketplace'lerin API bağlantı bilgilerini saklar

CREATE TABLE IF NOT EXISTS marketplace_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  marketplace VARCHAR(64) NOT NULL UNIQUE COMMENT 'Marketplace adı (trendyol, hepsiburada, vb.)',
  supplier_id VARCHAR(191) COMMENT 'Supplier ID (Trendyol için)',
  app_key VARCHAR(512) COMMENT 'API Key/App Key',
  app_secret VARCHAR(512) COMMENT 'API Secret/App Secret',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Oluşturulma tarihi',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Güncellenme tarihi',
  
  INDEX idx_marketplace (marketplace) COMMENT 'Marketplace araması için index',
  INDEX idx_updated_at (updated_at) COMMENT 'Güncelleme tarihi için index'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Marketplace API bağlantı bilgileri tablosu';

-- Örnek veri ekleme (opsiyonel)
-- INSERT INTO marketplace_connections (marketplace, supplier_id, app_key, app_secret) VALUES 
-- ('trendyol', '113278', 'CVn4...', 'btLh...'),
-- ('hepsiburada', NULL, 'hb_key...', 'hb_secret...');

-- Tablo yapısını kontrol etme
-- DESCRIBE marketplace_connections;

-- Mevcut bağlantıları görüntüleme (maskelenmiş)
-- SELECT 
--   marketplace,
--   supplier_id,
--   CONCAT(LEFT(app_key, 3), '***', RIGHT(app_key, 2)) as app_key_masked,
--   CONCAT(LEFT(app_secret, 3), '***', RIGHT(app_secret, 2)) as app_secret_masked,
--   updated_at
-- FROM marketplace_connections 
-- ORDER BY updated_at DESC;
