import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Trendyol Ürün Senkronizasyonu',
      description: 'Trendyol\'dan ürünlerinizi senkronize edin ve yönetin',
      icon: '🛍️',
      route: '/trendyol-sync'
    },
    {
      title: 'Ürün Senkronizasyonu',
      description: 'WooCommerce ve Trendyol arası ürün senkronizasyonu',
      icon: '🔄',
      route: '/product-sync'
    },
    {
      title: 'Ürün Yönetimi',
      description: 'Sistemdeki ürünleri yönetin ve dış API\'den içe aktarın',
      icon: '📦',
      route: '/product-management'
    },
    {
      title: 'Pazaryeri Bağlantıları',
      description: 'Pazaryeri API bağlantılarını yönetin',
      icon: '🔗',
      route: '/marketplace-connections'
    },
    {
      title: 'Sipariş Yönetimi',
      description: 'WooCommerce ve Trendyol siparişlerini yönetin',
      icon: '📦',
      route: '/order-management'
    },
    {
      title: 'Stok ve Fiyat Güncellemeleri',
      description: 'Stok ve fiyat farklarını görüntüleyin ve güncelleyin',
      icon: '💰',
      route: '/stock-price-update'
    },
    {
      title: 'Kategori Eşleştirme',
      description: 'WooCommerce ve Trendyol kategorilerini eşleştirin',
      icon: '🧩',
      route: '/category-mapping'
    },
    {
      title: 'Detaylı Raporlama',
      description: 'Satış ve senkronizasyon raporlarını görüntüleyin',
      icon: '📊',
      route: '/reports'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
            <p className="mt-2 text-gray-600">
              Hoş geldin, {user?.name || 'Test Müşteri'}! Aşağıdaki modüllerden birini seçarak işlemlerinizi gerçekleştirebilirsiniz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <div
                key={index}
                onClick={() => navigate(item.route)}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 