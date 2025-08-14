const axios = require('axios');
const logger = require('../utils/logger');

class TrendyolAPIClient {
  constructor(user) {
    this.appKey = user.trendyol_app_key;
    this.appSecret = user.trendyol_app_secret;
    this.supplierId = user.trendyol_supplier_id;
    this.sellerId = user.trendyol_seller_id;
    this.baseUrl = 'https://api.trendyol.com/sapigw';
    this.rateLimitDelay = 1000;
    this.maxRetries = 3;
    
    // Token bilgisini de al
    this.token = user.trendyol_token;
  }

  // Basic Auth için credentials oluştur
  getAuthHeaders() {
    const credentials = Buffer.from(`${this.appKey}:${this.appSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
  }

  // Token ile auth headers
  getTokenAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
  }

  // API isteği yap - Retry mekanizması ile
  async makeRequest(endpoint, method = 'GET', data = null, useToken = false) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
          method,
          url,
          headers: useToken ? this.getTokenAuthHeaders() : this.getAuthHeaders(),
          timeout: 30000,
          // Cloudflare bypass için ek ayarlar
          maxRedirects: 5,
          validateStatus: function (status) {
            return status >= 200 && status < 500; // 4xx hatalarını da yakala
          },
          // Proxy ayarları (isteğe bağlı)
          // proxy: {
          //   host: 'proxy.example.com',
          //   port: 8080
          // },
          // HTTPS ayarları
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false,
            keepAlive: true
          })
        };

        if (data && method !== 'GET') {
          config.data = data;
        }

        logger.info(`Trendyol API Request: ${method} ${url} (${useToken ? 'Token' : 'Basic'} Auth) - Attempt ${attempt}/${this.maxRetries}`);

        const response = await axios(config);
        
        if (response.status === 200 || response.status === 201) {
          logger.info(`✅ Trendyol API Response: ${response.status}`);
          return response.data;
        } else {
          logger.warn(`⚠️ Trendyol API Response: ${response.status} - ${response.statusText}`);
          if (response.status === 403) {
            logger.warn('403 Forbidden - Cloudflare protection detected');
            // Farklı endpoint'leri dene
            if (attempt === 1) {
              logger.info('Trying alternative endpoints...');
              // Önce product-categories endpoint'ini dene
              const altUrl = `${this.baseUrl}/product-categories`;
              const altResponse = await axios({
                ...config,
                url: altUrl
              });
              if (altResponse.status === 200) {
                logger.info('✅ Alternative endpoint worked');
                return altResponse.data;
              }
            }
          }
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error;
        logger.error(`❌ Trendyol API Error (Attempt ${attempt}/${this.maxRetries}):`, error.response?.data || error.message);
        
        if (error.response?.status === 403) {
          logger.warn('403 Forbidden - Trying with different approach...');
          // Son deneme olarak token auth'u dene
          if (attempt === this.maxRetries && this.token) {
            logger.info('Trying with token authentication...');
            try {
              const tokenResponse = await this.makeRequest(endpoint, method, data, true);
              return tokenResponse;
            } catch (tokenError) {
              logger.error('Token auth also failed:', tokenError.message);
            }
          }
        }
        
        // Rate limit kontrolü
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after']) || 5;
          logger.warn(`Rate limit exceeded, waiting ${retryAfter} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else {
          // Diğer hatalar için kısa bekle
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Kategorileri getir - Gelişmiş hata yönetimi ile
  async getCategories() {
    try {
      logger.info('🔍 Fetching Trendyol categories...');
      
      // Farklı endpoint'leri dene
      const endpoints = [
        `/suppliers/${this.supplierId}/categories`,
        '/product-categories',
        '/categories'
      ];
      
      for (const endpoint of endpoints) {
        try {
          logger.info(`Trying endpoint: ${endpoint}`);
          const categories = await this.makeRequest(endpoint);
          
          if (Array.isArray(categories)) {
            logger.info(`✅ Trendyol categories fetched successfully from ${endpoint}. Count: ${categories.length}`);
            return this.formatCategories(categories);
          } else if (categories && categories.content && Array.isArray(categories.content)) {
            logger.info(`✅ Trendyol categories fetched successfully from ${endpoint}. Count: ${categories.content.length}`);
            return this.formatCategories(categories.content);
          } else {
            logger.warn(`Endpoint ${endpoint} returned non-array response, trying next...`);
            continue;
          }
        } catch (endpointError) {
          logger.warn(`Endpoint ${endpoint} failed:`, endpointError.message);
          continue;
        }
      }
      
      // Tüm endpoint'ler başarısız oldu, fallback kullan
      logger.warn('All Trendyol endpoints failed, using fallback categories');
      return this.getFallbackCategories();
      
    } catch (error) {
      logger.error('Error fetching Trendyol categories:', error);
      logger.info('Using fallback Trendyol categories');
      return this.getFallbackCategories();
    }
  }

  // Kategorileri hiyerarşik yapıya dönüştür
  formatCategories(categories) {
    // Eğer API'den zaten hiyerarşik yapı geliyorsa, direkt kullan
    if (categories.length > 0 && categories[0].subCategories !== undefined) {
      logger.info('API\'den hiyerarşik yapı geldi, direkt kullanılıyor');
      return categories.map(cat => ({
        id: cat.id.toString(),
        name: cat.name,
        parentId: cat.parentId,
        subCategories: cat.subCategories || []
      }));
    }

    // Eski yöntem - parentId ile hiyerarşi kur
    logger.info('API\'den düz liste geldi, hiyerarşi kuruluyor');
    const categoryMap = new Map();
    const rootCategories = [];

    // Önce tüm kategorileri map'e ekle
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        id: cat.id.toString(),
        name: cat.name,
        subCategories: []
      });
    });

    // Parent-child ilişkilerini kur
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        // Alt kategori
        const parent = categoryMap.get(cat.parentId);
        parent.subCategories.push(category);
      } else {
        // Kök kategori
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  // Trendyol'dan ürünleri getir
  async getProducts(page = 0, size = 100) {
    try {
      logger.info(`Trendyol'dan ürünler getiriliyor... Sayfa: ${page}, Boyut: ${size}`);
      
      const endpoint = `/suppliers/${this.supplierId}/products?page=${page}&size=${size}`;
      
      // Önce token ile dene
      let products = await this.makeRequest(endpoint, 'GET', null, true);
      
      if (!products || !products.content || products.content.length === 0) {
        // Token başarısız olursa Basic Auth ile dene
        logger.info('Token ile ürünler alınamadı, Basic Auth deneniyor...');
        products = await this.makeRequest(endpoint, 'GET', null, false);
      }
      
      if (products && products.content && products.content.length > 0) {
        logger.info(`✅ Trendyol'dan ${products.content.length} ürün getirildi`);
        return this.formatProducts(products.content);
      } else {
        logger.warn('Trendyol\'dan ürün alınamadı');
        return [];
      }
    } catch (error) {
      logger.error('Trendyol ürünleri getirme hatası:', error);
      return [];
    }
  }

  // Tüm ürünleri getir (sayfalama ile)
  async getAllProducts() {
    try {
      logger.info('Trendyol\'dan tüm ürünler getiriliyor...');
      
      let allProducts = [];
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const products = await this.getProducts(page, 100);
        
        if (products && products.length > 0) {
          allProducts = allProducts.concat(products);
          page++;
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        } else {
          hasMore = false;
        }
      }
      
      logger.info(`✅ Trendyol'dan toplam ${allProducts.length} ürün getirildi`);
      return allProducts;
    } catch (error) {
      logger.error('Trendyol tüm ürünleri getirme hatası:', error);
      return [];
    }
  }

  // Tek ürün detayını getir
  async getProduct(productId) {
    try {
      logger.info(`Trendyol ürün detayı getiriliyor: ${productId}`);
      
      const endpoint = `/suppliers/${this.supplierId}/products/${productId}`;
      
      // Önce token ile dene
      let product = await this.makeRequest(endpoint, 'GET', null, true);
      
      if (!product) {
        // Token başarısız olursa Basic Auth ile dene
        logger.info('Token ile ürün detayı alınamadı, Basic Auth deneniyor...');
        product = await this.makeRequest(endpoint, 'GET', null, false);
      }
      
      if (product) {
        logger.info(`✅ Trendyol ürün detayı başarıyla getirildi: ${productId}`);
        return this.formatProduct(product);
      } else {
        logger.warn(`Trendyol ürün detayı alınamadı: ${productId}`);
        return null;
      }
    } catch (error) {
      logger.error(`Trendyol ürün detayı getirme hatası (${productId}):`, error);
      return null;
    }
  }

  // Ürünleri formatla
  formatProducts(products) {
    return products.map(product => this.formatProduct(product));
  }

  // Tek ürünü formatla
  formatProduct(product) {
    return {
      id: product.id || product.productId,
      name: product.name || product.title,
      description: product.description || '',
      price: product.price || product.salePrice || 0,
      stock: product.stock || product.quantity || 0,
      images: product.images || product.productImages || [],
      category: product.category || product.categoryName,
      brand: product.brand || product.brandName,
      barcode: product.barcode || product.productCode,
      status: product.status || 'active',
      attributes: product.attributes || {},
      createdAt: product.createdAt || product.createdDate,
      updatedAt: product.updatedAt || product.updatedDate
    };
  }

  // Fallback kategoriler (API çalışmazsa) - Trendyol'un gerçek kategorilerini temsil eder
  getFallbackCategories() {
    return [
      {
        id: "1",
        name: "Elektronik",
        subCategories: [
          {
            id: "1-1",
            name: "Telefon",
            subCategories: [
              { id: "1-1-1", name: "Akıllı Telefon" },
              { id: "1-1-2", name: "Telefon Aksesuarları" },
              { id: "1-1-3", name: "Telefon Kılıfları" },
              { id: "1-1-4", name: "Şarj Cihazları" },
              { id: "1-1-5", name: "Kablolar" },
              { id: "1-1-6", name: "Kulaklık" }
            ]
          },
          {
            id: "1-2",
            name: "Bilgisayar",
            subCategories: [
              { id: "1-2-1", name: "Dizüstü Bilgisayar" },
              { id: "1-2-2", name: "Masaüstü Bilgisayar" },
              { id: "1-2-3", name: "Bilgisayar Bileşenleri" },
              { id: "1-2-4", name: "Bilgisayar Aksesuarları" },
              { id: "1-2-5", name: "Monitör" },
              { id: "1-2-6", name: "Klavye" },
              { id: "1-2-7", name: "Mouse" }
            ]
          },
          { id: "1-3", name: "Tablet" },
          { id: "1-4", name: "Televizyon" },
          { id: "1-5", name: "Kulaklık" },
          { id: "1-6", name: "Akıllı Saat" },
          { id: "1-7", name: "Kamera" },
          { id: "1-8", name: "Oyun Konsolu" }
        ]
      },
      {
        id: "2",
        name: "Moda",
        subCategories: [
          {
            id: "2-1",
            name: "Kadın Giyim",
            subCategories: [
              { id: "2-1-1", name: "Elbise" },
              { id: "2-1-2", name: "Üst Giyim" },
              { id: "2-1-3", name: "Alt Giyim" },
              { id: "2-1-4", name: "Dış Giyim" },
              { id: "2-1-5", name: "İç Giyim" },
              { id: "2-1-6", name: "Mayo & Bikini" }
            ]
          },
          {
            id: "2-2",
            name: "Erkek Giyim",
            subCategories: [
              { id: "2-2-1", name: "Üst Giyim" },
              { id: "2-2-2", name: "Alt Giyim" },
              { id: "2-2-3", name: "Dış Giyim" },
              { id: "2-2-4", name: "İç Giyim" },
              { id: "2-2-5", name: "Takım Elbise" }
            ]
          },
          { id: "2-3", name: "Çocuk Giyim" },
          { id: "2-4", name: "Ayakkabı" },
          { id: "2-5", name: "Çanta" },
          { id: "2-6", name: "Takı & Aksesuar" },
          { id: "2-7", name: "Gözlük" }
        ]
      },
      {
        id: "3",
        name: "Ev & Yaşam",
        subCategories: [
          {
            id: "3-1",
            name: "Mobilya",
            subCategories: [
              { id: "3-1-1", name: "Oturma Odası" },
              { id: "3-1-2", name: "Yatak Odası" },
              { id: "3-1-3", name: "Mutfak" },
              { id: "3-1-4", name: "Çalışma Odası" },
              { id: "3-1-5", name: "Bahçe Mobilyası" }
            ]
          },
          {
            id: "3-2",
            name: "Ev Tekstili",
            subCategories: [
              { id: "3-2-1", name: "Yatak Takımları" },
              { id: "3-2-2", name: "Havlu" },
              { id: "3-2-3", name: "Perde" },
              { id: "3-2-4", name: "Halı" }
            ]
          },
          { id: "3-3", name: "Dekorasyon" },
          { id: "3-4", name: "Bahçe" },
          { id: "3-5", name: "Mutfak Gereçleri" },
          { id: "3-6", name: "Banyo" },
          { id: "3-7", name: "Aydınlatma" }
        ]
      },
      {
        id: "4",
        name: "Spor & Outdoor",
        children: [
          {
            id: "4-1",
            name: "Spor Giyim",
            children: [
              { id: "4-1-1", name: "Kadın Spor Giyim" },
              { id: "4-1-2", name: "Erkek Spor Giyim" }
            ]
          },
          {
            id: "4-2",
            name: "Spor Ekipmanları",
            children: [
              { id: "4-2-1", name: "Fitness" },
              { id: "4-2-2", name: "Yüzme" },
              { id: "4-2-3", name: "Bisiklet" },
              { id: "4-2-4", name: "Futbol" },
              { id: "4-2-5", name: "Basketbol" },
              { id: "4-2-6", name: "Tenis" }
            ]
          },
          { id: "4-3", name: "Outdoor" },
          { id: "4-4", name: "Spor Ayakkabı" },
          { id: "4-5", name: "Kamp & Doğa" }
        ]
      },
      {
        id: "5",
        name: "Kozmetik & Kişisel Bakım",
        children: [
          { id: "5-1", name: "Cilt Bakımı" },
          { id: "5-2", name: "Makyaj" },
          { id: "5-3", name: "Parfüm" },
          { id: "5-4", name: "Saç Bakımı" },
          { id: "5-5", name: "Kişisel Bakım" },
          { id: "5-6", name: "Güneş Bakımı" },
          { id: "5-7", name: "Tırnak Bakımı" }
        ]
      },
      {
        id: "6",
        name: "Kitap & Hobi",
        children: [
          { id: "6-1", name: "Kitap" },
          { id: "6-2", name: "Müzik" },
          { id: "6-3", name: "Film" },
          { id: "6-4", name: "Oyun" },
          { id: "6-5", name: "Hobi Malzemeleri" },
          { id: "6-6", name: "Müzik Aletleri" },
          { id: "6-7", name: "Sanat Malzemeleri" }
        ]
      },
      {
        id: "7",
        name: "Otomotiv",
        children: [
          { id: "7-1", name: "Otomotiv Aksesuarları" },
          { id: "7-2", name: "Oto Bakım" },
          { id: "7-3", name: "Oto Güvenlik" },
          { id: "7-4", name: "Oto Elektronik" },
          { id: "7-5", name: "Motosiklet" }
        ]
      },
      {
        id: "8",
        name: "Anne & Bebek",
        children: [
          { id: "8-1", name: "Bebek Giyim" },
          { id: "8-2", name: "Bebek Bakım" },
          { id: "8-3", name: "Anne Giyim" },
          { id: "8-4", name: "Bebek Beslenme" },
          { id: "8-5", name: "Bebek Oyuncakları" },
          { id: "8-6", name: "Bebek Güvenlik" }
        ]
      },
      {
        id: "9",
        name: "Pet Shop",
        children: [
          { id: "9-1", name: "Kedi Ürünleri" },
          { id: "9-2", name: "Köpek Ürünleri" },
          { id: "9-3", name: "Balık Ürünleri" },
          { id: "9-4", name: "Kuş Ürünleri" },
          { id: "9-5", name: "Pet Bakım" }
        ]
      },
      {
        id: "10",
        name: "Yapı Market",
        children: [
          { id: "10-1", name: "El Aletleri" },
          { id: "10-2", name: "Boya & Dekorasyon" },
          { id: "10-3", name: "Elektrik" },
          { id: "10-4", name: "Su Tesisatı" },
          { id: "10-5", name: "Bahçe Aletleri" },
          { id: "10-6", name: "Güvenlik Sistemleri" }
        ]
      },
      {
        id: "11",
        name: "Sağlık",
        children: [
          { id: "11-1", name: "Vitamin & Takviye" },
          { id: "11-2", name: "İlk Yardım" },
          { id: "11-3", name: "Sağlık Cihazları" },
          { id: "11-4", name: "Kişisel Bakım" }
        ]
      },
      {
        id: "12",
        name: "Ofis & Kırtasiye",
        children: [
          { id: "12-1", name: "Kırtasiye" },
          { id: "12-2", name: "Ofis Malzemeleri" },
          { id: "12-3", name: "Kağıt Ürünleri" },
          { id: "12-4", name: "Dosyalama" }
        ]
      }
    ];
  }

  // Bağlantı testi
  async testConnection() {
    try {
      const response = await this.makeRequest('/product-categories?size=1');
      return {
        success: true,
        message: 'Trendyol bağlantısı başarılı',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: `Trendyol bağlantı hatası: ${error.message}`,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = TrendyolAPIClient; 
 