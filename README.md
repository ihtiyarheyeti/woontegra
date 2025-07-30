# Woontegra - Multi-Tenant Marketplace Integration Platform

Woontegra, çoklu pazaryeri entegrasyonu sağlayan modern bir SaaS platformudur. WooCommerce, Trendyol, Hepsiburada, N11 ve diğer pazaryerleri ile entegrasyon imkanı sunar.

## 🚀 Özellikler

### 📦 Ürün Yönetimi
- **Tekli Ürün Ekleme**: Detaylı ürün formu ile tek tek ürün ekleme
- **Toplu Ürün Yükleme**: Excel, CSV ve XML dosyaları ile toplu ürün yükleme
- **Varyant Desteği**: Renk, beden gibi ürün varyantları
- **Görsel Yönetimi**: Ana görsel ve galeri görselleri
- **SEO Optimizasyonu**: SEO başlığı ve açıklaması

### 🔗 Pazaryeri Entegrasyonları
- **WooCommerce**: WordPress e-ticaret entegrasyonu
- **Trendyol**: Trendyol pazaryeri entegrasyonu
- **Hepsiburada**: Hepsiburada pazaryeri entegrasyonu
- **N11**: N11 pazaryeri entegrasyonu
- **ÇiçekSepeti**: ÇiçekSepeti pazaryeri entegrasyonu

### 🔄 Senkronizasyon
- **Ürün Senkronizasyonu**: Pazaryerlerinden ürün çekme ve gönderme
- **Stok Güncelleme**: Gerçek zamanlı stok senkronizasyonu
- **Fiyat Güncelleme**: Otomatik fiyat senkronizasyonu
- **Sipariş Yönetimi**: Pazaryeri siparişlerini yönetme

### 📊 Raporlama ve Analitik
- **Satış Raporları**: Detaylı satış analizleri
- **Performans Metrikleri**: Pazaryeri performans takibi
- **Stok Raporları**: Stok durumu ve hareketleri
- **Gelir Analizi**: Gelir ve kâr analizleri

## 🛠️ Teknolojiler

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web framework
- **MySQL**: Veritabanı
- **Sequelize**: ORM
- **JWT**: Authentication
- **Multer**: File upload
- **Axios**: HTTP client

### Frontend
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Hook Form**: Form management
- **React Hot Toast**: Notifications

## 📋 Kurulum

### Gereksinimler
- Node.js (v18+)
- MySQL (v8.0+)
- npm veya yarn

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd pazaryeri
```

### 2. Backend Kurulumu
```bash
# Bağımlılıkları yükleyin
npm install

# Veritabanını yapılandırın
cp .env.example .env
# .env dosyasını düzenleyin

# Veritabanını başlatın
node scripts/init-db.js

# Test verilerini oluşturun
node create-test-data.js

# Sunucuyu başlatın
npm start
```

### 3. Frontend Kurulumu
```bash
cd admin-panel

# Bağımlılıkları yükleyin
npm install

# Uygulamayı başlatın
npm start
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/logout` - Kullanıcı çıkışı

### Products
- `GET /api/products` - Ürünleri listele
- `POST /api/products` - Yeni ürün ekle
- `PUT /api/products/:id` - Ürün güncelle
- `DELETE /api/products/:id` - Ürün sil
- `POST /api/products/:id/send-to-marketplaces` - Pazaryerlerine gönder

### WooCommerce
- `GET /api/woocommerce/products` - WooCommerce ürünlerini getir
- `GET /api/woocommerce/products/:id` - Belirli ürünü getir
- `POST /api/woocommerce/sync` - Yerel veritabanına senkronize et
- `GET /api/woocommerce/test-connection` - Bağlantıyı test et

### Upload
- `POST /api/upload/excel` - Excel dosyası yükle
- `POST /api/upload/csv` - CSV dosyası yükle
- `POST /api/upload/xml` - XML dosyası yükle
- `POST /api/upload/images` - Görsel yükle

## 🎯 WooCommerce Entegrasyonu

### Kurulum
1. WooCommerce mağazanızda REST API'yi etkinleştirin
2. Consumer Key ve Consumer Secret oluşturun
3. Woontegra'da WooCommerce bağlantı bilgilerini girin

### Özellikler
- **Ürün Listesi**: WooCommerce ürünlerini görüntüleme
- **Senkronizasyon**: Yerel veritabanına ürün senkronizasyonu
- **Bağlantı Testi**: API bağlantısını test etme
- **Mock Data**: Test için örnek ürün verileri

### API Kullanımı
```javascript
// WooCommerce ürünlerini getir
const response = await fetch('/api/woocommerce/products', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Senkronizasyon yap
const syncResponse = await fetch('/api/woocommerce/sync', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// Bağlantıyı test et
const testResponse = await fetch('/api/woocommerce/test-connection', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🔐 Güvenlik

- **JWT Authentication**: Güvenli token tabanlı kimlik doğrulama
- **Role-based Access Control**: Rol tabanlı erişim kontrolü
- **API Rate Limiting**: API istek sınırlaması
- **Input Validation**: Girdi doğrulama
- **SQL Injection Protection**: SQL enjeksiyon koruması

## 📝 Test Verileri

Sistem kurulumu sonrası aşağıdaki test hesabı ile giriş yapabilirsiniz:

- **Email**: `test@example.com`
- **Şifre**: `admin123`
- **Rol**: `admin`

## 🚀 Deployment

### Production Kurulumu
```bash
# Environment variables
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=woontegra_db

# Build frontend
cd admin-panel
npm run build

# Start backend
npm start
```

## 📞 Destek

Herhangi bir sorun yaşarsanız:
- GitHub Issues kullanın
- Dokümantasyonu kontrol edin
- Test verilerini kullanarak sistemi test edin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**Woontegra** - Modern pazaryeri entegrasyon platformu 