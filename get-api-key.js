const { Customer } = require('./models');
const { testConnection } = require('./config/database');

async function getApiKey() {
  try {
    await testConnection();
    const user = await Customer.findOne({ where: { email: 'test@example.com' } });
    console.log('API Key:', user.api_key);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

getApiKey(); 