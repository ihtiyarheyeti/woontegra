const { Customer, Tenant, Package } = require('./models');
const { testConnection } = require('./config/database');
const bcrypt = require('bcryptjs');

async function checkUser() {
  try {
    await testConnection();
    console.log('Database connection successful');

    // Find the test user
    const user = await Customer.findOne({
      where: { email: 'test@example.com' },
      include: [{
        model: Tenant,
        as: 'tenant'
      }]
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('✅ User found:');
    console.log('ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Is Active:', user.is_active);
    console.log('Tenant ID:', user.tenant_id);
    console.log('Tenant Name:', user.tenant?.name);
    console.log('Password Hash:', user.password.substring(0, 20) + '...');

    // Test password
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log('Password Test Result:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    // Create a new hash for comparison
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('New Hash:', newHash.substring(0, 20) + '...');
    console.log('Hashes Match:', user.password === newHash ? 'Yes' : 'No');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUser(); 