const { Customer } = require('./models');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

async function updateRealWooCommerce() {
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
    console.log('Current WooCommerce settings:');
    console.log('Store URL:', user.woo_store_url);
    console.log('Consumer Key:', user.woo_consumer_key);
    console.log('Consumer Secret:', user.woo_consumer_secret);

    console.log('\n🔧 Lütfen gerçek WooCommerce bilgilerinizi girin:');
    console.log('Örnek Store URL: https://your-store.com');
    console.log('Consumer Key ve Secret\'ı WooCommerce > Ayarlar > Gelişmiş > REST API\'den alabilirsiniz.');
    
    console.log('\n⚠️  Bu script sadece bilgi gösteriyor. Gerçek bilgileri manuel olarak güncellemeniz gerekiyor.');
    console.log('Veya bu scripti düzenleyip gerçek bilgilerinizi ekleyebilirsiniz.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

updateRealWooCommerce(); 