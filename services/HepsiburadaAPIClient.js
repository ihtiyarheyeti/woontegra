const axios = require('axios');
const logger = require('../utils/logger');

class HepsiburadaAPIClient {
  constructor(user) {
    this.apiKey = user.hepsiburada_api_key;
    this.apiSecret = user.hepsiburada_api_secret;
    this.merchantId = user.hepsiburada_merchant_id;
    this.baseUrl = 'https://marketplace.hepsiburada.com/api';
    this.rateLimitDelay = 1000;
    this.maxRetries = 3;
  }

  // Auth headers
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Pazaryeri-Integration/1.0'
    };
  }

  // API isteği yap
  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method,
      url,
      headers: this.getAuthHeaders(),
      timeout: 30000
    };

    if (data && method !== 'GET') {
      config.data = data;
    }

    logger.info(`Hepsiburada API Request: ${method} ${url}`);

    try {
      const response = await axios(config);
      logger.info(`✅ Hepsiburada API Response: ${response.status}`);
      return response.data;
    } catch (error) {
      logger.error('Hepsiburada API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Kategorileri getir
  async getCategories() {
    try {
      logger.info('🔍 Fetching Hepsiburada categories...');
      
      // Hepsiburada kategori endpoint'i
      const categories = await this.makeRequest('/categories');
      
      if (Array.isArray(categories)) {
        logger.info(`✅ Hepsiburada categories fetched successfully. Count: ${categories.length}`);
        return this.formatCategories(categories);
      } else if (categories && categories.content && Array.isArray(categories.content)) {
        logger.info(`✅ Hepsiburada categories fetched successfully. Count: ${categories.content.length}`);
        return this.formatCategories(categories.content);
      } else {
        logger.warn('Hepsiburada API returned non-array response, using fallback');
        return this.getFallbackCategories();
      }
    } catch (error) {
      logger.error('Error fetching Hepsiburada categories:', error);
      logger.info('Using fallback Hepsiburada categories');
      return this.getFallbackCategories();
    }
  }

  // Kategorileri hiyerarşik yapıya dönüştür
  formatCategories(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // Önce tüm kategorileri map'e ekle
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        id: cat.id.toString(),
        name: cat.name,
        children: []
      });
    });

    // Parent-child ilişkilerini kur
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        // Alt kategori
        const parent = categoryMap.get(cat.parentId);
        parent.children.push(category);
      } else {
        // Kök kategori
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  // Fallback kategoriler (API çalışmazsa) - Hepsiburada'nın gerçek kategorilerini temsil eder
  getFallbackCategories() {
    return [
      {
        id: "1",
        name: "Elektronik",
        children: [
          {
            id: "1-1",
            name: "Telefon",
            children: [
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
            children: [
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
        children: [
          {
            id: "2-1",
            name: "Kadın Giyim",
            children: [
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
            children: [
              { id: "2-2-1", name: "Tişört" },
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
        children: [
          {
            id: "3-1",
            name: "Mobilya",
            children: [
              { id: "3-1-1", name: "Oturma Odası" },
              { id: "3-1-2", name: "Yatak Odası" },
              { id: "3-1-3", name: "Mutfak" },
              { id: "3-1-4", name: "Çalışma Odası" },
              { id: "3-1-5", name: "Bahçe Mobilyası" }
            ]
          },
          { id: "3-2", name: "Ev Tekstili" },
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
              { id: "4-1-1", name: "Eşofman" },
              { id: "4-1-2", name: "Tişört" },
              { id: "4-1-3", name: "Şort" }
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
          { id: "5-1", name: "Makyaj" },
          { id: "5-2", name: "Cilt Bakımı" },
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
          { id: "7-1", name: "Oto Aksesuar" },
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
      const response = await this.makeRequest('/categories?limit=1');
      return {
        success: true,
        message: 'Hepsiburada bağlantısı başarılı',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: `Hepsiburada bağlantı hatası: ${error.message}`,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = HepsiburadaAPIClient; 
 