const { Product } = require('../models');
const logger = require('../utils/logger');
const axios = require('axios');

/**
 * Import products from external API
 * POST /api/products/import
 */
const importProducts = async (req, res) => {
  try {
    logger.info('Product import started');
    
    // Get external API configuration from environment variables
    const externalApiUrl = process.env.EXTERNAL_API_URL;
    const externalApiKey = process.env.EXTERNAL_API_KEY;
    const externalApiSecret = process.env.EXTERNAL_API_SECRET;

    if (!externalApiUrl || !externalApiKey) {
      return res.status(500).json({
        success: false,
        message: 'External API configuration is missing'
      });
    }

    // In production, this would make a real API call
    // For now, we'll use mock data but simulate the API call structure
    let externalProducts = [];
    
    try {
      // Simulate external API call
      logger.info(`Fetching products from external API: ${externalApiUrl}`);
      
      // Mock external API response
      externalProducts = [
        {
          external_id: 'EXT001',
          name: 'iPhone 15 Pro',
          description: 'Apple iPhone 15 Pro 128GB Titanium',
          price: 89999.99,
          stock: 25,
          category_id: 1,
          images: ['https://example.com/iphone15pro1.jpg', 'https://example.com/iphone15pro2.jpg'],
          status: 'active',
          updated_at: new Date('2025-07-28T21:32:42.000Z')
        },
        {
          external_id: 'EXT002',
          name: 'Samsung Galaxy S24',
          description: 'Samsung Galaxy S24 Ultra 256GB',
          price: 74999.99,
          stock: 18,
          category_id: 1,
          images: ['https://example.com/s24ultra1.jpg'],
          status: 'active',
          updated_at: new Date('2025-07-28T21:32:42.000Z')
        },
        {
          external_id: 'EXT003',
          name: 'MacBook Pro M3',
          description: 'Apple MacBook Pro 14" M3 Chip 512GB',
          price: 129999.99,
          stock: 12,
          category_id: 2,
          images: ['https://example.com/macbookpro1.jpg', 'https://example.com/macbookpro2.jpg'],
          status: 'active',
          updated_at: new Date('2025-07-28T21:32:42.000Z')
        }
      ];

      logger.info(`Successfully fetched ${externalProducts.length} products from external API`);
      
    } catch (apiError) {
      logger.error('Error fetching from external API:', apiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products from external API',
        error: apiError.message
      });
    }

    const results = {
      imported: [],
      updated: [],
      skipped: [],
      errors: []
    };

    for (const externalProduct of externalProducts) {
      try {
        // Check if product exists
        const existingProduct = await Product.findOne({
          where: { external_id: externalProduct.external_id }
        });

        if (existingProduct) {
          // Compare update times - only update if external product is newer
          const existingUpdatedAt = new Date(existingProduct.updated_at);
          const externalUpdatedAt = new Date(externalProduct.updated_at);

          if (externalUpdatedAt > existingUpdatedAt) {
            // Update existing product
            await existingProduct.update({
              name: externalProduct.name,
              description: externalProduct.description,
              price: externalProduct.price,
              stock: externalProduct.stock,
              category_id: externalProduct.category_id,
              images: externalProduct.images,
              status: externalProduct.status,
              updated_at: externalProduct.updated_at
            });

            results.updated.push({
              id: existingProduct.id,
              external_id: externalProduct.external_id,
              name: externalProduct.name
            });

            logger.info(`Product updated: ${externalProduct.external_id}`);
          } else {
            // Skip if external product is older
            results.skipped.push({
              external_id: externalProduct.external_id,
              name: externalProduct.name,
              reason: 'External product is older than existing product'
            });

            logger.info(`Product skipped (older): ${externalProduct.external_id}`);
          }
        } else {
          // Create new product
          const newProduct = await Product.create({
            external_id: externalProduct.external_id,
            name: externalProduct.name,
            description: externalProduct.description,
            price: externalProduct.price,
            stock: externalProduct.stock,
            category_id: externalProduct.category_id,
            images: externalProduct.images,
            status: externalProduct.status,
            updated_at: externalProduct.updated_at
          });

          results.imported.push({
            id: newProduct.id,
            external_id: externalProduct.external_id,
            name: externalProduct.name
          });

          logger.info(`Product imported: ${externalProduct.external_id}`);
        }
      } catch (error) {
        results.errors.push({
          external_id: externalProduct.external_id,
          error: error.message
        });

        logger.error(`Error processing product ${externalProduct.external_id}:`, error);
      }
    }

    // Summary
    const summary = {
      total_processed: externalProducts.length,
      imported: results.imported.length,
      updated: results.updated.length,
      skipped: results.skipped.length,
      errors: results.errors.length
    };

    logger.info('Product import completed', summary);

    res.status(200).json({
      success: true,
      message: 'Product import completed successfully',
      data: {
        imported: results.imported,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors,
        summary
      }
    });

  } catch (error) {
    logger.error('Error in product import:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import products',
      error: error.message
    });
  }
};

/**
 * Get all products with pagination and filtering
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.name = {
        [require('sequelize').Op.like]: `%${search}%`
      };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updated_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
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

    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

/**
 * Create new product
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const { 
      external_id, 
      name, 
      description, 
      price, 
      stock, 
      category_id, 
      images = [], 
      status = 'active' 
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    // Check if product with same external_id already exists
    if (external_id) {
      const existingProduct = await Product.findOne({
        where: { external_id }
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this external ID already exists'
        });
      }
    }

    const product = await Product.create({
      external_id,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category_id: category_id || null,
      images: Array.isArray(images) ? images : [],
      status
    });

    logger.info(`Product created: ${product.name} (ID: ${product.id})`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
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
      external_id, 
      name, 
      description, 
      price, 
      stock, 
      category_id, 
      images, 
      status 
    } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if external_id is being changed and if it already exists
    if (external_id && external_id !== product.external_id) {
      const existingProduct = await Product.findOne({
        where: { external_id }
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this external ID already exists'
        });
      }
    }

    await product.update({
      external_id: external_id || product.external_id,
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      category_id: category_id !== undefined ? category_id : product.category_id,
      images: images !== undefined ? (Array.isArray(images) ? images : []) : product.images,
      status: status || product.status
    });

    logger.info(`Product updated: ${product.name} (ID: ${product.id})`);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
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

    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.destroy();

    logger.info(`Product deleted: ${product.id} - ${product.name}`);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  importProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
}; 
 