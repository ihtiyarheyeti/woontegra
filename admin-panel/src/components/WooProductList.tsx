import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import MarketplaceSendModal from './MarketplaceSendModal';
import { Search, Filter, Send, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useProductContext } from '../contexts/ProductContext';

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

const WooProductList: React.FC = () => {
  // Global product context
  const { products, loading, error, hasLoaded, lastFetchTime, fetchProducts } = useProductContext();
  
  // Local state
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WooProduct | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Progress state (for UI feedback)
  const [fetchProgress, setFetchProgress] = useState(0);
  const [fetchStatus, setFetchStatus] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // Zorla yenileme fonksiyonu
  const forceRefresh = async () => {
    console.log('🔄 Zorla yenileme başlatılıyor...');
    setIsFetching(true);
    setFetchProgress(0);
    setFetchStatus('Bağlantı kuruluyor...');
    
    try {
      await fetchProducts(true);
      setFetchProgress(100);
      setFetchStatus('Tamamlandı!');
    } catch (error) {
      console.error('Yenileme hatası:', error);
    } finally {
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
          setFetchStatus('API\'ye bağlanılıyor...');
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

  // Load products on component mount - sadece ürünler boşsa çek
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, []); // Empty dependency array - only run once on mount

  // Filtrelenmiş ürünler
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        product.categories.some(cat => cat.name === selectedCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Kategoriler listesi
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      product.categories.forEach(cat => categorySet.add(cat.name));
    });
    return Array.from(categorySet).sort();
  }, [products]);

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

  // Checkbox işlemleri
  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Toplu işlemler
  const handleBulkSend = () => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen gönderilecek ürünleri seçin');
      return;
    }
    toast.success(`${selectedProducts.length} ürün pazaryerine gönderiliyor...`);
    // TODO: Implement bulk send functionality
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen silinecek ürünleri seçin');
      return;
    }
    if (window.confirm(`${selectedProducts.length} ürünü silmek istediğinizden emin misiniz?`)) {
      toast.success(`${selectedProducts.length} ürün silindi`);
      setSelectedProducts([]);
      // TODO: Implement bulk delete functionality
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Loading state - sadece hiç veri yoksa göster
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <span className="text-gray-600 mb-4">Ürünler yükleniyor...</span>
            
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
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-gray-600">
              {filteredProducts.length} ürün bulundu • Sayfa {currentPage} / {totalPages} • {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} arası gösteriliyor
            </p>
            {hasLoaded && lastFetchTime && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Son güncelleme: {new Date(lastFetchTime).toLocaleTimeString('tr-TR')}
                {loading && products.length > 0 && (
                  <span className="ml-2 text-blue-600">🔄 Arka planda güncelleniyor...</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Left side - Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tüm Kategoriler</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Items Per Page */}
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
            </div>

            {/* Right side - Search and Actions */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={forceRefresh}
                  disabled={isFetching}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                  <span>{isFetching ? 'Yükleniyor...' : 'Senkronize Et'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                {selectedProducts.length} ürün seçildi
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkSend}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Toplu Gönder</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Seçilenleri Sil</span>
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Products Table */}
        {!Array.isArray(products) || filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Ürün bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">
                {!Array.isArray(products) ? 'Veri formatı hatası' : 'Arama kriterlerinize uygun ürün bulunamadı.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün
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
                      Trendyol Eşleşme
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
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
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
                              SKU: {product.sku || '-'}
                            </div>
                          </div>
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'publish' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status === 'publish' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Pasif
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Eşleşmedi
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSendToMarketplace(product)}
                          className="text-blue-600 hover:text-blue-900"
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
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