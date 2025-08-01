const WooCommerceAPIClient = require('./services/WooCommerceAPIClient');
const { Customer } = require('./models');
const { testConnection } = require('./config/database');

async function testWooCommerceClient() {
  try {
    // Database bağlantısını test et
    await testConnection();
    console.log('✅ Database connection successful');

    // Test kullanıcısını bul
    const user = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('✅ Test user found:', user.email);
    console.log('🔍 WooCommerce Info:', {
      store_url: user.woo_store_url,
      consumer_key: user.woo_consumer_key ? 'SET' : 'NOT SET',
      consumer_secret: user.woo_consumer_secret ? 'SET' : 'NOT SET'
    });

    // WooCommerceAPIClient'ı test et
    const wooClient = new WooCommerceAPIClient(user);
    
    console.log('\n🔍 Testing WooCommerce Categories...');
    try {
      const categories = await wooClient.getCategories();
      console.log('✅ WooCommerce Categories fetched successfully!');
      console.log('📊 Categories count:', categories.length);
      
      if (Array.isArray(categories) && categories.length > 0) {
        console.log('📋 First 3 categories:');
        categories.slice(0, 3).forEach((cat, index) => {
          console.log(`  ${index + 1}. ${cat.name} (ID: ${cat.id}, Count: ${cat.count})`);
        });
      } else {
        console.log('📋 Categories data:', typeof categories, categories);
      }
    } catch (error) {
      console.log('❌ WooCommerce Categories Error:', error.message);
      
      // Mock data kullanılıp kullanılmadığını kontrol et
      if (error.message.includes('mock')) {
        console.log('ℹ️ Using mock data for testing');
      }
    }

    console.log('\n🔍 Testing WooCommerce Connection...');
    try {
      const connectionTest = await wooClient.testConnection();
      console.log('✅ WooCommerce Connection Test:', connectionTest);
    } catch (error) {
      console.log('❌ WooCommerce Connection Test Error:', error.message);
    }

    console.log('\n🎯 WooCommerce Client Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test'i çalıştır
testWooCommerceClient(); 