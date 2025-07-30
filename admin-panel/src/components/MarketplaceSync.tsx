import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import BackButton from './BackButton';

interface Marketplace {
  name: string;
  display_name: string;
  description: string;
}

interface SyncStatus {
  last_sync: {
    id: number;
    status: string;
    created_at: string;
    data: any;
  } | null;
  product_count: number;
  has_connection: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  barcode?: string;
  seller_sku?: string;
  source_marketplace: string;
  status: string;
  images: string[];
  created_at: string;
  updated_at: string;
}

interface SyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  total_processed: number;
}

const MarketplaceSync: React.FC = () => {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('trendyol');
  const [allStatus, setAllStatus] = useState<Record<string, SyncStatus>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  // Desteklenen pazaryerlerini getir
  const fetchMarketplaces = async () => {
    try {
      const response = await api.get('/api/marketplace-sync/marketplaces');
      setMarketplaces(response.data.data);
    } catch (error) {
      console.error('Error fetching marketplaces:', error);
      toast.error('Pazaryeri listesi alınamadı');
    }
  };

  // Tüm pazaryerlerinin durumunu getir
  const fetchAllStatus = async () => {
    try {
      const response = await api.get('/api/marketplace-sync/status');
      setAllStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching all status:', error);
      toast.error('Pazaryeri durumları alınamadı');
    }
  };

  // Seçili pazaryerinin ürünlerini getir
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await api.get(`/api/marketplace-sync/${selectedMarketplace}/products?${params}`);
      setProducts(response.data.data.products);
      setTotalPages(response.data.data.totalPages);
      setTotalProducts(response.data.data.total);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Ürünler getirilemedi');
    } finally {
      setLoading(false);
    }
  };

  // Seçili pazaryerinden ürünleri senkronize et
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    toast.loading(`${getMarketplaceDisplayName(selectedMarketplace)} ürünleri senkronize ediliyor...`);
    
    try {
      const response = await api.post(`/api/marketplace-sync/${selectedMarketplace}/sync`);
      toast.dismiss();
      
      if (response.data.success) {
        const results: SyncResult = response.data.data.results;
        toast.success(
          `${getMarketplaceDisplayName(selectedMarketplace)} senkronizasyonu tamamlandı! İçe aktarılan: ${results.imported}, Güncellenen: ${results.updated}, Atlanan: ${results.skipped}, Hatalı: ${results.errors}`
        );
        fetchAllStatus();
        fetchProducts();
      } else {
        toast.error(response.data.message || 'Senkronizasyon başarısız oldu.');
      }
    } catch (error: any) {
      toast.dismiss();
      console.error('Sync error:', error);
      toast.error(error.response?.data?.message || 'Senkronizasyon sırasında bir hata oluştu.');
    } finally {
      setSyncing(false);
    }
  };

  // Pazaryeri görünen adını getir
  const getMarketplaceDisplayName = (marketplace: string) => {
    const marketplaceObj = marketplaces.find(m => m.name === marketplace);
    return marketplaceObj?.display_name || marketplace;
  };

  // Pazaryeri durumunu getir
  const getMarketplaceStatus = (marketplace: string) => {
    return allStatus[marketplace] || {
      last_sync: null,
      product_count: 0,
      has_connection: false
    };
  };

  useEffect(() => {
    fetchMarketplaces();
    fetchAllStatus();
  }, []);

  useEffect(() => {
    if (selectedMarketplace) {
      fetchProducts();
    }
  }, [selectedMarketplace, currentPage, searchTerm, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>;
      case 'inactive':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Pasif</span>;
      case 'draft':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Taslak</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Başarılı</span>;
      case 'error':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Hata</span>;
      case 'pending':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Beklemede</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Çoklu Pazaryeri Senkronizasyonu</h2>

          {/* Pazaryeri Seçimi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pazaryeri Seçin
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {marketplaces.map((marketplace) => (
                <button
                  key={marketplace.name}
                  onClick={() => setSelectedMarketplace(marketplace.name)}
                  className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
                    selectedMarketplace === marketplace.name
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">{marketplace.display_name}</div>
                    <div className="text-sm text-gray-500 mt-1">{marketplace.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seçili Pazaryeri Durumu */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              {getMarketplaceDisplayName(selectedMarketplace)} Senkronizasyon Durumu
            </h3>
            {allStatus[selectedMarketplace] ? (
              <div>
                <p className="text-sm text-gray-700">
                  Toplam Ürün: <span className="font-medium">{getMarketplaceStatus(selectedMarketplace).product_count}</span>
                </p>
                {getMarketplaceStatus(selectedMarketplace).last_sync ? (
                  <p className="text-sm text-gray-700">
                    Son Senkronizasyon: {formatDate(getMarketplaceStatus(selectedMarketplace).last_sync!.created_at)} ({getSyncStatusBadge(getMarketplaceStatus(selectedMarketplace).last_sync!.status)})
                  </p>
                ) : (
                  <p className="text-sm text-gray-700">Henüz bir senkronizasyon yapılmadı.</p>
                )}
                {!getMarketplaceStatus(selectedMarketplace).has_connection && (
                  <p className="text-sm text-red-600 mt-2">
                    Uyarı: Aktif {getMarketplaceDisplayName(selectedMarketplace)} bağlantısı bulunamadı. Lütfen Pazaryeri Bağlantıları sayfasından API anahtarlarınızı girin.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-700">Durum yükleniyor...</p>
            )}
            <button
              onClick={handleSync}
              disabled={syncing || !getMarketplaceStatus(selectedMarketplace).has_connection}
              className={`mt-4 px-4 py-2 rounded-md text-white font-medium transition-colors duration-200
                ${syncing || !getMarketplaceStatus(selectedMarketplace).has_connection
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
            >
              {syncing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Senkronize Ediliyor...
                </span>
              ) : (
                `${getMarketplaceDisplayName(selectedMarketplace)} Ürünlerini Senkronize Et`
              )}
            </button>
          </div>

          {/* Ürün Listesi */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {getMarketplaceDisplayName(selectedMarketplace)} Ürünleri
            </h3>

            {/* Filtreler ve Arama */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
              <form onSubmit={handleSearch} className="flex-grow flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Ürün adı veya SKU ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Ara
                </button>
              </form>

              <div className="w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <svg className="animate-spin mx-auto h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-gray-600">Ürünler yükleniyor...</p>
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Henüz {getMarketplaceDisplayName(selectedMarketplace)} ürünü bulunamadı. Senkronizasyon yaparak ürünleri çekebilirsiniz.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Görsel
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ürün Adı
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiyat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barkod
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satıcı SKU
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kaynak
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Güncellenme Tarihi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="h-10 w-10 object-cover rounded-md" />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                              No Img
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.price.toFixed(2)} TL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.barcode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.seller_sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.source_marketplace}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(product.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sayfalama */}
            {totalPages > 1 && (
              <nav
                className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
                aria-label="Pagination"
              >
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Toplam <span className="font-medium">{totalProducts}</span> ürün
                  </p>
                </div>
                <div className="flex-1 flex justify-between sm:justify-end">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSync; 