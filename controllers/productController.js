const { Product, Category, Brand, Customer } = require('../models');
const logger = require('../utils/logger');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { sendToMarketplaces } = require('../services/marketplaceSendService');
const WooCommerceAPIClient = require('../services/WooCommerceAPIClient');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/xml', // .xml
      'text/xml' // .xml
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel, CSV, and XML files are allowed.'), false);
    }
  }
});

/**
 * Create new product with enhanced features
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      sku,
      barcode,
      status = 'active',
      description,
      category_id,
      brand_id,
      seo_title,
      seo_description,
      main_image,
      gallery_images = [],
      variants = []
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Ürün adı ve fiyat zorunludur'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fiyat 0\'dan büyük olmalıdır'
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stok adedi negatif olamaz'
      });
    }

    // Check if SKU already exists
    if (sku) {
      const existingSku = await Product.findOne({
        where: { 
          seller_sku: sku,
          tenant_id: req.user.tenant_id,
          customer_id: req.user.id
        }
      });

      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: 'Bu SKU kodu zaten kullanılıyor'
        });
      }
    }

    // Check if barcode already exists
    if (barcode) {
      const existingBarcode = await Product.findOne({
        where: { 
          barcode: barcode,
          tenant_id: req.user.tenant_id,
          customer_id: req.user.id
        }
      });

      if (existingBarcode) {
        return res.status(409).json({
          success: false,
          message: 'Bu barkod zaten kullanılıyor'
        });
      }
    }

    // Create product
    const product = await Product.create({
      tenant_id: req.user.tenant_id,
      customer_id: req.user.id,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category_id: category_id || null,
      barcode,
      seller_sku: sku,
      images: [main_image, ...gallery_images].filter(Boolean),
      status,
      source_marketplace: 'internal',
      // Additional fields for SEO
      seo_title: seo_title || name,
      seo_description: seo_description || description,
      brand_id: brand_id || null,
      variants: variants.length > 0 ? JSON.stringify(variants) : null
    });

    logger.info(`Product created: ${product.name} (ID: ${product.id}) by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product
    });

  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Bulk upload products from file
 * POST /api/products/bulk-upload
 */
const bulkUploadProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi'
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const isConfirm = req.body.confirm === 'true';

    let products = [];

    // Parse file based on extension
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      products = xlsx.utils.sheet_to_json(worksheet);
    } else if (fileExtension === '.csv') {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const product = {};
          headers.forEach((header, index) => {
            product[header] = values[index] || '';
          });
          products.push(product);
        }
      }
    } else if (fileExtension === '.xml') {
      // Basic XML parsing (you might want to use a proper XML parser)
      const fileContent = fs.readFileSync(filePath, 'utf8');
      // This is a simplified XML parser - in production, use a proper XML library
      const productMatches = fileContent.match(/<product>(.*?)<\/product>/gs);
      if (productMatches) {
        products = productMatches.map(match => {
          const nameMatch = match.match(/<name>(.*?)<\/name>/);
          const priceMatch = match.match(/<price>(.*?)<\/price>/);
          const stockMatch = match.match(/<stock>(.*?)<\/stock>/);
          const descriptionMatch = match.match(/<description>(.*?)<\/description>/);
          
          return {
            name: nameMatch ? nameMatch[1] : '',
            price: priceMatch ? parseFloat(priceMatch[1]) : 0,
            stock: stockMatch ? parseInt(stockMatch[1]) : 0,
            description: descriptionMatch ? descriptionMatch[1] : ''
          };
        });
      }
    }

    // Validate and clean data
    const validatedProducts = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const rowNumber = i + 2; // +2 because of header row and 0-based index

      // Basic validation
      if (!product.name || !product.price) {
        errors.push({
          row: rowNumber,
          error: 'Ürün adı ve fiyat zorunludur'
        });
        continue;
      }

      if (isNaN(product.price) || product.price <= 0) {
        errors.push({
          row: rowNumber,
          error: 'Geçersiz fiyat'
        });
        continue;
      }

      if (product.stock && (isNaN(product.stock) || product.stock < 0)) {
        errors.push({
          row: rowNumber,
          error: 'Geçersiz stok adedi'
        });
        continue;
      }

      // Clean and format data
      validatedProducts.push({
        name: product.name.toString().trim(),
        description: product.description ? product.description.toString().trim() : '',
        price: parseFloat(product.price),
        stock: product.stock ? parseInt(product.stock) : 0,
        sku: product.sku ? product.sku.toString().trim() : '',
        barcode: product.barcode ? product.barcode.toString().trim() : '',
        category: product.category ? product.category.toString().trim() : '',
        brand: product.brand ? product.brand.toString().trim() : '',
        status: product.status === 'inactive' ? 'inactive' : 'active',
        seo_title: product.seo_title ? product.seo_title.toString().trim() : '',
        seo_description: product.seo_description ? product.seo_description.toString().trim() : ''
      });
    }

    // If just preview, return the data
    if (!isConfirm) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return res.status(200).json({
        success: true,
        message: 'Dosya başarıyla işlendi',
        data: {
          preview: validatedProducts.slice(0, 10), // Show first 10 for preview
          total: validatedProducts.length,
          errors: errors.slice(0, 10) // Show first 10 errors
        }
      });
    }

    // If confirming, proceed with database insertion
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const productData of validatedProducts) {
      try {
        // Check for existing product by SKU or barcode
        let existingProduct = null;
        
        if (productData.sku) {
          existingProduct = await Product.findOne({
            where: {
              seller_sku: productData.sku,
              tenant_id: req.user.tenant_id,
              customer_id: req.user.id
            }
          });
        }

        if (!existingProduct && productData.barcode) {
          existingProduct = await Product.findOne({
            where: {
              barcode: productData.barcode,
              tenant_id: req.user.tenant_id,
              customer_id: req.user.id
            }
          });
        }

        if (existingProduct) {
          // Update existing product
          await existingProduct.update({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            stock: productData.stock,
            barcode: productData.barcode,
            seller_sku: productData.sku,
            status: productData.status,
            seo_title: productData.seo_title,
            seo_description: productData.seo_description
          });
          results.updated++;
        } else {
          // Create new product
          await Product.create({
            tenant_id: req.user.tenant_id,
            customer_id: req.user.id,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            stock: productData.stock,
            barcode: productData.barcode,
            seller_sku: productData.sku,
            status: productData.status,
            source_marketplace: 'internal',
            seo_title: productData.seo_title,
            seo_description: productData.seo_description
          });
          results.imported++;
        }
      } catch (error) {
        results.errors.push({
          product: productData.name,
          error: error.message
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    logger.info(`Bulk upload completed: ${results.imported} imported, ${results.updated} updated, ${results.errors.length} errors`);

    res.status(200).json({
      success: true,
      message: 'Toplu yükleme tamamlandı',
      data: {
        imported: results.imported,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors
      }
    });

  } catch (error) {
    logger.error('Error in bulk upload:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Toplu yükleme sırasında hata oluştu',
      error: error.message
    });
  }
};

/**
 * Get all products with enhanced filtering
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      category_id, 
      brand_id,
      min_price,
      max_price,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {
      tenant_id: req.user.tenant_id,
      customer_id: req.user.id
    };

    if (status) {
      whereClause.status = status;
    }

    if (category_id) {
      whereClause.category_id = category_id;
    }

    if (brand_id) {
      whereClause.brand_id = brand_id;
    }

    if (min_price || max_price) {
      whereClause.price = {};
      if (min_price) whereClause.price[require('sequelize').Op.gte] = parseFloat(min_price);
      if (max_price) whereClause.price[require('sequelize').Op.lte] = parseFloat(max_price);
    }

    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } },
        { seller_sku: { [require('sequelize').Op.like]: `%${search}%` } },
        { barcode: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    // Validate sort parameters
    const allowedSortFields = ['name', 'price', 'stock', 'created_at', 'updated_at'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const finalSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const finalSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[finalSortBy, finalSortOrder]]
    });

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler getirilemedi',
      error: error.message
    });
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: {
        id: id,
        tenant_id: req.user.tenant_id,
        customer_id: req.user.id
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün getirilemedi',
      error: error.message
    });
  }
};

/**
 * Update product
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      stock,
      sku,
      barcode,
      status,
      description,
      category_id,
      brand_id,
      seo_title,
      seo_description,
      main_image,
      gallery_images,
      variants
    } = req.body;

    const product = await Product.findOne({
      where: {
        id: id,
        tenant_id: req.user.tenant_id,
        customer_id: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    // Check if SKU is being changed and if it already exists
    if (sku && sku !== product.seller_sku) {
      const existingSku = await Product.findOne({
        where: {
          seller_sku: sku,
          tenant_id: req.user.tenant_id,
          customer_id: req.user.id,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: 'Bu SKU kodu zaten kullanılıyor'
        });
      }
    }

    // Check if barcode is being changed and if it already exists
    if (barcode && barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({
        where: {
          barcode: barcode,
          tenant_id: req.user.tenant_id,
          customer_id: req.user.id,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingBarcode) {
        return res.status(409).json({
          success: false,
          message: 'Bu barkod zaten kullanılıyor'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (sku !== undefined) updateData.seller_sku = sku;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (status !== undefined) updateData.status = status;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (brand_id !== undefined) updateData.brand_id = brand_id;
    if (seo_title !== undefined) updateData.seo_title = seo_title;
    if (seo_description !== undefined) updateData.seo_description = seo_description;
    if (variants !== undefined) updateData.variants = JSON.stringify(variants);

    // Handle images
    if (main_image || gallery_images) {
      const currentImages = product.images || [];
      let newImages = currentImages;

      if (main_image) {
        // Replace first image with main image
        newImages[0] = main_image;
      }

      if (gallery_images) {
        // Add gallery images after main image
        newImages = [newImages[0], ...gallery_images].filter(Boolean);
      }

      updateData.images = newImages;
    }

    await product.update(updateData);

    logger.info(`Product updated: ${product.name} (ID: ${product.id}) by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: product
    });

  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün güncellenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Delete product
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: {
        id: id,
        tenant_id: req.user.tenant_id,
        customer_id: req.user.id
      }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    await product.destroy();

    logger.info(`Product deleted: ${product.id} - ${product.name} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Ürün başarıyla silindi'
    });

  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün silinirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Get product statistics
 * GET /api/products/stats
 */
const getProductStats = async (req, res) => {
  try {
    const { Product } = require('../models');
    const { Op } = require('sequelize');
    const WooCommerceAPIClient = require('../services/WooCommerceAPIClient');

    const whereClause = {
      tenant_id: req.user.tenant_id,
      customer_id: req.user.id
    };

    // Get database product stats
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      draftProducts,
      totalValue,
      lowStockProducts
    ] = await Promise.all([
      Product.count({ where: whereClause }),
      Product.count({ where: { ...whereClause, status: 'active' } }),
      Product.count({ where: { ...whereClause, status: 'inactive' } }),
      Product.count({ where: { ...whereClause, status: 'draft' } }),
      Product.sum('price', { where: whereClause }),
      Product.count({ where: { ...whereClause, stock: { [Op.lt]: 10 } } })
    ]);

    // Get WooCommerce product count if user has WooCommerce connection
    let wooCommerceProductCount = 0;
    if (req.user.woo_store_url && req.user.woo_consumer_key && req.user.woo_consumer_secret) {
      try {
        logger.info(`🔗 WooCommerce API Client oluşturuluyor - Store URL: ${req.user.woo_store_url}`);
        
        const apiClient = new WooCommerceAPIClient(
          req.user.woo_store_url,
          req.user.woo_consumer_key,
          req.user.woo_consumer_secret
        );
        
        // Get total product count from WooCommerce
        logger.info('📦 WooCommerce\'dan ürün sayısı alınıyor...');
        const products = await apiClient.getProducts(1, 1, 'publish');
        
        if (products && Array.isArray(products)) {
          // WooCommerce API doesn't return total count directly, so we need to count all products
          let page = 1;
          let hasMoreProducts = true;
          let totalWooProducts = 0;
          
          while (hasMoreProducts) {
            const pageProducts = await apiClient.getProducts(page, 100, 'publish');
            if (pageProducts && pageProducts.length > 0) {
              totalWooProducts += pageProducts.length;
              logger.info(`📄 Sayfa ${page}: ${pageProducts.length} ürün sayıldı`);
              page++;
            } else {
              hasMoreProducts = false;
            }
          }
          
          wooCommerceProductCount = totalWooProducts;
          logger.info(`✅ WooCommerce ürün sayısı alındı: ${wooCommerceProductCount}`);
        }
      } catch (wooError) {
        logger.warn('⚠️ WooCommerce ürün sayısı alınamadı:', wooError.message);
        logger.warn('⚠️ WooCommerce bağlantı bilgileri:', {
          store_url: req.user.woo_store_url,
          has_consumer_key: !!req.user.woo_consumer_key,
          has_consumer_secret: !!req.user.woo_consumer_secret
        });
        // Continue without WooCommerce count
      }
    } else {
      logger.info('ℹ️ WooCommerce bağlantı bilgileri eksik, sadece veritabanı sayısı kullanılacak');
    }

    // Use the higher count between database and WooCommerce
    const finalTotalProducts = Math.max(totalProducts, wooCommerceProductCount);

    logger.info(`📊 İstatistik sonuçları:`, {
      databaseCount: totalProducts,
      wooCommerceCount: wooCommerceProductCount,
      finalTotal: finalTotalProducts
    });

    res.status(200).json({
      success: true,
      data: {
        total: finalTotalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        draft: draftProducts,
        totalValue: totalValue || 0,
        lowStock: lowStockProducts,
        wooCommerceCount: wooCommerceProductCount,
        databaseCount: totalProducts
      }
    });

  } catch (error) {
    logger.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler getirilemedi',
      error: error.message
    });
  }
};

/**
 * Send product to marketplaces
 * POST /api/products/:id/send-to-marketplaces
 */
async function sendProductToMarketplaces(req, res) {
  const startTime = Date.now();
  const { id } = req.params;
  const { marketplaces } = req.body;
  const { customer_id, tenant_id } = req.user;

  logger.info(`🚀 Pazaryerine gönderme işlemi başlatılıyor - Product ID: ${id}, Customer ID: ${customer_id}, Marketplaces: ${marketplaces.join(', ')}`);

  try {
    // Input validation
    if (!marketplaces || !Array.isArray(marketplaces) || marketplaces.length === 0) {
      logger.warn(`⚠️ Geçersiz marketplace listesi - Product ID: ${id}, Marketplaces: ${JSON.stringify(marketplaces)}`);
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir marketplace listesi sağlanmalıdır'
      });
    }

    // Find product
    logger.info(`🔍 Ürün aranıyor - Product ID: ${id}`);
    const product = await Product.findByPk(id);

    if (!product) {
      logger.warn(`⚠️ Ürün bulunamadı - Product ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    logger.info(`✅ Ürün bulundu - Product ID: ${id}, Name: ${product.name}`);

    // Send to marketplaces
    logger.info(`📤 Pazaryerlerine gönderme başlatılıyor - Product: ${product.name}, Marketplaces: ${marketplaces.join(', ')}`);
    const result = await sendToMarketplaces(product, marketplaces);

    const duration = Date.now() - startTime;
    
    if (result.success.length > 0) {
      logger.info(`✅ Pazaryerine gönderme başarılı - Product ID: ${id}, Başarılı: ${result.success.join(', ')}, Süre: ${duration}ms`);
    }
    
    if (result.failed.length > 0) {
      logger.warn(`⚠️ Pazaryerine gönderme kısmen başarısız - Product ID: ${id}, Başarısız: ${result.failed.join(', ')}, Süre: ${duration}ms`);
    }

    res.json({
      success: true,
      message: 'Pazaryerlerine gönderme işlemi tamamlandı',
      data: {
        productId: id,
        productName: product.name,
        success: result.success,
        failed: result.failed,
        duration: duration
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Pazaryerine gönderme hatası - Product ID: ${id}, Customer ID: ${customer_id}, Hata: ${error.message}, Süre: ${duration}ms`);
    
    res.status(500).json({
      success: false,
      message: 'Pazaryerlerine gönderme sırasında bir hata oluştu',
      error: error.message,
      duration: duration
    });
  }
}

// WooCommerce ürünlerini getir
const getWooCommerceProducts = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Müşteri bilgilerini al
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // WooCommerce bağlantı bilgilerini kontrol et
    if (!customer.woo_store_url || !customer.woo_consumer_key || !customer.woo_consumer_secret) {
      return res.status(400).json({
        success: false,
        message: 'WooCommerce bağlantı bilgileri eksik'
      });
    }

    // WooCommerce API client'ını oluştur
    const wooCommerceClient = new WooCommerceAPIClient(
      customer.woo_store_url,
      customer.woo_consumer_key,
      customer.woo_consumer_secret
    );

    // WooCommerce'dan ürünleri çek
    const products = await wooCommerceClient.getProducts();
    
    logger.info(`WooCommerce'dan ${products.length} ürün çekildi`);

    res.json({
      success: true,
      products: products,
      count: products.length
    });

  } catch (error) {
    logger.error('WooCommerce ürünleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'WooCommerce ürünleri alınırken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  bulkUploadProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductStats,
  sendProductToMarketplaces,
  upload,
  getWooCommerceProducts
};