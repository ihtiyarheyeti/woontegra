# Admin Panel - Trendyol & WooCommerce Entegrasyonu

Bu proje, Trendyol ve WooCommerce entegrasyonu için React.js tabanlı admin panelidir.

## 🚀 Özellikler

- **JWT Authentication**: Güvenli giriş sistemi
- **Responsive Design**: Tailwind CSS ile modern tasarım
- **Route Protection**: Korumalı sayfalar
- **TypeScript**: Tip güvenliği
- **Modular Structure**: Modüler kod yapısı

## 🛠️ Teknolojiler

- React 18
- TypeScript
- React Router DOM
- Tailwind CSS
- Axios
- JWT Authentication

## 📦 Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm start
   ```

3. **Tarayıcıda açın:**
   ```
   Bu siteye ulaşılamıyor
localhost bağlanmayı reddetti.
Aşağıdakileri deneyin:

Bağlantınızı kontrol etme
Proxy'yi ve güvenlik duvarını kontrol etme
ERR_CONNECTION_REFUSED
http://localhost:3000
   ```

## 🔐 Giriş Bilgileri

Demo hesap bilgileri:
- **E-posta:** test@example.com
- **Şifre:** admin123

## 📁 Proje Yapısı

```
src/
├── components/          # React bileşenleri
│   ├── Login.tsx       # Giriş sayfası
│   ├── Dashboard.tsx   # Ana panel
│   └── PrivateRoute.tsx # Korumalı route
├── contexts/           # React Context'leri
│   └── AuthContext.tsx # Authentication context
├── services/           # API servisleri
│   └── api.ts         # Axios konfigürasyonu
├── types/              # TypeScript tipleri
│   └── auth.ts        # Authentication tipleri
└── App.tsx            # Ana uygulama
```

## 🔧 API Endpoints

Backend API endpoint'leri:
- `POST /api/auth/login` - Giriş
- `GET /api/auth/verify` - Token doğrulama
- `POST /api/auth/logout` - Çıkış

## 🎨 Tasarım

- **Responsive**: Mobil ve desktop uyumlu
- **Modern UI**: Tailwind CSS ile temiz tasarım
- **Loading States**: Yükleme durumları
- **Error Handling**: Hata yönetimi

## 🚀 Geliştirme

### Yeni Sayfa Ekleme

1. `src/components/` klasörüne yeni bileşen ekleyin
2. `App.tsx`'te route tanımlayın
3. Gerekirse `PrivateRoute` ile koruyun

### Stil Değişiklikleri

Tailwind CSS kullanarak stil değişiklikleri yapabilirsiniz:
```jsx
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
```

## 📝 Notlar

- Backend'in çalışır durumda olması gerekiyor
- CORS ayarları backend'de yapılandırılmalı
- JWT token localStorage'da saklanıyor
- Otomatik token yenileme mevcut

## 🔒 Güvenlik

- JWT token tabanlı authentication
- Route koruması
- API interceptor'ları
- Otomatik logout (401 hatalarında)

## 📱 Responsive

- Mobile-first tasarım
- Tablet ve desktop uyumlu
- Tailwind breakpoint'leri kullanılıyor
