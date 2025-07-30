const { Customer, Tenant, Package } = require('./models');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    await testConnection();
    console.log('Database connection successful');

    // Check if test package exists, if not create one
    let testPackage = await Package.findOne({
      where: { name: 'Basic Package' }
    });

    if (!testPackage) {
      testPackage = await Package.create({
        name: 'Basic Package',
        slug: 'basic-package',
        description: 'Basic package for testing',
        price: 0,
        max_users: 10,
        max_connections: 5,
        features: JSON.stringify(['basic_sync', 'basic_reports']),
        is_active: true
      });
      console.log('Test package created successfully');
    }

    // Check if test tenant exists, if not create one
    let testTenant = await Tenant.findOne({
      where: { name: 'Test Tenant' }
    });

    if (!testTenant) {
      testTenant = await Tenant.create({
        name: 'Test Tenant',
        slug: 'test-tenant',
        company_name: 'Test Company',
        email: 'test@company.com',
        phone: '+905551234567',
        status: 'active',
        package_id: testPackage.id,
        plan: 'basic',
        max_users: 10,
        max_connections: 5
      });
      console.log('Test tenant created successfully');
    }

    // Check if test user already exists
    const existingUser = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('Test user already exists, updating password...');
      // Update password for existing user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await existingUser.update({
        password: hashedPassword
      });
      console.log('Test user password updated successfully');
    } else {
      // Create new test user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await Customer.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        tenant_id: testTenant.id,
        role: 'admin',
        is_active: true
      });
      console.log('Test user created successfully');
    }

    console.log('Login credentials:');
    console.log('Email: test@example.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
