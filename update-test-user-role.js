const { Customer } = require('./models');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

async function updateTestUserRole() {
  try {
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

    // Update role to admin
    await testUser.update({ role: 'admin' });

    console.log('Test user role updated to admin successfully');
    console.log('User:', testUser.email);
    console.log('Role:', testUser.role);

  } catch (error) {
    console.error('Error updating test user role:', error);
  }
}

updateTestUserRole(); 
 