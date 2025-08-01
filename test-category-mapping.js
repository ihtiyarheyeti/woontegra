const axios = require('axios');
const { Customer } = require('./models');
const { testConnection } = require('./config/database');

async function testCategoryMapping() {
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

    // JWT token oluştur (basit test için)
    const token = 'test-token'; // Gerçek uygulamada JWT.sign kullanılır

    // API endpoint'lerini test et
    const baseURL = 'http://localhost:3001/api';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🔍 Testing Trendyol Categories API...');
    try {
      const trendyolResponse = await axios.get(`${baseURL}/category-mappings/trendyol-categories`, { headers });
      console.log('✅ Trendyol Categories API Response:', {
        success: trendyolResponse.data.success,
        categoriesCount: trendyolResponse.data.data?.length || 0
      });
    } catch (error) {
      console.log('❌ Trendyol Categories API Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🔍 Testing WooCommerce Categories API...');
    try {
      const wooResponse = await axios.get(`${baseURL}/category-mappings/woo-categories`, { headers });
      console.log('✅ WooCommerce Categories API Response:', {
        success: wooResponse.data.success,
        categoriesCount: wooResponse.data.data?.length || 0
      });
    } catch (error) {
      console.log('❌ WooCommerce Categories API Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🔍 Testing Category Mappings API...');
    try {
      const mappingsResponse = await axios.get(`${baseURL}/category-mappings`, { headers });
      console.log('✅ Category Mappings API Response:', {
        success: mappingsResponse.data.success,
        mappingsCount: mappingsResponse.data.data?.length || 0
      });
    } catch (error) {
      console.log('❌ Category Mappings API Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test'i çalıştır
testCategoryMapping(); 