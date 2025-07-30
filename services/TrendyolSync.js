const BaseMarketplaceSync = require('./BaseMarketplaceSync');
const TrendyolAPIClient = require('./TrendyolAPIClient');

/**
 * Trendyol Sync Service
 * Trendyol'dan ürün senkronizasyonu yapar
 */
class TrendyolSync extends BaseMarketplaceSync {
  constructor() {
    super('trendyol');
  }

  /**
   * Trendyol API Client oluştur
   */
  createAPIClient(connection) {
    const apiKey = this.decryptApiKey(connection.api_key);
    const apiSecret = this.decryptApiKey(connection.api_secret);
    
    return new TrendyolAPIClient(apiKey, apiSecret);
  }

  /**
   * Trendyol ürün verilerini standart formata çevir
   */
  standardizeProductData(rawProduct, customerId) {
    return {
      user_id: customerId,
      external_id: rawProduct.id?.toString(),
      name: rawProduct.title || 'İsimsiz Ürün',
      description: rawProduct.description || '',
      price: parseFloat(rawProduct.listPrice || 0),
      stock: parseInt(rawProduct.quantity || 0),
      source_marketplace: 'trendyol',
      barcode: rawProduct.barcode || null,
      seller_sku: rawProduct.stockCode || null,
      images: rawProduct.images ? rawProduct.images.map(img => img.url) : [],
      status: rawProduct.approved ? 'active' : 'inactive'
    };
  }

  /**
   * Trendyol ürünlerini işle
   */
  async processProducts(apiClient, customerId, results) {
    let page = 0;
    const size = 50;
    let hasMore = true;

    while (hasMore) {
      try {
        // Trendyol API'den ürünleri çek
        const response = await apiClient.getProducts(page, size);

        if (!response.content || response.content.length === 0) {
          hasMore = false;
          break;
        }

        for (const trendyolProduct of response.content) {
          try {
            results.total_processed++;

            // Ürün verilerini standart formata çevir
            const productData = this.standardizeProductData(trendyolProduct, customerId);

            // Ürünü güncelle veya oluştur
            const result = await this.upsertProduct(productData, customerId);

            if (result.action === 'updated') {
              results.updated++;
            } else {
              results.imported++;
            }

          } catch (productError) {
            results.errors++;
            console.error(`Error processing Trendyol product: ${productError.message}`, {
              product: trendyolProduct.title,
              error: productError.message
            });
          }
        }

        page++;

        // Rate limit için kısa bekle
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error fetching Trendyol products page ${page}:`, error);
        hasMore = false;
        throw error;
      }
    }
  }
}

module.exports = TrendyolSync; 
 