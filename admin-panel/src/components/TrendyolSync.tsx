import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface TrendyolProduct {
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

interface SyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  total_processed: number;
}

const TrendyolSync: React.FC = () => {
  const [products, setProducts] = useState<TrendyolProduct[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
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

  // Senkronizasyon durumunu getir
  const fetchSyncStatus = async () => {
    try {
      const response = await api.get('/api/trendyol-sync/status');
      setSyncStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
      toast.error('Senkronizasyon durumu alınamadı');
    }
  };

  // Trendyol ürünlerini getir
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

      const response = await api.get(`/api/trendyol-sync/products?${params}`);
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

  // Trendyol'dan ürünleri senkronize et
  const handleSync = async () => {
    try {
      setSyncing(true);
      toast.loading('Trendyol ürünleri senkronize ediliyor...', { id: 'sync' });

      const response = await api.post('/api/trendyol-sync/sync-products');
      const result: SyncResult = response.data.data.results;

      toast.success(
        `Senkronizasyon tamamlandı! İçe aktarılan: ${result.imported}, Güncellenen: ${result.updated}, Hatalı: ${result.errors}`,
        { id: 'sync' }
      );

      // Durumları yenile
      await fetchSyncStatus();
      await fetchProducts();
    } catch (error: any) {
      console.error('Error syncing products:', error);
      const errorMessage = error.response?.data?.message || 'Senkronizasyon başarısız';
      toast.error(errorMessage, { id: 'sync' });
    } finally {
      setSyncing(false);
    }
  };

  // Sayfa değiştiğinde ürünleri yeniden getir
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, statusFilter]);

  // İlk yüklemede durumları getir
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  // Arama ve filtreleme
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
    const statusConfig = {
      active: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Pasif', className: 'bg-red-100 text-red-800' },
      draft: { label: 'Taslak', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Trendyol Ürün Senkronizasyonu</h1>
        <p className="text-gray-600">Trendyol'dan ürünlerinizi senkronize edin ve yönetin</p>
      </div>

      {/* Senkronizasyon Durumu */}
      {syncStatus && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Senkronizasyon Durumu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{syncStatus.product_count}</div>
              <div className="text-sm text-blue-600">Toplam Trendyol Ürünü</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">
                {syncStatus.last_sync ? 'Son Senkronizasyon' : 'Henüz Senkronize Edilmedi'}
              </div>
              {syncStatus.last_sync && (
                <div className="text-xs text-green-600 mt-1">
                  {formatDate(syncStatus.last_sync.created_at)}
                </div>
              )}
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600">
                {syncStatus.has_connection ? 'Bağlantı Aktif' : 'Bağlantı Yok'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Senkronizasyon Butonu */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Ürün Senkronizasyonu</h2>
            <p className="text-gray-600">Trendyol'dan en güncel ürün bilgilerini çekin</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-6 py-2 rounded-lg font-medium ${
              syncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {syncing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Senkronize Ediliyor...
              </div>
            ) : (
              'Ürünleri Senkronize Et'
            )}
          </button>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Ürün adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="draft">Taslak</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Ara
          </button>
        </form>
      </div>

      {/* Ürün Listesi */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Trendyol Ürünleri</h2>
          <p className="text-sm text-gray-600 mt-1">
            Toplam {totalProducts} ürün bulundu
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Ürünler yükleniyor...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">Henüz Trendyol ürünü bulunmuyor</p>
            <button
              onClick={handleSync}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              İlk Senkronizasyonu Başlat
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
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
                      Barkod/SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Güncelleme
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover mr-3"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.description.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₺{product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>
                          {product.barcode && (
                            <div>Barkod: {product.barcode}</div>
                          )}
                          {product.seller_sku && (
                            <div>SKU: {product.seller_sku}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(product.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Sayfa {currentPage} / {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === totalPages
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrendyolSync; 
 