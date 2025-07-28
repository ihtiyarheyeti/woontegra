import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  stock: number;
  category: string;
  status: string;
}

interface SyncResult {
  total_woo_products: number;
  total_trendyol_products: number;
  synced_products: number;
  failed_products: number;
  sync_logs: Array<{
    product_name: string;
    action: string;
    platform: string;
    status: string;
  }>;
}

const ProductSync: React.FC = () => {
  const [wooProducts, setWooProducts] = useState<Product[]>([]);
  const [trendyolProducts, setTrendyolProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const customerId = 1; // Demo customer ID

      const [wooRes, trendyolRes] = await Promise.all([
        axios.get(`/api/products/woocommerce?customer_id=${customerId}`),
        axios.get(`/api/products/trendyol?customer_id=${customerId}`)
      ]);

      setWooProducts(wooRes.data.data.products);
      setTrendyolProducts(trendyolRes.data.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!window.confirm('Senkronizasyon işlemini başlatmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setSyncing(true);
      const customerId = 1; // Demo customer ID

      const response = await axios.post('/api/products/sync', {
        customer_id: customerId
      });

      setSyncResult(response.data.data);
      toast.success('Senkronizasyon başarıyla tamamlandı!');
      
      // Refresh products after sync
      fetchProducts();
    } catch (error: any) {
      console.error('Error syncing products:', error);
      const message = error.response?.data?.message || 'Senkronizasyon sırasında hata oluştu';
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ürün Senkronizasyonu
          </h1>
          <p className="text-lg text-gray-600">
            WooCommerce ve Trendyol arasında ürün senkronizasyonu
          </p>
        </div>

        {/* Sync Button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Senkronizasyon Durumu
              </h2>
              <p className="text-gray-600">
                WooCommerce: {wooProducts.length} ürün | Trendyol: {trendyolProducts.length} ürün
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Senkronize Ediliyor...
                </>
              ) : (
                'Senkronizasyon Başlat'
              )}
            </button>
          </div>
        </div>

        {/* Sync Results */}
        {syncResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              Senkronizasyon Sonuçları
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{syncResult.total_woo_products}</div>
                <div className="text-sm text-gray-600">WooCommerce Ürün</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{syncResult.total_trendyol_products}</div>
                <div className="text-sm text-gray-600">Trendyol Ürün</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{syncResult.synced_products}</div>
                <div className="text-sm text-gray-600">Senkronize Edilen</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{syncResult.failed_products}</div>
                <div className="text-sm text-gray-600">Başarısız</div>
              </div>
            </div>
            {syncResult.sync_logs.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-2">Detaylar:</h4>
                <ul className="space-y-1">
                  {syncResult.sync_logs.map((log, index) => (
                    <li key={index} className="text-sm text-green-700">
                      • {log.product_name}: {log.action} ({log.platform}) - {log.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Product Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* WooCommerce Products */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                WooCommerce Ürünleri ({wooProducts.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wooProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₺{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'publish' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.status === 'publish' ? 'Yayında' : 'Taslak'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trendyol Products */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Trendyol Ürünleri ({trendyolProducts.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trendyolProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Barkod: {product.barcode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₺{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSync; 