-- Marketplace Accounts tablosu oluşturma
CREATE TABLE IF NOT EXISTS `marketplace_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `marketplace` enum('trendyol','woocommerce') NOT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `api_secret` varchar(255) DEFAULT NULL,
  `supplier_id` varchar(100) DEFAULT NULL,
  `store_url` varchar(500) DEFAULT NULL,
  `consumer_key` varchar(255) DEFAULT NULL,
  `consumer_secret` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_sync` datetime DEFAULT NULL,
  `sync_status` enum('success','error','pending') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_marketplace` (`user_id`, `marketplace`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_marketplace` (`marketplace`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek veri ekleme
INSERT INTO `marketplace_accounts` (`user_id`, `marketplace`, `api_key`, `api_secret`, `supplier_id`, `is_active`) VALUES
(1, 'trendyol', 'test_api_key', 'test_api_secret', 'test_supplier_id', 1),
(1, 'woocommerce', NULL, NULL, NULL, 1);

-- Foreign key constraint ekleme
ALTER TABLE `marketplace_accounts`
ADD CONSTRAINT `fk_marketplace_accounts_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;
