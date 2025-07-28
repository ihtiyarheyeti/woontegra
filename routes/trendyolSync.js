const express = require('express');
const router = express.Router();
const trendyolSyncController = require('../controllers/trendyolSyncController');
const { authenticateToken, validateApiKey, requireUser } = require('../middleware/auth');

/**
 * Trendyol Sync Routes
 * Trendyol senkronizasyonu için API endpoint'leri
 */

// JWT veya API Key authentication (ikisinden biri yeterli)
const authenticate = (req, res, next) => {
  // Önce JWT token kontrol et
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }

  // JWT yoksa API key kontrol et
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    return validateApiKey(req, res, next);
  }

  // Hiçbiri yoksa hata döndür
  return res.status(401).json({
    success: false,
    message: 'Access token or API key required'
  });
};

// Tüm route'lar için authentication gerekli
router.use(authenticate);

// Trendyol'dan ürünleri senkronize et
router.post('/sync-products', requireUser, trendyolSyncController.syncProductsFromTrendyol);

// Trendyol senkronizasyon durumunu kontrol et
router.get('/status', requireUser, trendyolSyncController.getTrendyolSyncStatus);

// Trendyol ürünlerini listele
router.get('/products', requireUser, trendyolSyncController.getTrendyolProducts);

module.exports = router; 