import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Entegrasyon Ayarları
        </h1>
        <p className="text-gray-600">
          Sistem ayarlarını ve entegrasyon konfigürasyonlarını yönetin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WooCommerce Ayarları */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            WooCommerce Ayarları
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumer Key
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumer Secret
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••••••••••"
              />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
              Bağlantıyı Test Et
            </button>
          </div>
        </div>

        {/* Genel Ayarlar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Genel Ayarlar
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Otomatik Senkronizasyon
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>15 dakika</option>
                <option>30 dakika</option>
                <option>1 saat</option>
                <option>6 saat</option>
                <option>12 saat</option>
                <option>24 saat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bildirim E-postası
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                E-posta bildirimleri gönder
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="debug"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="debug" className="ml-2 block text-sm text-gray-900">
                Debug modu aktif
              </label>
            </div>
          </div>
        </div>

        {/* API Ayarları */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            API Ayarları
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Anahtarı
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value="woontegra_api_key_123456789"
                  readOnly
                />
                <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors">
                  Kopyala
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Limiti
              </label>
              <div className="text-sm text-gray-600">
                <p>Günlük: 1000 istek</p>
                <p>Kullanılan: 245 istek</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24.5%' }}></div>
                </div>
              </div>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
              Yeni API Anahtarı Oluştur
            </button>
          </div>
        </div>

        {/* Yedekleme */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Yedekleme ve Geri Yükleme
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Sistem ayarlarınızı yedekleyin veya önceki bir yedekten geri yükleyin.
              </p>
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
                  Yedekle
                </button>
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
                  Geri Yükle
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Son Yedeklemeler</h3>
              <div className="text-sm text-gray-500">
                <p>2024-01-15 14:30 - Otomatik yedekleme</p>
                <p>2024-01-14 14:30 - Otomatik yedekleme</p>
                <p>2024-01-13 14:30 - Otomatik yedekleme</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 