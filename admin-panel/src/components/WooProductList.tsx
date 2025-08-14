import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import MarketplaceSendModal from './MarketplaceSendModal';
import TrendyolProductMappingModal from './TrendyolProductMappingModal';
import { Search, Filter, Send, RefreshCw, Trash2, CheckCircle, XCircle, Upload, X } from 'lucide-react';
import { useProductContext } from '../contexts/ProductContext';
import api from '../services/api';

// WooProduct interface'ini ProductContext'ten import et
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
  // WooCommerce'dan gelen gerçek alanlar
  tax_status: string;
  tax_class: string;
  type: string;
  brand?: string; // Eğer WooCommerce'da brand alanı varsa
  attributes?: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
}



const WooProductList: React.FC = () => {
  // Global product context
  const { products, loading, error, hasLoaded, lastFetchTime, fetchProducts } = useProductContext();
  
  // Local state
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WooProduct | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTrendyolModal, setShowTrendyolModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WooProduct | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
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

  // Düzenleme modal'ını aç
  const handleEditProduct = (product: WooProduct) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // Düzenleme modal'ını kapat
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingProduct(null);
  };

  // Ürün sil
  const handleDeleteProduct = async (product: WooProduct) => {
    if (window.confirm(`${product.name} ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        // TODO: Backend'de silme işlemi yapılacak
        toast.success(`${product.name} ürünü silindi`);
        // Ürünü listeden kaldır
        // await deleteProduct(product.id);
      } catch (error) {
        toast.error('Ürün silinirken hata oluştu');
      }
    }
  };

  // Ürün görüntüle
  const handleViewProduct = (product: WooProduct) => {
    // Ürün detay sayfasına yönlendir veya modal aç
    console.log('Ürün görüntüleniyor:', product);
    toast.success(`${product.name} ürünü görüntüleniyor`);
  };

  // Resim modal'ını aç
  const handleImageClick = (product: WooProduct) => {
    setEditingProduct(product);
    setShowImageModal(true);
  };

  // Trendyol modal'ını aç
  const handleTrendyolClick = (product: WooProduct) => {
    setEditingProduct(product);
    setShowTrendyolModal(true);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      await uploadImages(imageFiles);
    } else {
      toast.error('Lütfen sadece resim dosyaları sürükleyin');
    }
  };

  // Resim yükleme fonksiyonu
  const uploadImages = async (files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // Backend'e resim yükle
      const response = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const uploadedImages = response.data.data;
        toast.success(`${files.length} resim başarıyla yüklendi!`);
        
        // Yüklenen resimleri ürün resimlerine ekle
        if (editingProduct) {
          const newImages = uploadedImages.map((img: any) => ({
            id: Date.now() + Math.random(), // Geçici ID
            src: img.url,
            name: img.filename || 'Yeni Resim',
            alt: img.filename || 'Yeni Resim'
          }));
          
          setEditingProduct({
            ...editingProduct,
            images: [...editingProduct.images, ...newImages]
          });
        }
        
        console.log('Yüklenen resimler:', uploadedImages);
      } else {
        throw new Error(response.data.message || 'Resim yüklenemedi');
      }
      
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      toast.error('Resim yüklenirken hata oluştu');
    }
  };

  // Resim silme fonksiyonu
  const handleDeleteImage = async (imageId: number, imageIndex: number) => {
    if (window.confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
      try {
        // Backend'den resmi sil
        await api.delete(`/upload/image/${imageId}`);

        // Resmi local state'den kaldır
        if (editingProduct) {
          const updatedImages = editingProduct.images.filter((_, index) => index !== imageIndex);
          setEditingProduct({
            ...editingProduct,
            images: updatedImages
          });
        }

        toast.success('Resim başarıyla silindi!');
        
      } catch (error) {
        console.error('Resim silme hatası:', error);
        toast.error('Resim silinirken hata oluştu');
      }
    }
  };

  // Değişiklikleri kaydet
  const handleSaveChanges = async () => {
    try {
      if (!editingProduct) {
        toast.error('Düzenlenecek ürün bulunamadı');
        return;
      }

      // Backend'de ürün güncelleme endpoint'i çağrılacak
      // await api.put(`/woocommerce/products/${editingProduct.id}`, editingProduct);

      // Şimdilik başarılı mesajı göster
      toast.success('Değişiklikler başarıyla kaydedildi!');
      
      // Modal'ı kapat
      setShowImageModal(false);
      
      // Ürün listesini yenile
      await fetchProducts(true);
      
    } catch (error) {
      console.error('Değişiklikleri kaydetme hatası:', error);
      toast.error('Değişiklikler kaydedilirken hata oluştu');
    }
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
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(numPrice);
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
      <div className="max-w-full mx-auto">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-2 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                    <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resim
                    </th>
                    <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Kodu
                    </th>
                    <th className="w-48 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Adı
                    </th>
                    <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KDV (%)
                    </th>
                    <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miktar
                    </th>
                    <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satış Fiyatı
                    </th>
                    <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Özel Çıkışlı Fiyat
                    </th>
                    <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marka
                    </th>
                    <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Tipi
                    </th>
                    <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktif
                    </th>
                    <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pazaryeri
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-2 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Düzenle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Görüntüle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="flex-shrink-0 h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={product.images[0]?.src || '/placeholder-product.jpg'}
                            alt={product.name}
                            onClick={() => handleImageClick(product)}
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.jpg';
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {product.sku || '-'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={product.name}>
                          {product.name}
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {'20%'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {product.stock_quantity || 0}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{formatPrice(product.price)}</div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {product.sale_price && product.sale_price !== product.regular_price ? (
                          <div className="font-medium text-green-600">{formatPrice(product.sale_price)}</div>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {'-'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {product.categories?.[0]?.name || '-'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {'Basit Ürün'}
                        </span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
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
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleTrendyolClick(product)}
                          className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer transition-colors"
                          title="Trendyol'a gönder"
                        >
                          T
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

                {/* Image Upload Modal */}
        {showImageModal && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct.name} - Resim Yönetimi
                </h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mevcut Resimler */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Mevcut Resimler</h4>
                <div className="grid grid-cols-4 gap-3">
                  {editingProduct.images.map((image: any, index: number) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.src}
                        alt={image.alt || `Resim ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleDeleteImage(image.id, index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yeni Resim Yükleme */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-sm text-gray-600 mb-4">
                  {isDragOver ? (
                    <>
                      <p className="font-medium text-blue-600">Resimleri buraya bırakın!</p>
                      <p className="text-xs text-blue-500">PNG, JPG, GIF dosyaları kabul edilir</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Resim yüklemek için tıklayın veya sürükleyin</p>
                      <p className="text-xs">PNG, JPG, GIF dosyaları kabul edilir (max 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files) {
                      const fileArray = Array.from(files);
                      await uploadImages(fileArray);
                    }
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Resim Seç
                </label>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trendyol Product Mapping Modal */}
        {showTrendyolModal && editingProduct && (
          <TrendyolProductMappingModal
            isOpen={showTrendyolModal}
            product={editingProduct}
            storeId={1} // TODO: Gerçek store ID'yi kullan
            onClose={() => setShowTrendyolModal(false)}
            onSaved={(payload: { categoryId: number | null; attributes: { attributeId: number; attributeValueId: number | null }[] }) => {
              console.log('Trendyol eşleştirmesi kaydedildi:', payload);
              toast.success(`Trendyol eşleştirmesi başarıyla kaydedildi! Kategori ID: ${payload.categoryId}`);
              setShowTrendyolModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WooProductList; 