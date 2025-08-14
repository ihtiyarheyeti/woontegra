const Category = require('../models/Category');
const logger = require('../utils/logger');

/**
 * Get all categories
 * GET /api/categories
 */
const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, is_active } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const { count, rows: categories } = await Category.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * Get category by ID
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });

  } catch (error) {
    logger.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

/**
 * Create new category
 * POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, is_active = true } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      where: { name }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await Category.create({
      name,
      description,
      is_active
    });

    logger.info(`Category created: ${category.name} (ID: ${category.id})`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    logger.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

/**
 * Update category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: { name }
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      is_active: is_active !== undefined ? is_active : category.is_active
    });

    logger.info(`Category updated: ${category.name} (ID: ${category.id})`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });

  } catch (error) {
    logger.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

/**
 * Delete category
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category is being used by any products
    const Product = require('../models/Product');
    const productsUsingCategory = await Product.count({
      where: { category_id: id }
    });

    if (productsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productsUsingCategory} product(s) are using this category.`
      });
    }

    await category.destroy();

    logger.info(`Category deleted: ${category.name} (ID: ${category.id})`);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

/**
 * Get active categories (for dropdowns)
 * GET /api/categories/active
 */
const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    logger.error('Error fetching active categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active categories',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getActiveCategories
}; 