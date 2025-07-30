import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  marketplaceConnections: number;
}

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  color: string;
  stats?: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    marketplaceConnections: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch products stats
      const productsResponse = await api.get('/products/stats');
      console.log('🔍 Products Response:', productsResponse.data);
      console.log('📊 Products Data:', productsResponse.data.data);
      
      // Fetch orders stats
      const ordersResponse = await api.get('/orders/stats/summary');
      console.log('🔍 Orders Response:', ordersResponse.data);
      console.log('📊 Orders Data:', ordersResponse.data.data);
      
      // For marketplace connections, we'll use a simple count for now
      // Since there's no specific stats endpoint, we'll set it to 0
      const marketplaceConnections = 0;

      const newStats = {
        totalProducts: productsResponse.data.data?.total || 0,
        activeProducts: productsResponse.data.data?.active || 0,
        totalOrders: ordersResponse.data.data?.total || 0,
        pendingOrders: ordersResponse.data.data?.pending || 0,
        totalRevenue: ordersResponse.data.data?.totalRevenue || 0,
        marketplaceConnections: marketplaceConnections
      };

      console.log('🎯 Final Stats:', newStats);
      setStats(newStats);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      
      // More detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Dashboard istatistikleri yüklenirken hata oluştu';
      
      toast.error(errorMessage);
      
      // Set default values on error
      setStats({
        totalProducts: 0,
        activeProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        marketplaceConnections: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards: DashboardCard[] = [
    // Product Management Section
    {
      id: 'add-product',
      title: 'Yeni Ürün Ekle',
      description: 'Tekli veya toplu olarak yeni ürünler ekleyin',
      icon: '📦',
      link: '/add-product',
      color: 'bg-blue-500 hover:bg-blue-600',
      stats: stats.totalProducts
    },
    {
      id: 'product-management',
      title: 'Ürün Yönetimi',
      description: 'Mevcut ürünleri görüntüleyin ve düzenleyin',
      icon: '🛍️',
      link: '/products',
      color: 'bg-green-500 hover:bg-green-600',
      stats: stats.activeProducts
    },
    {
      id: 'categories',
      title: 'Kategoriler',
      description: 'Ürün kategorilerini yönetin',
      icon: '📂',
      link: '/categories',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'brands',
      title: 'Markalar',
      description: 'Ürün markalarını yönetin',
      icon: '🏷️',
      link: '/brands',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    
    // Order Management Section
    {
      id: 'orders',
      title: 'Sipariş Yönetimi',
      description: 'Tüm siparişleri görüntüleyin ve yönetin',
      icon: '📋',
      link: '/orders',
      color: 'bg-orange-500 hover:bg-orange-600',
      stats: stats.totalOrders
    },
    {
      id: 'pending-orders',
      title: 'Bekleyen Siparişler',
      description: 'Bekleyen siparişleri kontrol edin',
      icon: '⏳',
      link: '/orders?status=pending',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      stats: stats.pendingOrders
    },
    
    // Marketplace Integration Section
    {
      id: 'marketplace-connections',
      title: 'Pazaryeri Bağlantıları',
      description: 'Pazaryeri API bağlantılarını yönetin',
      icon: '🔗',
      link: '/marketplace-connections',
      color: 'bg-teal-500 hover:bg-teal-600',
      stats: stats.marketplaceConnections
    },
    {
      id: 'woocommerce-products',
      title: 'WooCommerce Ürünleri',
      description: 'WooCommerce mağazanızdan ürünleri görüntüleyin',
      icon: '🛒',
      link: '/woo-product-list',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'marketplace-sync',
      title: 'Pazaryeri Senkronizasyonu',
      description: 'Pazaryerlerinden ürün ve sipariş senkronizasyonu',
      icon: '🔄',
      link: '/marketplace-sync',
      color: 'bg-cyan-500 hover:bg-cyan-600'
    },
    {
      id: 'trendyol-sync',
      title: 'Trendyol Senkronizasyonu',
      description: 'Trendyol özel senkronizasyon ayarları',
      icon: '🟠',
      link: '/trendyol-sync',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    
    // Reports & Analytics Section
    {
      id: 'reports',
      title: 'Raporlar',
      description: 'Satış ve performans raporlarını görüntüleyin',
      icon: '📊',
      link: '/reports',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'analytics',
      title: 'Analitik',
      description: 'Detaylı analitik ve istatistikler',
      icon: '📈',
      link: '/analytics',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    
    // Settings Section
    {
      id: 'settings',
      title: 'Ayarlar',
      description: 'Sistem ayarlarını yapılandırın',
      icon: '⚙️',
      link: '/settings',
      color: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      id: 'user-management',
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcı hesaplarını yönetin',
      icon: '👥',
      link: '/users',
      color: 'bg-emerald-500 hover:bg-emerald-600'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Woontegra Dashboard</h1>
          <p className="mt-2 text-gray-600">Pazaryeri entegrasyon yönetim paneli</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalProducts)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif Ürün</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.activeProducts)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalOrders)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="space-y-8">
          {/* Product Management Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ürün Yönetimi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.filter(card => 
                ['add-product', 'product-management', 'categories', 'brands'].includes(card.id)
              ).map((card) => (
                <Link
                  key={card.id}
                  to={card.link}
                  className={`${card.color} text-white rounded-lg shadow-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl mb-2">{card.icon}</div>
                      <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                      <p className="text-sm opacity-90">{card.description}</p>
                      {card.stats !== undefined && (
                        <p className="text-2xl font-bold mt-2">{formatNumber(card.stats)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Order Management Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sipariş Yönetimi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.filter(card => 
                ['orders', 'pending-orders'].includes(card.id)
              ).map((card) => (
                <Link
                  key={card.id}
                  to={card.link}
                  className={`${card.color} text-white rounded-lg shadow-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl mb-2">{card.icon}</div>
                      <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                      <p className="text-sm opacity-90">{card.description}</p>
                      {card.stats !== undefined && (
                        <p className="text-2xl font-bold mt-2">{formatNumber(card.stats)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Marketplace Integration Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pazaryeri Entegrasyonu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.filter(card => 
                ['marketplace-connections', 'woocommerce-products', 'marketplace-sync', 'trendyol-sync'].includes(card.id)
              ).map((card) => (
                <Link
                  key={card.id}
                  to={card.link}
                  className={`${card.color} text-white rounded-lg shadow-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl mb-2">{card.icon}</div>
                      <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                      <p className="text-sm opacity-90">{card.description}</p>
                      {card.stats !== undefined && (
                        <p className="text-2xl font-bold mt-2">{formatNumber(card.stats)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Reports & Analytics Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Raporlar ve Analitik</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.filter(card => 
                ['reports', 'analytics'].includes(card.id)
              ).map((card) => (
                <Link
                  key={card.id}
                  to={card.link}
                  className={`${card.color} text-white rounded-lg shadow-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl mb-2">{card.icon}</div>
                      <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                      <p className="text-sm opacity-90">{card.description}</p>
                      {card.stats !== undefined && (
                        <p className="text-2xl font-bold mt-2">{formatNumber(card.stats)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Settings Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sistem Ayarları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.filter(card => 
                ['settings', 'user-management'].includes(card.id)
              ).map((card) => (
                <Link
                  key={card.id}
                  to={card.link}
                  className={`${card.color} text-white rounded-lg shadow-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl mb-2">{card.icon}</div>
                      <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                      <p className="text-sm opacity-90">{card.description}</p>
                      {card.stats !== undefined && (
                        <p className="text-2xl font-bold mt-2">{formatNumber(card.stats)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
