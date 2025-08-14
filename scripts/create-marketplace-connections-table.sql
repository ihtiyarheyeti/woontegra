-- Marketplace Connections Table for storing API credentials
-- Bu tablo farklı marketplace'lerin API bağlantı bilgilerini saklar

CREATE TABLE IF NOT EXISTS marketplace_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL COMMENT 'Kiracı ID',
  customer_id INT NOT NULL COMMENT 'Müşteri ID',
  marketplace VARCHAR(64) NOT NULL COMMENT 'Marketplace adı (trendyol, hepsiburada, vb.)',
  supplier_id VARCHAR(191) COMMENT 'Supplier ID (Trendyol için)',
  app_key VARCHAR(512) COMMENT 'API Key/App Key',
  app_secret VARCHAR(512) COMMENT 'API Secret/App Secret',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Oluşturulma tarihi',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Güncellenme tarihi',
  
  UNIQUE KEY unique_marketplace_per_customer (tenant_id, customer_id, marketplace),
  INDEX idx_tenant_customer (tenant_id, customer_id) COMMENT 'Kiracı ve müşteri araması için index',
  INDEX idx_marketplace (marketplace) COMMENT 'Marketplace araması için index',
  INDEX idx_updated_at (updated_at) COMMENT 'Güncelleme tarihi için index',
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Marketplace API bağlantı bilgileri tablosu';

-- Mevcut tabloyu güncelleme (eğer varsa)
-- ALTER TABLE marketplace_connections 
-- ADD COLUMN tenant_id INT NOT NULL DEFAULT 1 COMMENT 'Kiracı ID' AFTER id,
-- ADD COLUMN customer_id INT NOT NULL DEFAULT 1 COMMENT 'Müşteri ID' AFTER tenant_id,
-- ADD UNIQUE KEY unique_marketplace_per_customer (tenant_id, customer_id, marketplace),
-- ADD INDEX idx_tenant_customer (tenant_id, customer_id),
-- ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
-- ADD FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Örnek veri ekleme (opsiyonel)
-- INSERT INTO marketplace_connections (tenant_id, customer_id, marketplace, supplier_id, app_key, app_secret) VALUES 
-- (1, 1, 'trendyol', '113278', 'CVn4...', 'btLh...'),
-- (1, 1, 'hepsiburada', NULL, 'hb_key...', 'hb_secret...');

-- Tablo yapısını kontrol etme
-- DESCRIBE marketplace_connections;

-- Mevcut bağlantıları görüntüleme (maskelenmiş)
-- SELECT 
--   t.name as tenant_name,
--   c.name as customer_name,
--   mc.marketplace,
--   mc.supplier_id,
--   CONCAT(LEFT(mc.app_key, 3), '***', RIGHT(mc.app_key, 2)) as app_key_masked,
--   CONCAT(LEFT(mc.app_secret, 3), '***', RIGHT(mc.app_secret, 2)) as app_secret_masked,
--   mc.updated_at
-- FROM marketplace_connections mc
-- JOIN tenants t ON mc.tenant_id = t.id
-- JOIN customers c ON mc.customer_id = c.id
-- ORDER BY mc.updated_at DESC;
