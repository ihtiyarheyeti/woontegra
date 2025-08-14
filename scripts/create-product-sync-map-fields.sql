-- ProductSyncMap tablosuna yeni alanlar ekleme
ALTER TABLE `product_sync_map` 
ADD COLUMN `trendyol_category_id` INT NULL COMMENT 'Trendyol kategori ID\'si' AFTER `error_message`,
ADD COLUMN `supplier_address_id` INT NULL COMMENT 'Tedarikçi adres ID\'si' AFTER `trendyol_category_id`,
ADD COLUMN `shipping_provider_id` INT NULL COMMENT 'Kargo firması ID\'si' AFTER `supplier_address_id`,
ADD COLUMN `fixed_price_increase` DECIMAL(10,2) NULL DEFAULT 0 COMMENT 'Sabit fiyat artırımı (TL)' AFTER `shipping_provider_id`,
ADD COLUMN `percentage_price_increase` DECIMAL(5,2) NULL DEFAULT 0 COMMENT 'Yüzdelik fiyat artırımı (%)' AFTER `fixed_price_increase`,
ADD COLUMN `is_active` BOOLEAN NULL DEFAULT 1 COMMENT 'Eşleştirme aktif mi?' AFTER `percentage_price_increase`;

-- Yeni alanlar için index'ler oluştur
CREATE INDEX `idx_trendyol_category_id` ON `product_sync_map` (`trendyol_category_id`);
CREATE INDEX `idx_supplier_address_id` ON `product_sync_map` (`supplier_address_id`);
CREATE INDEX `idx_shipping_provider_id` ON `product_sync_map` (`shipping_provider_id`);
CREATE INDEX `idx_is_active` ON `product_sync_map` (`is_active`);

-- Örnek veri ekleme (opsiyonel)
-- UPDATE `product_sync_map` SET `is_active` = 1 WHERE `is_active` IS NULL;
