const cron = require('node-cron');
const { Product } = require('../models');
const logger = require('./logger');
const axios = require('axios');

/**
 * Daily product synchronization job
 * Runs every day at 02:00 AM
 */
const scheduleProductSync = () => {
  // Schedule daily sync at 02:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting scheduled daily product synchronization');
    
    try {
      // Get external API configuration
      const externalApiUrl = process.env.EXTERNAL_API_URL;
      const externalApiKey = process.env.EXTERNAL_API_KEY;

      if (!externalApiUrl || !externalApiKey) {
        logger.error('External API configuration missing for scheduled sync');
        return;
      }

      // Simulate external API call (in production, this would be a real API call)
      logger.info(`Fetching products from external API: ${externalApiUrl}`);
      
      const externalProducts = [
        {
          external_id: 'EXT001',
          name: 'iPhone 15 Pro',
          description: 'Apple iPhone 15 Pro 128GB Titanium',
          price: 89999.99,
          stock: 25,
          category_id: 1,
          images: ['https://example.com/iphone15pro1.jpg', 'https://example.com/iphone15pro2.jpg'],
          status: 'active',
          updated_at: new Date()
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
          updated_at: new Date()
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
          updated_at: new Date()
        }
      ];

      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0
      };

      for (const externalProduct of externalProducts) {
        try {
          // Check if product exists
          const existingProduct = await Product.findOne({
            where: { external_id: externalProduct.external_id }
          });

          if (existingProduct) {
            // Compare update times
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

              results.updated++;
              logger.info(`Scheduled sync: Product updated - ${externalProduct.external_id}`);
            } else {
              results.skipped++;
              logger.info(`Scheduled sync: Product skipped (older) - ${externalProduct.external_id}`);
            }
          } else {
            // Create new product
            await Product.create({
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

            results.imported++;
            logger.info(`Scheduled sync: Product imported - ${externalProduct.external_id}`);
          }
        } catch (error) {
          results.errors++;
          logger.error(`Scheduled sync: Error processing product ${externalProduct.external_id}:`, error);
        }
      }

      logger.info('Scheduled daily product synchronization completed', {
        total_processed: externalProducts.length,
        ...results
      });

    } catch (error) {
      logger.error('Error in scheduled product synchronization:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Istanbul"
  });

  logger.info('Daily product synchronization scheduled for 02:00 AM (Europe/Istanbul)');
};

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
  scheduleProductSync();
  logger.info('Cron jobs initialized');
};

module.exports = {
  initializeCronJobs,
  scheduleProductSync
}; 
 