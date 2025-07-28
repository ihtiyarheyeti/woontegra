# Trendyol WooCommerce Entegrasyonu

Bu proje, WooCommerce ve Trendyol arasında bağımsız bir entegrasyon yazılımıdır. WordPress veya plugin kullanmadan, Node.js ve Express.js ile geliştirilmiştir.

## Özellikler

- ✅ WooCommerce REST API üzerinden ürün çekme
- ✅ Trendyol API üzerinden ürün gönderme
- ✅ Trendyol'dan sipariş çekme ve saklama
- ✅ İki yönlü stok ve fiyat güncellemeleri
- ✅ Müşteri bazlı API anahtarları yönetimi
- ✅ Kategori eşleştirme sistemi
- ✅ Detaylı senkronizasyon logları
- ✅ MySQL veritabanı desteği
- ✅ Modüler kod yapısı (Hepsiburada, N11 entegrasyonu için hazır)

## Teknolojiler

- **Backend**: Node.js, Express.js
- **Veritabanı**: MySQL
- **API**: WooCommerce REST API, Trendyol API
- **Güvenlik**: Helmet, Rate Limiting, API Key Authentication
- **Logging**: Winston
- **Validation**: Joi

## Kurulum

### Gereksinimler

- Node.js 16.0.0 veya üzeri
- MySQL 5.7 veya üzeri
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın**
   ```bash
   git clone <repository-url>
   cd trendyol-woocommerce-integration
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Environment dosyasını oluşturun**
   ```bash
   cp env.example .env
   ```

4. **Environment değişkenlerini düzenleyin**
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=entegrasyon_paneli
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=supersecretkey
   JWT_EXPIRES_IN=24h

   # WooCommerce Configuration
   WC_URL=https://benimsitem.com
   WC_KEY=ck_xxx
   WC_SECRET=cs_xxx

   # Trendyol Configuration
   TRENDYOL_SUPPLIER_ID=xxx
   TRENDYOL_APP_KEY=xxx
   TRENDYOL_APP_SECRET=xxx
   TRENDYOL_API_URL=https://api.trendyol.com/sapigw

   # API Configuration
   API_KEY=benim-api-keyim
   ```

5. **Veritabanını oluşturun**
   ```sql
   CREATE DATABASE entegrasyon_paneli;
   ```

6. **Uygulamayı başlatın**
   **Not:** Veritabanı tabloları otomatik olarak oluşturulacaktır.
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints ve Örnekler

### Müşteri Yönetimi

#### Müşteri Oluşturma
```http
POST /api/customers
Content-Type: application/json

{
  "name": "Müşteri Adı",
  "email": "musteri@example.com",
  "woo_consumer_key": "ck_xxx",
  "woo_consumer_secret": "cs_xxx",
  "woo_store_url": "https://store.example.com",
  "trendyol_app_key": "app_key",
  "trendyol_app_secret": "app_secret",
  "trendyol_supplier_id": "supplier_id"
}
```

**Başarılı Cevap:**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": 1,
    "name": "Müşteri Adı",
    "email": "musteri@example.com",
    "api_key": "generated_api_key_here",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Müşteri Listesi
```http
GET /api/customers?page=1&limit=50&search=keyword
```

**Başarılı Cevap:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Müşteri Adı",
      "email": "musteri@example.com",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "total_pages": 1
  }
}
```

#### Müşteri Detayı
```http
GET /api/customers/{id}
```

**Başarılı Cevap:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Müşteri Adı",
    "email": "musteri@example.com",
    "is_active": true,
    "woo_consumer_key": "ck_xxx",
    "woo_consumer_secret": "ck_****xxx",
    "woo_store_url": "https://store.example.com",
    "trendyol_app_key": "app_key",
    "trendyol_app_secret": "app_****key",
    "trendyol_supplier_id": "supplier_id",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Müşteri Güncelleme
```http
PUT /api/customers/{id}
Content-Type: application/json

{
  "name": "Yeni Müşteri Adı",
  "is_active": true
}
```

### Ürün Yönetimi

#### WooCommerce'den Ürün Çekme
```http
GET /api/products?page=1&per_page=100&status=publish
X-API-Key: your_api_key
```

**Başarılı Cevap:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "Örnek Ürün",
      "sku": "URUN-001",
      "price": "99.99",
      "sale_price": "79.99",
      "stock_quantity": 50,
      "status": "publish",
      "images": [
        {
          "src": "https://example.com/image1.jpg"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 100,
    "total": 1
  }
}
```

#### Trendyol'a Ürün Senkronizasyonu
```http
POST /api/products/sync-trendyol
X-API-Key: your_api_key
Content-Type: application/json

{
  "product_ids": [123, 456, 789]
}
```

**Başarılı Cevap:**
```json
{
  "success": true,
  "message": "Synced 3 products to Trendyol",
  "results": [
    {
      "woo_product_id": 123,
      "trendyol_product_id": 456789,
      "status": "success",
      "message": "Created"
    },
    {
      "woo_product_id": 456,
      "trendyol_product_id": 456790,
      "status": "success",
      "message": "Updated"
    },
    {
      "woo_product_id": 789,
      "status": "error",
      "message": "Invalid product data"
    }
  ]
}
```

#### Stok Güncelleme
```http
PUT /api/products/{id}/stock
X-API-Key: your_api_key
Content-Type: application/json

{
  "stock_quantity": 50
}
```

**Başarılı Cevap:**
```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "woo_product_id": 123,
    "trendyol_product_id": 456789,
    "new_stock": 50
  }
}
```

#### Fiyat Güncelleme
```http
PUT /api/products/{id}/price
X-API-Key: your_api_key
Content-Type: application/json

{
  "regular_price": 99.99,
  "sale_price": 79.99
}
```

**Başarılı Cevap:**
```json
{
  "success": true,
  "message": "Price updated successfully",
  "data": {
    "woo_product_id": 123,
    "trendyol_product_id": 456789,
    "regular_price": 99.99,
    "sale_price": 79.99
  }
}
```

### Sipariş Yönetimi

#### Sipariş Listesi
```http
GET /api/orders?page=1&limit=50&status=pending&platform=trendyol
X-API-Key: your_api_key
```

#### Sipariş Detayı
```http
GET /api/orders/{id}
X-API-Key: your_api_key
```

#### Sipariş Durumu Güncelleme
```http
PUT /api/orders/{id}/status
X-API-Key: your_api_key
Content-Type: application/json

{
  "status": "processing",
  "payment_status": "paid",
  "shipping_status": "shipped"
}
```

### Senkronizasyon

#### Manuel Senkronizasyon
```http
POST /api/sync/manual
X-API-Key: your_api_key
Content-Type: application/json

{
  "sync_type": "all"
}
```

#### Senkronizasyon Logları
```http
GET /api/sync/logs?page=1&limit=50&operation_type=product_sync&status=success
X-API-Key: your_api_key
```

#### Senkronizasyon İstatistikleri
```http
GET /api/sync/stats?start_date=2024-01-01&end_date=2024-12-31
X-API-Key: your_api_key
```

## Veritabanı Şeması

### customers
- Müşteri bilgileri ve API anahtarları
- WooCommerce ve Trendyol kimlik bilgileri

### products
- Ürün bilgileri ve senkronizasyon durumu
- WooCommerce ve Trendyol ürün ID'leri

### orders
- Sipariş bilgileri ve durumları
- Platform entegrasyonları

### category_mappings
- Kategori eşleştirme tablosu
- WooCommerce ve Trendyol kategori ID'leri

### sync_logs
- Senkronizasyon logları
- İşlem geçmişi ve hata takibi

## Hata Örnekleri

### API Key Eksik
```http
GET /api/products
```

**Hata Cevabı:**
```json
{
  "error": "API key is required",
  "message": "Please provide a valid API key in the x-api-key header or Authorization header"
}
```

### Geçersiz API Key
```http
GET /api/products
X-API-Key: invalid_key
```

**Hata Cevabı:**
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

### WooCommerce Kimlik Bilgileri Eksik
```http
GET /api/products
X-API-Key: valid_api_key
```

**Hata Cevabı:**
```json
{
  "error": "WooCommerce credentials not configured",
  "message": "Please configure WooCommerce credentials for this customer"
}
```

### Rate Limiting
```http
GET /api/products
X-API-Key: valid_api_key
```

**Hata Cevabı (100+ istek sonrası):**
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

## Güvenlik

- API Key tabanlı kimlik doğrulama
- Rate limiting (100 istek/15 dakika)
- Helmet güvenlik middleware'i
- CORS yapılandırması
- Hassas veri maskeleme

## Loglama

Uygulama Winston logger kullanır ve şu dosyalara log yazar:
- `logs/combined.log` - Tüm loglar
- `logs/error.log` - Sadece hatalar

## Geliştirme

### Proje Yapısı
```
├── config/          # Yapılandırma dosyaları
├── controllers/     # Controller'lar
├── middleware/      # Middleware'ler
├── routes/          # Route tanımları
├── services/        # API servisleri
├── utils/           # Yardımcı fonksiyonlar
├── logs/            # Log dosyaları
├── server.js        # Ana uygulama dosyası
└── package.json     # Bağımlılıklar
```

### Yeni Platform Entegrasyonu

Yeni bir platform (örn. Hepsiburada, N11) eklemek için:

1. `services/` klasörüne yeni servis dosyası ekleyin
2. Controller'larda yeni platform desteği ekleyin
3. Veritabanı şemasını güncelleyin
4. Route'ları genişletin

### Test

```bash
# Test çalıştırma
npm test

# Test coverage
npm run test:coverage
```

## Deployment

### Production

1. Environment değişkenlerini production için ayarlayın
2. PM2 veya benzeri process manager kullanın
3. Reverse proxy (nginx) yapılandırın
4. SSL sertifikası ekleyin

### Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Sorun Giderme

### Yaygın Hatalar

1. **Veritabanı bağlantı hatası**
   - MySQL servisinin çalıştığından emin olun
   - Veritabanı kimlik bilgilerini kontrol edin

2. **API Key hatası**
   - API Key'in doğru header'da gönderildiğinden emin olun
   - Müşterinin aktif olduğunu kontrol edin

3. **WooCommerce bağlantı hatası**
   - Consumer Key ve Secret'ın doğru olduğunu kontrol edin
   - Store URL'in doğru olduğundan emin olun

4. **Trendyol API hatası**
   - App Key ve Secret'ın doğru olduğunu kontrol edin
   - Supplier ID'nin doğru olduğundan emin olun

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Sorularınız için issue açabilir veya iletişime geçebilirsiniz.

## Changelog

### v1.0.0
- İlk sürüm
- WooCommerce ve Trendyol entegrasyonu
- Temel CRUD işlemleri
- API Key kimlik doğrulama
- Senkronizasyon sistemi 