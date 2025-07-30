const { Customer, Category, Brand, Tenant, Package } = require('./models');
const bcrypt = require('bcryptjs');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

async function createTestData() {
  try {
    // Test database connection
    await testConnection();
    console.log('Database connection successful');

    // Create test package if not exists
    let package = await Package.findOne({
      where: { name: 'Basic Package' }
    });

    if (!package) {
      package = await Package.create({
        name: 'Basic Package',
        slug: 'basic',
        max_products: 1000,
        max_integrations: 5,
        max_users: 5,
        price: 0.00,
        description: 'Temel paket - ücretsiz',
        features: ['basic_sync', 'basic_reports'],
        is_active: true,
        sort_order: 1
      });
      console.log('Test package created:', package.name);
    }

    // Create test tenant if not exists
    let tenant = await Tenant.findOne({
      where: { name: 'Test Tenant' }
    });

    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Test Tenant',
        slug: 'test-tenant',
        company_name: 'Test Company',
        email: 'test@company.com',
        phone: '+90 555 123 4567',
        status: 'active',
        package_id: package.id,
        plan: 'basic',
        max_users: 5,
        max_connections: 10
      });
      console.log('Test tenant created:', tenant.name);
    }

    // Create test customer if not exists
    let customer = await Customer.findOne({
      where: { email: 'test@example.com' }
    });

    if (!customer) {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);

      customer = await Customer.create({
        tenant_id: tenant.id,
        name: 'Test Admin',
        email: 'test@example.com',
        password: hashedPassword,
        api_key: `test-api-key-${Date.now()}`,
        role: 'admin',
        woo_consumer_key: 'ck_test_consumer_key_12345',
        woo_consumer_secret: 'cs_test_consumer_secret_12345',
        woo_store_url: 'https://example.com',
        trendyol_app_key: 'test_app_key',
        trendyol_app_secret: 'test_app_secret',
        trendyol_supplier_id: 'test_supplier_id',
        // Yeni pazaryeri bağlantı alanları
        trendyol_seller_id: 'test_seller_id_12345',
        trendyol_integration_code: 'test_integration_code_67890',
        trendyol_api_key: 'test_trendyol_api_key_abcdef',
        trendyol_api_secret: 'test_trendyol_api_secret_ghijkl',
        trendyol_token: 'test_trendyol_token_mnopqr',
        hepsiburada_api_key: 'test_hepsiburada_api_key',
        hepsiburada_api_secret: 'test_hepsiburada_api_secret',
        hepsiburada_merchant_id: 'test_merchant_id',
        n11_app_key: 'test_n11_app_key_12345',
        n11_app_secret: 'test_n11_app_secret_67890',
        ciceksepeti_dealer_code: 'test_dealer_code_12345',
        ciceksepeti_api_key: 'test_ciceksepeti_api_key_67890',
        ciceksepeti_secret_key: 'test_ciceksepeti_secret_key_abcdef',
        pazarama_merchant_id: 'test_pazarama_merchant_id_12345',
        pazarama_api_key: 'test_pazarama_api_key_67890',
        pazarama_secret_key: 'test_pazarama_secret_key_abcdef',
        is_active: true
      });
      console.log('Test customer created:', customer.email);
    }

    // Create test categories
    const categories = [
      { name: 'Elektronik', description: 'Elektronik ürünler' },
      { name: 'Giyim', description: 'Giyim ürünleri' },
      { name: 'Ev & Yaşam', description: 'Ev ve yaşam ürünleri' },
      { name: 'Spor', description: 'Spor ürünleri' }
    ];

    for (const catData of categories) {
      const existingCategory = await Category.findOne({
        where: { 
          name: catData.name,
          tenant_id: tenant.id
        }
      });

      if (!existingCategory) {
        await Category.create({
          tenant_id: tenant.id,
          name: catData.name,
          description: catData.description,
          is_active: true
        });
        console.log(`Category created: ${catData.name}`);
      }
    }

    // Create test brands
    const brands = [
      { name: 'Apple', description: 'Apple Inc.' },
      { name: 'Samsung', description: 'Samsung Electronics' },
      { name: 'Nike', description: 'Nike Inc.' },
      { name: 'Adidas', description: 'Adidas AG' }
    ];

    for (const brandData of brands) {
      const existingBrand = await Brand.findOne({
        where: { 
          name: brandData.name,
          tenant_id: tenant.id
        }
      });

      if (!existingBrand) {
        await Brand.create({
          tenant_id: tenant.id,
          name: brandData.name,
          description: brandData.description,
          is_active: true
        });
        console.log(`Brand created: ${brandData.name}`);
      }
    }

    console.log('\nTest data creation completed!');
    console.log('Login credentials:');
    console.log('Email: test@example.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createTestData(); 