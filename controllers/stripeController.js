const Tenant = require('../models/Tenant');
const { 
  stripe,
  createStripeCustomer, 
  createCheckoutSession, 
  getSubscription, 
  cancelSubscription,
  STRIPE_PLANS 
} = require('../config/stripe');
const logger = require('../utils/logger');

class StripeController {
  // Checkout session oluştur
  async createCheckout(req, res) {
    try {
      const { tenant_id, plan } = req.body;
      const { id: userId, role } = req.user;

      // Admin kontrolü
      if (role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Bu işlem için admin yetkisi gerekli' 
        });
      }

      // Tenant'ı bul
      const tenant = await Tenant.findByPk(tenant_id);
      if (!tenant) {
        return res.status(404).json({ 
          success: false, 
          message: 'Kiracı bulunamadı' 
        });
      }

      // Plan kontrolü
      if (!STRIPE_PLANS[plan]) {
        return res.status(400).json({ 
          success: false, 
          message: 'Geçersiz plan' 
        });
      }

      // Stripe müşteri oluştur (eğer yoksa)
      if (!tenant.stripe_customer_id) {
        const stripeCustomer = await createStripeCustomer(tenant);
        await tenant.update({ 
          stripe_customer_id: stripeCustomer.id 
        });
      }

      // Checkout session oluştur
      const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/cancel`;

      const session = await createCheckoutSession(tenant, plan, successUrl, cancelUrl);

      logger.info(`Checkout session created for tenant ${tenant_id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Checkout session oluşturuldu',
        data: {
          session_id: session.id,
          checkout_url: session.url
        }
      });

    } catch (error) {
      logger.error('Error creating checkout session:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Checkout session oluşturulurken hata oluştu' 
      });
    }
  }

  // Webhook işleme
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handling failed' });
    }
  }

  // Checkout tamamlandı
  async handleCheckoutCompleted(session) {
    const tenantId = session.metadata.tenant_id;
    const plan = session.metadata.plan;

    const tenant = await Tenant.findByPk(tenantId);
    if (tenant) {
      await tenant.update({
        plan: plan,
        status: 'active',
        subscription_status: 'active'
      });
      logger.info(`Tenant ${tenantId} activated with plan ${plan}`);
    }
  }

  // Abonelik oluşturuldu
  async handleSubscriptionCreated(subscription) {
    const tenant = await Tenant.findOne({ 
      where: { stripe_customer_id: subscription.customer } 
    });
    
    if (tenant) {
      await tenant.update({
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        plan_expiry: new Date(subscription.current_period_end * 1000)
      });
      logger.info(`Subscription created for tenant ${tenant.id}`);
    }
  }

  // Abonelik güncellendi
  async handleSubscriptionUpdated(subscription) {
    const tenant = await Tenant.findOne({ 
      where: { stripe_customer_id: subscription.customer } 
    });
    
    if (tenant) {
      await tenant.update({
        subscription_status: subscription.status,
        plan_expiry: new Date(subscription.current_period_end * 1000)
      });
      logger.info(`Subscription updated for tenant ${tenant.id}`);
    }
  }

  // Abonelik silindi
  async handleSubscriptionDeleted(subscription) {
    const tenant = await Tenant.findOne({ 
      where: { stripe_customer_id: subscription.customer } 
    });
    
    if (tenant) {
      await tenant.update({
        subscription_status: 'canceled',
        status: 'suspended'
      });
      logger.info(`Subscription canceled for tenant ${tenant.id}`);
    }
  }

  // Ödeme başarılı
  async handlePaymentSucceeded(invoice) {
    const tenant = await Tenant.findOne({ 
      where: { stripe_customer_id: invoice.customer } 
    });
    
    if (tenant) {
      await tenant.update({
        status: 'active',
        subscription_status: 'active'
      });
      logger.info(`Payment succeeded for tenant ${tenant.id}`);
    }
  }

  // Ödeme başarısız
  async handlePaymentFailed(invoice) {
    const tenant = await Tenant.findOne({ 
      where: { stripe_customer_id: invoice.customer } 
    });
    
    if (tenant) {
      await tenant.update({
        subscription_status: 'past_due',
        status: 'suspended'
      });
      logger.info(`Payment failed for tenant ${tenant.id}`);
    }
  }

  // Abonelik durumunu kontrol et
  async getSubscriptionStatus(req, res) {
    try {
      const { tenant_id } = req.params;
      const { id: userId, role } = req.user;

      // Admin kontrolü
      if (role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Bu işlem için admin yetkisi gerekli' 
        });
      }

      const tenant = await Tenant.findByPk(tenant_id);
      if (!tenant) {
        return res.status(404).json({ 
          success: false, 
          message: 'Kiracı bulunamadı' 
        });
      }

      if (!tenant.subscription_id) {
        return res.json({
          success: true,
          data: {
            has_subscription: false,
            status: 'no_subscription'
          }
        });
      }

      const subscription = await getSubscription(tenant.subscription_id);

      res.json({
        success: true,
        data: {
          has_subscription: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end
          }
        }
      });

    } catch (error) {
      logger.error('Error getting subscription status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Abonelik durumu alınırken hata oluştu' 
      });
    }
  }

  // Aboneliği iptal et
  async cancelSubscription(req, res) {
    try {
      const { tenant_id } = req.params;
      const { id: userId, role } = req.user;

      // Admin kontrolü
      if (role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Bu işlem için admin yetkisi gerekli' 
        });
      }

      const tenant = await Tenant.findByPk(tenant_id);
      if (!tenant || !tenant.subscription_id) {
        return res.status(404).json({ 
          success: false, 
          message: 'Aktif abonelik bulunamadı' 
        });
      }

      await cancelSubscription(tenant.subscription_id);

      await tenant.update({
        subscription_status: 'canceled',
        status: 'suspended'
      });

      logger.info(`Subscription canceled for tenant ${tenant_id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Abonelik başarıyla iptal edildi'
      });

    } catch (error) {
      logger.error('Error canceling subscription:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Abonelik iptal edilirken hata oluştu' 
      });
    }
  }

  // Planları listele
  async getPlans(req, res) {
    try {
      const plans = Object.keys(STRIPE_PLANS).map(key => ({
        id: key,
        ...STRIPE_PLANS[key]
      }));

      res.json({
        success: true,
        data: plans
      });

    } catch (error) {
      logger.error('Error getting plans:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Planlar alınırken hata oluştu' 
      });
    }
  }
}

module.exports = new StripeController(); 