const sequelize = require('../models/index');

(async ()=>{
  try {
    await sequelize.authenticate();
    console.log('✅ DB bağlantısı başarılı');
    process.exit(0);
  } catch (e) {
    console.error('❌ DB bağlantı hatası:', e.message || e);
    process.exit(1);
  }
})();
