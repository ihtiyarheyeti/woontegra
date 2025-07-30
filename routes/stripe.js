const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Webhook endpoint (raw body gerekli)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

// Planları listele (herkese açık)
router.get('/plans', stripeController.getPlans);

// Checkout session oluştur (admin only)
router.post('/checkout', authenticateToken, requireAdmin, stripeController.createCheckout);

// Abonelik durumunu kontrol et (admin only)
router.get('/subscription/:tenant_id', authenticateToken, requireAdmin, stripeController.getSubscriptionStatus);

// Aboneliği iptal et (admin only)
router.post('/subscription/:tenant_id/cancel', authenticateToken, requireAdmin, stripeController.cancelSubscription);

module.exports = router; 