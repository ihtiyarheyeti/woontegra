const { initializeTables } = require('../config/database');
const logger = require('../utils/logger');

async function initDatabase() {
  try {
    logger.info('Starting database initialization...');
    
    await initializeTables();
    
    logger.info('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase(); 