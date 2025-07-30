const BaseMarketplaceSync = require('./BaseMarketplaceSync');
const WooCommerceAPIClient = require('./WooCommerceAPIClient');

/**
 * WooCommerce Sync Service
 * WooCommerce'dan ürün senkronizasyonu yapar
 */
class WooCommerceSync extends BaseMarketplaceSync {
  constructor() {
    super('woocommerce');
  }

  /**
   * WooCommerce API Client oluştur
   */
  createAPIClient(connection) {
    const storeUrl = connection.store_url;
    const consumerKey = this.decryptApiKey(connection.consumer_key);
    const consumerSecret = this.decryptApiKey(connection.consumer_secret);
    
    return new WooCommerceAPIClient(storeUrl, consumerKey, consumerSecret);
  }

  /**
   * WooCommerce ürün verilerini standart formata çevir
   */
  standardizeProductData(rawProduct, customerId) {
    return {
      user_id: customerId,
      external_id: rawProduct.id?.toString(),
      name: rawProduct.name || 'İsimsiz Ürün',
      description: rawProduct.description || '',
      price: parseFloat(rawProduct.price || 0),
      stock: parseInt(rawProduct.stock_quantity || 0),
      source_marketplace: 'woocommerce',
      barcode: rawProduct.sku || null,
      seller_sku: rawProduct.sku || null,
      images: rawProduct.images ? rawProduct.images.map(img => img.src) : [],
      status: rawProduct.status === 'publish' ? 'active' : 'inactive',
      seo_title: rawProduct.meta_data?.find(meta => meta.key === '_yoast_wpseo_title')?.value || null,
      seo_description: rawProduct.meta_data?.find(meta => meta.key === '_yoast_wpseo_metadesc')?.value || null
    };
  }

  /**
   * WooCommerce ürünlerini işle
   */
  async processProducts(apiClient, customerId, results) {
    let page = 1;
    const perPage = 50;
    let hasMore = true;

    while (hasMore) {
      try {
        // WooCommerce API'den ürünleri çek
        const response = await apiClient.getProducts(page, perPage);

        if (!response || response.length === 0) {
          hasMore = false;
          break;
        }

        for (const wooProduct of response) {
          try {
            results.total_processed++;

            // Ürün verilerini standart formata çevir
            const productData = this.standardizeProductData(wooProduct, customerId);

            // Ürünü güncelle veya oluştur
            const result = await this.upsertProduct(productData, customerId);

            if (result.action === 'updated') {
              results.updated++;
            } else {
              results.imported++;
            }

          } catch (productError) {
            results.errors++;
            console.error(`Error processing WooCommerce product: ${productError.message}`, {
              product: wooProduct.name,
              error: productError.message
            });
          }
        }

        page++;

        // Rate limit için kısa bekle
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error fetching WooCommerce products page ${page}:`, error);
        hasMore = false;
        throw error;
      }
    }
  }

  /**
   * WooCommerce bağlantı durumunu kontrol et
   */
  async checkConnection(customerId) {
    try {
      const connection = await this.getConnection(customerId);
      if (!connection) {
        return { connected: false, message: 'WooCommerce bağlantısı bulunamadı' };
      }

      const apiClient = this.createAPIClient(connection);
      await apiClient.testConnection();

      return { connected: true, message: 'WooCommerce bağlantısı başarılı' };
    } catch (error) {
      return { connected: false, message: `WooCommerce bağlantı hatası: ${error.message}` };
    }
  }
}

module.exports = WooCommerceSync; 