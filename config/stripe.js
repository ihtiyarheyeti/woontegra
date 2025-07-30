const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');
const logger = require('../utils/logger');

// Stripe planları
const STRIPE_PLANS = {
  basic: {
    name: 'Temel Plan',
    price_id: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    max_users: 5,
    max_connections: 10,
    price: 29.99
  },
  premium: {
    name: 'Premium Plan',
    price_id: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    max_users: 20,
    max_connections: 50,
    price: 79.99
  },
  enterprise: {
    name: 'Kurumsal Plan',
    price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    max_users: 100,
    max_connections: 200,
    price: 199.99
  }
};

// Stripe müşteri oluştur
async function createStripeCustomer(tenant) {
  try {
    const customer = await stripe.customers.create({
      name: tenant.name,
      metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug
      }
    });
    
    logger.info(`Stripe customer created for tenant ${tenant.id}: ${customer.id}`);
    return customer;
  } catch (error) {
    logger.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Stripe checkout session oluştur
async function createCheckoutSession(tenant, plan, successUrl, cancelUrl) {
  try {
    const planConfig = STRIPE_PLANS[plan];
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: tenant.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenant_id: tenant.id,
        plan: plan
      }
    });

    logger.info(`Checkout session created for tenant ${tenant.id}: ${session.id}`);
    return session;
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
}

// Abonelik durumunu kontrol et
async function getSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    logger.error('Error retrieving subscription:', error);
    throw error;
  }
}

// Aboneliği iptal et
async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    logger.info(`Subscription canceled: ${subscriptionId}`);
    return subscription;
  } catch (error) {
    logger.error('Error canceling subscription:', error);
    throw error;
  }
}

module.exports = {
  stripe,
  STRIPE_PLANS,
  createStripeCustomer,
  createCheckoutSession,
  getSubscription,
  cancelSubscription
}; 