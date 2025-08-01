const { sequelize } = require('./config/database');
const { Customer } = require('./models');
const logger = require('./utils/logger');

async function updateUserTrendyol() {
  try {
    // Veritabanı bağlantısını test et
    await sequelize.authenticate();
    logger.info('✅ Database connection successful');

    // Test kullanıcısını bul
    const user = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      logger.error('❌ Test user not found');
      return;
    }

    logger.info(`✅ Test user found: ${user.email}`);

    // Trendyol bilgilerini güncelle
    await user.update({
      trendyol_app_key: 'SET', // Gerçek Trendyol App Key buraya gelecek
      trendyol_app_secret: 'SET', // Gerçek Trendyol App Secret buraya gelecek
      trendyol_supplier_id: 'SET', // Gerçek Trendyol Supplier ID buraya gelecek
      trendyol_seller_id: 'SET' // Gerçek Trendyol Seller ID buraya gelecek
    });

    logger.info('✅ Trendyol bilgileri güncellendi');
    logger.info('📋 Trendyol Info:');
    logger.info(`  App Key: ${user.trendyol_app_key}`);
    logger.info(`  App Secret: ${user.trendyol_app_secret}`);
    logger.info(`  Supplier ID: ${user.trendyol_supplier_id}`);
    logger.info(`  Seller ID: ${user.trendyol_seller_id}`);

    logger.info('🎯 Update completed successfully!');

  } catch (error) {
    logger.error('❌ Error updating Trendyol info:', error);
  } finally {
    await sequelize.close();
  }
}

updateUserTrendyol(); 