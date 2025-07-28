const { Customer } = require('./models');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

async function createTestUser() {
  try {
    await testConnection();
    console.log('Database connection successful');

    // Check if test user already exists
    const existingUser = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Create test user with admin role
    const testUser = await Customer.create({
      name: 'Test Admin',
      email: 'test@example.com',
      api_key: `test-api-key-${Date.now()}`,
      role: 'admin', // Admin role
      woo_consumer_key: 'ck_test_key',
      woo_consumer_secret: 'cs_test_secret',
      woo_store_url: 'https://test-store.com',
      trendyol_app_key: 'test_app_key',
      trendyol_app_secret: 'test_app_secret',
      trendyol_supplier_id: 'test_supplier_id',
      is_active: true
    });

    console.log('Test user created successfully:', testUser.email);
    console.log('Login credentials:');
    console.log('Email:', testUser.email);
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser(); 