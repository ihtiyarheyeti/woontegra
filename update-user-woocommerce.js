const { Customer } = require('./models');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

async function updateUserWooCommerce() {
  try {
    await testConnection();
    console.log('Database connection successful');

    // Find the test user
    const user = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('✅ User found:', user.email);

    // Update WooCommerce connection details
    await user.update({
      woo_store_url: 'https://test-store.com',
      woo_consumer_key: 'ck_test_key',
      woo_consumer_secret: 'cs_test_secret'
    });

    console.log('✅ WooCommerce connection details updated successfully');
    console.log('Store URL:', 'https://test-store.com');
    console.log('Consumer Key:', 'ck_test_key');
    console.log('Consumer Secret:', 'cs_test_secret');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

updateUserWooCommerce(); 