const { Customer } = require('./models');
const { testConnection } = require('./config/database');

async function updateTestUser() {
  try {
    // Test database connection
    await testConnection();
    console.log('Database connection successful');

    // Find test user
    const testUser = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      console.log('Test user not found');
      return;
    }

    // Update user name
    await testUser.update({
      name: 'Test Müşteri'
    });

    console.log('Test user updated successfully:', testUser.email);
    console.log('New name:', testUser.name);
  } catch (error) {
    console.error('Error updating test user:', error);
  } finally {
    process.exit(0);
  }
}

updateTestUser(); 