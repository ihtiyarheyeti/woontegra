const axios = require('axios');
const logger = require('../utils/logger');

class WooCommerceService {
  constructor(customer) {
    this.customer = customer;
    this.baseURL = customer.woo_store_url;
    this.consumerKey = customer.woo_consumer_key;
    this.consumerSecret = customer.woo_consumer_secret;
    
    // Create axios instance with basic auth
    this.client = axios.create({
      baseURL: `${this.baseURL}/wp-json/wc/v3`,
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret
      },
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`WooCommerce API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('WooCommerce API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`WooCommerce API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('WooCommerce API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get products from WooCommerce
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Products array
   */
  async getProducts(options = {}) {
    try {
      const params = {
        per_page: options.per_page || 100,
        page: options.page || 1,
        status: options.status || 'publish',
        ...options
      };

      const response = await this.client.get('/products', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching products from WooCommerce:', error);
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
      const response = await this.client.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching product ${productId} from WooCommerce:`, error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  /**
   * Update product stock
   * @param {number} productId - Product ID
   * @param {number} stockQuantity - New stock quantity
   * @returns {Promise<Object>} Updated product
   */
  async updateStock(productId, stockQuantity) {
    try {
      const response = await this.client.put(`/products/${productId}`, {
        stock_quantity: stockQuantity,
        manage_stock: true
      });
      return response.data;
    } catch (error) {
      logger.error(`Error updating stock for product ${productId}:`, error);
      throw new Error(`Failed to update stock: ${error.message}`);
    }
  }

  /**
   * Update product price
   * @param {number} productId - Product ID
   * @param {number} regularPrice - Regular price
   * @param {number} salePrice - Sale price (optional)
   * @returns {Promise<Object>} Updated product
   */
  async updatePrice(productId, regularPrice, salePrice = null) {
    try {
      const updateData = {
        regular_price: regularPrice.toString()
      };

      if (salePrice !== null) {
        updateData.sale_price = salePrice.toString();
      }

      const response = await this.client.put(`/products/${productId}`, updateData);
      return response.data;
    } catch (error) {
      logger.error(`Error updating price for product ${productId}:`, error);
      throw new Error(`Failed to update price: ${error.message}`);
    }
  }

  /**
   * Get product categories
   * @returns {Promise<Array>} Categories array
   */
  async getCategories() {
    try {
      const response = await this.client.get('/products/categories', {
        params: { per_page: 100 }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching categories from WooCommerce:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Get orders from WooCommerce
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Orders array
   */
  async getOrders(options = {}) {
    try {
      const params = {
        per_page: options.per_page || 100,
        page: options.page || 1,
        status: options.status || 'processing',
        ...options
      };

      const response = await this.client.get('/orders', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching orders from WooCommerce:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  /**
   * Update order status
   * @param {number} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.client.put(`/orders/${orderId}`, {
        status: status
      });
      return response.data;
    } catch (error) {
      logger.error(`Error updating order status for order ${orderId}:`, error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  /**
   * Test connection to WooCommerce
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.client.get('/products', { params: { per_page: 1 } });
      return true;
    } catch (error) {
      logger.error('WooCommerce connection test failed:', error);
      return false;
    }
  }
}

module.exports = WooCommerceService; 