const BaseMarketplaceSync = require('./BaseMarketplaceSync');
const HepsiburadaAPIClient = require('./HepsiburadaAPIClient');

/**
 * Hepsiburada Sync Service
 * Hepsiburada'dan ürün senkronizasyonu yapar
 */
class HepsiburadaSync extends BaseMarketplaceSync {
  constructor() {
    super('hepsiburada');
  }

  /**
   * Hepsiburada API Client oluştur
   */
  createAPIClient(connection) {
    const apiKey = this.decryptApiKey(connection.api_key);
    const apiSecret = this.decryptApiKey(connection.api_secret);
    
    return new HepsiburadaAPIClient(apiKey, apiSecret);
  }

  /**
   * Hepsiburada ürün verilerini standart formata çevir
   */
  standardizeProductData(rawProduct, customerId) {
    return {
      user_id: customerId,
      external_id: rawProduct.id?.toString(),
      name: rawProduct.title || 'İsimsiz Ürün',
      description: rawProduct.description || '',
      price: parseFloat(rawProduct.listPrice || 0),
      stock: parseInt(rawProduct.quantity || 0),
      source_marketplace: 'hepsiburada',
      barcode: rawProduct.barcode || null,
      seller_sku: rawProduct.stockCode || null,
      images: rawProduct.images ? rawProduct.images.map(img => img.url) : [],
      status: rawProduct.approved ? 'active' : 'inactive'
    };
  }

  /**
   * Hepsiburada ürünlerini işle
   */
  async processProducts(apiClient, customerId, results) {
    let page = 0;
    const size = 50;
    let hasMore = true;

    while (hasMore) {
      try {
        // Hepsiburada API'den ürünleri çek
        const response = await apiClient.getProducts(page, size);

        if (!response.content || response.content.length === 0) {
          hasMore = false;
          break;
        }

        for (const hepsiburadaProduct of response.content) {
          try {
            results.total_processed++;

            // Ürün verilerini standart formata çevir
            const productData = this.standardizeProductData(hepsiburadaProduct, customerId);

            // Ürünü güncelle veya oluştur
            const result = await this.upsertProduct(productData, customerId);

            if (result.action === 'updated') {
              results.updated++;
            } else {
              results.imported++;
            }

          } catch (productError) {
            results.errors++;
            console.error(`Error processing Hepsiburada product: ${productError.message}`, {
              product: hepsiburadaProduct.title,
              error: productError.message
            });
          }
        }

        page++;

        // Rate limit için kısa bekle
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error fetching Hepsiburada products page ${page}:`, error);
        hasMore = false;
        throw error;
      }
    }
  }
}

module.exports = HepsiburadaSync; 
 