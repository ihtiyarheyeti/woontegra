import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import MarketplaceSendModal from './MarketplaceSendModal';

interface WooProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number;
  stock_status: string;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  sku: string;
  status: string;
  date_created: string;
  date_modified: string;
}

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

const WooProductList: React.FC = () => {
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WooProduct | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Cache state
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Progress state
  const [fetchProgress, setFetchProgress] = useState(0);
  const [fetchStatus, setFetchStatus] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // Check if cache is valid
  const isCacheValid = () => {
    if (!lastFetchTime) return false;
    return Date.now() - lastFetchTime < CACHE_DURATION;
  };

  // WooCommerce ürünlerini getir
  const fetchProducts = async (forceRefresh = false) => {
    const startTime = Date.now();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid() && products.length > 0) {
      console.log('📦 Önbellekten ürünler yükleniyor...');
      setIsFromCache(true);
      setLoading(false);
      return;
    }

    console.log('🔄 WooCommerce ürünleri getiriliyor...');
    
    try {
      setLoading(true);
      setError(null);
      setIsFromCache(false);
      setIsFetching(true);
      setFetchProgress(0);
      setFetchStatus('Bağlantı kuruluyor...');
      
      const response = await api.get('/woocommerce/products');
      
      const duration = Date.now() - startTime;
      
      if (response.data.success) {
        const productsData = response.data.data;
        console.log('Debug: API response data:', productsData);
        console.log('Debug: productsData type:', typeof productsData);
        console.log('Debug: productsData isArray:', Array.isArray(productsData));
        
        if (Array.isArray(productsData)) {
          setProducts(productsData);
          setLastFetchTime(Date.now()); // Update cache timestamp
          setFetchProgress(100);
          setFetchStatus('Tamamlandı!');
          console.log(`✅ WooCommerce ürünleri başarıyla getirildi - Ürün Sayısı: ${productsData.length}, Süre: ${duration}ms`);
        } else {
          throw new Error('API yanıtı geçerli bir ürün listesi değil');
        }
      } else {
        throw new Error(response.data.message || 'Ürünler getirilemedi');
      }
    } catch (error: any) {
      console.error('❌ WooCommerce ürünleri alınırken hata - Hata:', error.message, 'Süre:', Date.now() - startTime, 'ms', error);
      setError(error.response?.data?.message || error.message || 'Ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setIsFetching(false);
      setFetchProgress(0);
      setFetchStatus('');
    }
  };

  // Simulate progress updates (since we can't get real-time progress from backend)
  useEffect(() => {
    if (isFetching && fetchProgress < 90) {
      const interval = setInterval(() => {
        setFetchProgress(prev => {
          if (prev >= 90) return prev;
          const increment = Math.random() * 10 + 5; // 5-15% random increment
          return Math.min(prev + increment, 90);
        });
        
        // Update status messages
        if (fetchProgress < 20) {
          setFetchStatus('WooCommerce API\'ye bağlanılıyor...');
        } else if (fetchProgress < 40) {
          setFetchStatus('Ürün listesi alınıyor...');
        } else if (fetchProgress < 60) {
          setFetchStatus('Ürün detayları işleniyor...');
        } else if (fetchProgress < 80) {
          setFetchStatus('Resimler ve kategoriler yükleniyor...');
        } else {
          setFetchStatus('Son düzenlemeler yapılıyor...');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isFetching, fetchProgress]);

  // Force refresh products (bypass cache)
  const forceRefreshProducts = () => {
    fetchProducts(true);
  };

  // Sync products with WooCommerce
  const syncProducts = async () => {
    const startTime = Date.now();
    
    try {
      setSyncing(true);
      setError(null);
      
      console.log('🔄 WooCommerce senkronizasyonu başlatılıyor...');
      
      const response = await api.post('/woocommerce/sync');
      
      const duration = Date.now() - startTime;
      
      if (response.data.success) {
        console.log(`✅ WooCommerce senkronizasyonu tamamlandı - Süre: ${duration}ms`);
        toast.success('Ürünler başarıyla senkronize edildi!');
        
        // Force refresh products after sync
        fetchProducts(true);
      } else {
        throw new Error(response.data.message || 'Senkronizasyon başarısız');
      }
    } catch (error: any) {
      console.error('❌ WooCommerce senkronizasyonu hatası:', error);
      setError(error.response?.data?.message || error.message || 'Senkronizasyon sırasında bir hata oluştu');
      toast.error('Senkronizasyon başarısız!');
    } finally {
      setSyncing(false);
    }
  };

  // Pazaryerine gönder modal'ını aç
  const handleSendToMarketplace = (product: WooProduct) => {
    setSelectedProduct(product);
    setShowMarketplaceModal(true);
  };

  // Modal kapatıldığında
  const handleMarketplaceModalClose = () => {
    setShowMarketplaceModal(false);
    setSelectedProduct(null);
  };

  // Load products on component mount
  useEffect(() => {
    // Only fetch if we don't have valid cached data
    if (!isCacheValid() || products.length === 0) {
      fetchProducts();
    } else {
      // If we have valid cache, just set loading to false
      setLoading(false);
      setIsFromCache(true);
    }
  }, []); // Empty dependency array - only run once on mount

  // Fiyat formatla
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(parseFloat(price));
  };

  // Stok durumu kontrol et
  const getStockStatus = (status: string, quantity: number) => {
    if (status === 'outofstock') return 'Stokta Yok';
    if (quantity > 0) return `${quantity} Adet`;
    return 'Stokta Yok';
  };

  // Stok durumu rengi
  const getStockColor = (status: string, quantity: number) => {
    if (status === 'outofstock' || quantity === 0) return 'text-red-600 bg-red-100';
    if (quantity < 10) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  // Cache durumunu göster
  const getCacheStatus = () => {
    if (!lastFetchTime) {
      return 'Önbellek yok';
    }
    
    const timeDiff = Date.now() - lastFetchTime;
    const minutes = Math.floor(timeDiff / 60000);
    const seconds = Math.floor((timeDiff % 60000) / 1000);
    
    if (isCacheValid()) {
      return `Önbellekten (${minutes}:${seconds.toString().padStart(2, '0')} önce)`;
    } else {
      return `Süresi dolmuş (${minutes}:${seconds.toString().padStart(2, '0')} önce)`;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <span className="text-gray-600 mb-4">WooCommerce ürünleri yükleniyor...</span>
            
            {/* Progress Bar */}
            {isFetching && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{fetchStatus}</span>
                  <span>{Math.round(fetchProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${fetchProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {fetchProgress < 100 ? 'Lütfen bekleyin, bu işlem 1-2 dakika sürebilir...' : 'Tamamlandı!'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Hata</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => fetchProducts(true)}
                className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WooCommerce Ürünleri</h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-gray-600">
                  {products.length} ürün bulundu • Sayfa {currentPage} / {totalPages} • {startIndex + 1}-{Math.min(endIndex, products.length)} arası gösteriliyor
                </p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isFromCache ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {getCacheStatus()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 bg-white rounded-lg border p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
              </div>

              {/* Items Per Page Selector */}
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 ürün</option>
                <option value={20}>20 ürün</option>
                <option value={50}>50 ürün</option>
                <option value={100}>100 ürün</option>
              </select>

              <button
                onClick={forceRefreshProducts}
                disabled={isFetching}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isFetching ? 'Yükleniyor...' : 'Yenile'}
              </button>
              <button
                onClick={syncProducts}
                disabled={syncing || isFetching}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {syncing ? 'Senkronize Ediliyor...' : 'Senkronize Et'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar for Fetching */}
        {isFetching && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">{fetchStatus}</span>
              <span className="font-medium">{Math.round(fetchProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${fetchProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {fetchProgress < 100 ? 'Lütfen bekleyin, bu işlem 1-2 dakika sürebilir...' : 'Tamamlandı!'}
            </div>
          </div>
        )}

        {/* Products List/Grid */}
        {!Array.isArray(products) || products.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ürün bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              {!Array.isArray(products) ? 'Veri formatı hatası' : 'WooCommerce mağazanızda henüz ürün bulunmuyor.'}
            </p>
            {!Array.isArray(products) && (
              <div className="mt-4 text-xs text-gray-500">
                <p>Debug: products type = {typeof products}</p>
                <p>Debug: products value = {JSON.stringify(products).substring(0, 200)}...</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* List View */}
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ürün
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fiyat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                <img
                                  className="h-12 w-12 rounded-lg object-cover"
                                  src={product.images[0]?.src || '/placeholder-product.jpg'}
                                  alt={product.name}
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-product.jpg';
                                  }}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.categories.map(cat => cat.name).join(', ')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.sku || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">{formatPrice(product.price)}</div>
                            {product.sale_price && product.sale_price !== product.regular_price && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatPrice(product.regular_price)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockColor(product.stock_status, product.stock_quantity)}`}>
                              {getStockStatus(product.stock_status, product.stock_quantity)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.status === 'publish' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.status === 'publish' ? 'Yayında' : 'Taslak'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleSendToMarketplace(product)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Pazaryerine Gönder
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <img
                    src={product.images[0]?.src || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                   
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description.replace(/<[^>]*>/g, '')}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      {product.sale_price && product.sale_price !== product.regular_price ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(product.sale_price)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.regular_price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(product.stock_status, product.stock_quantity)}`}>
                      {getStockStatus(product.stock_status, product.stock_quantity)}
                    </span>
                     
                    {product.sku && (
                      <span className="text-xs text-gray-500">
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>

                  {/* Categories */}
                  {product.categories && product.categories.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {product.categories.slice(0, 2).map((category) => (
                          <span
                            key={category.id}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {category.name}
                          </span>
                        ))}
                        {product.categories.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{product.categories.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Send to Marketplace Button */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleSendToMarketplace(product)}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Pazaryerine Gönder
                    </button>
                  </div>

                  {/* Product Status */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Durum: {product.status === 'publish' ? 'Yayında' : 'Taslak'}
                      </span>
                      <span>
                        ID: {product.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  
                                       {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Marketplace Send Modal */}
        {showMarketplaceModal && selectedProduct && (
          <MarketplaceSendModal
            isOpen={showMarketplaceModal}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            onClose={handleMarketplaceModalClose}
          />
        )}
      </div>
    </div>
  );
};

export default WooProductList; 