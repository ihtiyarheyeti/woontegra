const logger = require('../utils/logger');

const mockDataController = {
  // Trendyol kategorileri
  getTrendyolCategories: async (req, res) => {
    try {
      const mockCategories = [
        {
          id: 1,
          name: "Elektronik",
          leaf: false,
          subCategories: [
            {
              id: 11,
              name: "Telefon & Aksesuar",
              leaf: false,
              subCategories: [
                { id: 111, name: "Akıllı Telefon", leaf: true, subCategories: [] },
                { id: 112, name: "Telefon Kılıfı", leaf: true, subCategories: [] }
              ]
            },
            {
              id: 12,
              name: "Bilgisayar & Tablet",
              leaf: false,
              subCategories: [
                { id: 121, name: "Laptop", leaf: true, subCategories: [] },
                { id: 122, name: "Tablet", leaf: true, subCategories: [] }
              ]
            }
          ]
        },
        {
          id: 2,
          name: "Giyim & Aksesuar",
          leaf: false,
          subCategories: [
            {
              id: 21,
              name: "Kadın Giyim",
              leaf: false,
              subCategories: [
                { id: 211, name: "Elbise", leaf: true, subCategories: [] },
                { id: 212, name: "Bluz", leaf: true, subCategories: [] }
              ]
            },
            {
              id: 22,
              name: "Erkek Giyim",
              leaf: false,
              subCategories: [
                { id: 221, name: "Gömlek", leaf: true, subCategories: [] },
                { id: 222, name: "Pantolon", leaf: true, subCategories: [] }
              ]
            }
          ]
        },
        {
          id: 3,
          name: "Ev & Yaşam",
          leaf: false,
          subCategories: [
            {
              id: 31,
              name: "Mobilya",
              leaf: false,
              subCategories: [
                { id: 311, name: "Oturma Grubu", leaf: true, subCategories: [] },
                { id: 312, name: "Yatak Odası", leaf: true, subCategories: [] }
              ]
            }
          ]
        }
      ];

      return res.json({
        success: true,
        data: mockCategories,
        isMockData: true
      });
    } catch (error) {
      logger.error('Mock Trendyol kategorileri hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock kategori verisi yüklenemedi'
      });
    }
  },

  // Tedarikçi adresleri
  getSupplierAddresses: async (req, res) => {
    try {
      const mockAddresses = [
        { id: 1, name: "İstanbul Ana Depo", address: "İstanbul, Türkiye", city: "İstanbul" },
        { id: 2, name: "Ankara Depo", address: "Ankara, Türkiye", city: "Ankara" },
        { id: 3, name: "İzmir Depo", address: "İzmir, Türkiye", city: "İzmir" },
        { id: 4, name: "Bursa Depo", address: "Bursa, Türkiye", city: "Bursa" }
      ];

      return res.json({
        success: true,
        data: mockAddresses,
        isMockData: true
      });
    } catch (error) {
      logger.error('Mock tedarikçi adresleri hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock adres verisi yüklenemedi'
      });
    }
  },

  // Kargo firmaları
  getStaticProviders: async (req, res) => {
    try {
      const mockProviders = [
        { id: 1, name: "MNG Kargo", code: "MNG" },
        { id: 2, name: "Yurtiçi Kargo", code: "YURTICI" },
        { id: 3, name: "Aras Kargo", code: "ARAS" },
        { id: 4, name: "PTT Kargo", code: "PTT" },
        { id: 5, name: "Sürat Kargo", code: "SURAT" }
      ];

      return res.json({
        success: true,
        data: mockProviders,
        isMockData: true
      });
    } catch (error) {
      logger.error('Mock kargo firmaları hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock kargo verisi yüklenemedi'
      });
    }
  },

  // WooCommerce ürünleri
  getWooProducts: async (req, res) => {
    try {
      const mockProducts = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Ürün ${i + 1}`,
        sku: `SKU${String(i + 1).padStart(3, '0')}`,
        price: (Math.random() * 1000 + 50).toFixed(2),
        sale_price: Math.random() > 0.7 ? (Math.random() * 800 + 30).toFixed(2) : "",
        regular_price: (Math.random() * 1000 + 50).toFixed(2),
        stock_quantity: Math.floor(Math.random() * 100) + 1,
        stock_status: Math.random() > 0.1 ? 'instock' : 'outofstock',
        tax_status: Math.random() > 0.2 ? 'taxable' : 'shipping',
        tax_class: Math.random() > 0.5 ? 'standard' : 'reduced-rate',
        tax_rate: Math.random() > 0.5 ? 20 : 8,
        status: Math.random() > 0.1 ? 'publish' : 'draft',
        type: Math.random() > 0.8 ? 'variable' : 'simple',
        images: [
          {
            id: i + 1,
            src: `https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Ürün+${i + 1}`,
            alt: `Ürün ${i + 1} Görseli`
          }
        ],
        categories: [
          {
            id: Math.floor(Math.random() * 10) + 1,
            name: `Kategori ${Math.floor(Math.random() * 10) + 1}`,
            slug: `kategori-${Math.floor(Math.random() * 10) + 1}`
          }
        ],
        attributes: [
          {
            id: 1,
            name: "Renk",
            options: ["Kırmızı", "Mavi", "Yeşil"]
          },
          {
            id: 2,
            name: "Beden",
            options: ["S", "M", "L", "XL"]
          }
        ],
        date_created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        date_modified: new Date().toISOString(),
        weight: (Math.random() * 5 + 0.1).toFixed(2),
        dimensions: {
          length: (Math.random() * 50 + 10).toFixed(1),
          width: (Math.random() * 30 + 5).toFixed(1),
          height: (Math.random() * 20 + 2).toFixed(1)
        }
      }));

      return res.json({
        success: true,
        products: mockProducts,
        isMockData: true
      });
    } catch (error) {
      logger.error('Mock WooCommerce ürünleri hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock ürün verisi yüklenemedi'
      });
    }
  },

  // Ürün istatistikleri
  getProductStats: async (req, res) => {
    try {
      const mockStats = {
        total: 150,
        active: 120,
        inactive: 20,
        draft: 10,
        totalValue: 45000.50,
        lowStock: 15,
        wooCommerceCount: 100,
        trendyolCount: 50,
        hepsiburadaCount: 30,
        n11Count: 25,
        ciceksepetiCount: 20,
        pazaramaCount: 15
      };

      return res.json({
        success: true,
        data: mockStats,
        isMockData: true
      });
    } catch (error) {
      logger.error('Mock ürün istatistikleri hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock istatistik verisi yüklenemedi'
      });
    }
  },

  // Pazaryeri bağlantıları
  getMarketplaceConnections: async (req, res) => {
    try {
      const mockConnections = {
        woocommerce: {
          storeUrl: 'https://test-store.com',
          consumerKey: 'ck_test_123',
          consumerSecret: 'cs_test_123',
          isConnected: true
        },
        trendyol: {
          seller_id: '12345',
          integration_code: 'INT123',
          api_key: 'api_key_123',
          api_secret: 'api_secret_123',
          token: 'token_123',
          isConnected: true
        },
        hepsiburada: {
          merchant_id: 'merchant_123',
          api_key: 'api_key_123',
          api_secret: 'api_secret_123',
          isConnected: false
        },
        n11: {
          app_key: 'app_key_123',
          app_secret: 'app_secret_123',
          isConnected: false
        },
        ciceksepeti: {
          dealer_code: 'dealer_123',
          api_key: 'api_key_123',
          secret_key: 'secret_key_123',
          isConnected: false
        },
        pazarama: {
          merchant_id: 'merchant_123',
          api_key: 'api_key_123',
          secret_key: 'secret_key_123',
          isConnected: false
        }
      };

      return res.json({
        success: true,
        data: mockConnections,
        isMockData: true
      });
    } catch (error) {
      logger.error('Mock pazaryeri bağlantıları hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock bağlantı verisi yüklenemedi'
      });
    }
  },

  // Pazaryeri bağlantısı kaydetme
  saveMarketplaceConnection: async (req, res) => {
    try {
      const { marketplace, connectionData } = req.body;
      
      // Mock olarak başarılı response döndür
      return res.json({
        success: true,
        message: `${marketplace} bağlantısı başarıyla kaydedildi`,
        data: {
          marketplace,
          savedAt: new Date().toISOString(),
          isMockData: true
        }
      });
    } catch (error) {
      logger.error('Mock pazaryeri bağlantısı kaydetme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock bağlantı kaydedilemedi'
      });
    }
  },

  // Kategori özellikleri
  getCategoryAttributes: async (req, res) => {
    try {
      const mockAttributes = [
        {
          id: 1,
          name: "Renk",
          type: "select",
          options: ["Kırmızı", "Mavi", "Yeşil", "Sarı", "Siyah", "Beyaz"]
        },
        {
          id: 2,
          name: "Beden",
          type: "select",
          options: ["XS", "S", "M", "L", "XL", "XXL"]
        },
        {
          id: 3,
          name: "Materyal",
          type: "select",
          options: ["Pamuk", "Polyester", "Yün", "İpek", "Deri"]
        },
        {
          id: 4,
          name: "Marka",
          type: "text",
          options: []
        }
      ];

      return res.json({
        success: true,
        data: mockAttributes,
        isMockData: true
      });
    } catch (error) {
      logger.error('Mock kategori özellikleri hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock özellik verisi yüklenemedi'
      });
    }
  },

  // Ürün özellikleri
  getProductAttributes: async (req, res) => {
    try {
      const mockAttributes = [
        {
          id: 1,
          name: "Renk",
          value: "Mavi",
          type: "select"
        },
        {
          id: 2,
          name: "Beden",
          value: "L",
          type: "select"
        },
        {
          id: 3,
          name: "Materyal",
          value: "Pamuk",
          type: "select"
        },
        {
          id: 4,
          name: "Garanti",
          value: "2 Yıl",
          type: "text"
        }
      ];

      return res.json({
        success: true,
        data: mockAttributes,
        isMockData: true
      });
    } catch (error) {
      logger.error('Mock ürün özellikleri hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Mock ürün özellik verisi yüklenemedi'
      });
    }
  }
};

module.exports = mockDataController;
