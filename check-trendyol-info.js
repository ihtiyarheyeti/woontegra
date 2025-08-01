const { sequelize } = require('./config/database');
const { Customer } = require('./models');
const logger = require('./utils/logger');

async function checkTrendyolInfo() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection successful');

    const user = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      logger.error('❌ Test user not found');
      return;
    }

    logger.info(`✅ Test user found: ${user.email}`);
    logger.info('📋 Current Trendyol Info:');
    logger.info(`  App Key: ${user.trendyol_app_key}`);
    logger.info(`  App Secret: ${user.trendyol_app_secret}`);
    logger.info(`  Supplier ID: ${user.trendyol_supplier_id}`);
    logger.info(`  Seller ID: ${user.trendyol_seller_id}`);

    // Bilgilerin gerçek olup olmadığını kontrol et
    const hasRealInfo = user.trendyol_app_key && 
                       user.trendyol_app_secret && 
                       user.trendyol_supplier_id && 
                       user.trendyol_seller_id &&
                       user.trendyol_app_key !== 'SET' &&
                       user.trendyol_app_secret !== 'SET' &&
                       user.trendyol_supplier_id !== 'SET' &&
                       user.trendyol_seller_id !== 'SET';

    if (hasRealInfo) {
      logger.info('✅ Real Trendyol credentials found!');
    } else {
      logger.warn('⚠️ Using placeholder credentials (SET)');
    }

  } catch (error) {
    logger.error('❌ Error checking Trendyol info:', error);
  } finally {
    await sequelize.close();
  }
}

checkTrendyolInfo(); 