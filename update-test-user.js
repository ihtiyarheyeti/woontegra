const { Customer } = require('./models');
const { testConnection } = require('./config/database');
const crypto = require('crypto');

async function updateTestUserApiKey() {
  try {
    await testConnection();
    
    // Test kullanıcısını bul
    const user = await Customer.findOne({ where: { email: 'test@example.com' } });
    
    if (!user) {
      console.log('Test kullanıcısı bulunamadı, oluşturuluyor...');
      const newUser = await Customer.create({
        name: 'Test User',
        email: 'test@example.com',
        api_key: `test-api-key-${Date.now()}`,
        role: 'admin',
        is_active: true
      });
      console.log('Yeni test kullanıcısı oluşturuldu:', newUser.api_key);
    } else {
      // API anahtarını güncelle
      const newApiKey = `test-api-key-${Date.now()}`;
      await user.update({ api_key: newApiKey });
      console.log('API anahtarı güncellendi:', newApiKey);
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    process.exit(0);
  }
}

updateTestUserApiKey(); 