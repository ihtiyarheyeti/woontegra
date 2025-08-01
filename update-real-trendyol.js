const { sequelize } = require('./config/database');
const { Customer } = require('./models');
const logger = require('./utils/logger');

async function updateRealTrendyol() {
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

    // Kullanıcıdan gerçek bilgileri al
    logger.info('\n🔧 Please enter your real Trendyol credentials:');
    logger.info('(Leave empty to keep current value)');

    // Gerçek Trendyol bilgileri
    const newAppKey = 'CVn4MItx2ORADdD5VLZI'; // API Key
    const newAppSecret = 'btLhur2HrPmhKjXC0Fz9'; // API Secret
    const newSupplierId = '113278'; // Satıcı ID
    const newSellerId = '113278'; // Seller ID
    const newToken = 'Q1ZuNE1JdHgyT1JBRGRENVZMWkk6YnRMaHVyMkhyUG1oS2pYQzBGejk='; // Token

    // Sadece boş olmayan değerleri güncelle
    const updateData = {};
    
    // Tüm bilgileri güncelle
    updateData.trendyol_app_key = newAppKey;
    updateData.trendyol_app_secret = newAppSecret;
    updateData.trendyol_supplier_id = newSupplierId;
    updateData.trendyol_seller_id = newSellerId;
    updateData.trendyol_token = newToken;

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
      logger.info('✅ Trendyol credentials updated!');
    } else {
      logger.info('ℹ️ No changes made - please update the script with real credentials');
    }

    // Güncellenmiş bilgileri göster
    const updatedUser = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    logger.info('\n📋 Updated Trendyol Info:');
    logger.info(`  App Key: ${updatedUser.trendyol_app_key}`);
    logger.info(`  App Secret: ${updatedUser.trendyol_app_secret}`);
    logger.info(`  Supplier ID: ${updatedUser.trendyol_supplier_id}`);
    logger.info(`  Seller ID: ${updatedUser.trendyol_seller_id}`);
    logger.info(`  Token: ${updatedUser.trendyol_token}`);

  } catch (error) {
    logger.error('❌ Error updating Trendyol info:', error);
  } finally {
    await sequelize.close();
  }
}

updateRealTrendyol(); 