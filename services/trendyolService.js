const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class TrendyolService {
  constructor(customer) {
    this.customer = customer;
    this.baseURL = process.env.TRENDYOL_API_URL || 'https://api.trendyol.com/sapigw';
    this.appKey = customer.trendyol_app_key;
    this.appSecret = customer.trendyol_app_secret;
    this.supplierId = customer.trendyol_supplier_id;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Trendyol-WooCommerce-Integration/1.0'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication headers
        config.headers['Authorization'] = this.generateAuthHeader(config.method, config.url, config.data);
        logger.debug(`Trendyol API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Trendyol API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Trendyol API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Trendyol API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate authentication header for Trendyol API
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request body
   * @returns {string} Authorization header
   */
  generateAuthHeader(method, url, data = null) {
    const timestamp = Date.now();
    const signature = this.generateSignature(method, url, data, timestamp);
    
    return `Basic ${Buffer.from(`${this.appKey}:${signature}`).toString('base64')}`;
  }

  /**
   * Generate signature for Trendyol API authentication
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request body
   * @param {number} timestamp - Timestamp
   * @returns {string} Signature
   */
  generateSignature(method, url, data, timestamp) {
    const urlPath = new URL(url, this.baseURL).pathname;
    const body = data ? JSON.stringify(data) : '';
    
    const signatureString = `${this.appKey}${this.appSecret}${timestamp}`;
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');
    
    return signature;
  }

  /**
   * Create product on Trendyol
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    try {
      const response = await this.client.post(`/suppliers/${this.supplierId}/products`, productData);
      return response.data;
    } catch (error) {
      logger.error('Error creating product on Trendyol:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Update product on Trendyol
   * @param {number} productId - Product ID
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, productData) {
    try {
      const response = await this.client.put(`/suppliers/${this.supplierId}/products/${productId}`, productData);
      return response.data;
    } catch (error) {
      logger.error(`Error updating product ${productId} on Trendyol:`, error);
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Get products from Trendyol
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Products array
   */
  async getProducts(options = {}) {
    try {
      const params = {
        page: options.page || 0,
        size: options.size || 50,
        ...options
      };

      const response = await this.client.get(`/suppliers/${this.supplierId}/products`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching products from Trendyol:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Get a specific product by ID
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProduct(productId) {
    try {
      const response = await this.client.get(`/suppliers/${this.supplierId}/products/${productId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching product ${productId} from Trendyol:`, error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  /**
   * Update product stock and price
   * @param {Array} products - Array of products with stock and price updates
   * @returns {Promise<Object>} Update result
   */
  async updateStockAndPrice(products) {
    try {
      const response = await this.client.put(`/suppliers/${this.supplierId}/products/price-and-inventory`, {
        items: products
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating stock and price on Trendyol:', error);
      throw new Error(`Failed to update stock and price: ${error.message}`);
    }
  }

  /**
   * Get orders from Trendyol
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Orders array
   */
  async getOrders(options = {}) {
    try {
      const params = {
        page: options.page || 0,
        size: options.size || 50,
        startDate: options.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: options.endDate || new Date().toISOString(),
        ...options
      };

      const response = await this.client.get(`/suppliers/${this.supplierId}/orders`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching orders from Trendyol:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  /**
   * Get a specific order by ID
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Order object
   */
  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/suppliers/${this.supplierId}/orders/${orderId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching order ${orderId} from Trendyol:`, error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  /**
   * Update order status
   * @param {number} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Update result
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.client.put(`/suppliers/${this.supplierId}/orders/${orderId}/status`, {
        status: status
      });
      return response.data;
    } catch (error) {
      logger.error(`Error updating order status for order ${orderId}:`, error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  /**
   * Get categories from Trendyol
   * @returns {Promise<Array>} Categories array
   */
  async getCategories() {
    try {
      const response = await this.client.get('/product-categories');
      return response.data;
    } catch (error) {
      logger.error('Error fetching categories from Trendyol:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Get category attributes
   * @param {number} categoryId - Category ID
   * @returns {Promise<Array>} Attributes array
   */
  async getCategoryAttributes(categoryId) {
    try {
      const response = await this.client.get(`/product-categories/${categoryId}/attributes`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching attributes for category ${categoryId}:`, error);
      throw new Error(`Failed to fetch category attributes: ${error.message}`);
    }
  }

  /**
   * Test connection to Trendyol
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.client.get(`/suppliers/${this.supplierId}/products`, { params: { size: 1 } });
      return true;
    } catch (error) {
      logger.error('Trendyol connection test failed:', error);
      return false;
    }
  }
}

module.exports = TrendyolService; 