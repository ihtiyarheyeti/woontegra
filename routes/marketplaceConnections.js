const express = require('express');
const router = express.Router();
const marketplaceConnectionController = require('../controllers/marketplaceConnectionController');
const { authenticateToken, validateApiKey, requireUser } = require('../middleware/auth');

/**
 * Marketplace Connections Routes
 * Pazaryeri bağlantıları için API endpoint'leri
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

// Pazaryeri türlerini getir
router.get('/types', requireUser, marketplaceConnectionController.getMarketplaceTypes);

// Tüm bağlantıları listele
router.get('/', requireUser, marketplaceConnectionController.getAllConnections);

// Belirli bir bağlantıyı getir
router.get('/:id', requireUser, marketplaceConnectionController.getConnectionById);

// Yeni bağlantı oluştur
router.post('/', requireUser, marketplaceConnectionController.createConnection);

// Bağlantıyı güncelle
router.put('/:id', requireUser, marketplaceConnectionController.updateConnection);

// Bağlantıyı sil
router.delete('/:id', requireUser, marketplaceConnectionController.deleteConnection);

module.exports = router; 