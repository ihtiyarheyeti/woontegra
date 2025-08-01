import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download, Upload, RefreshCw, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface TrendyolProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: Array<{
    url: string;
    alt?: string;
  }>;
  category: string;
  brand: string;
  barcode: string;
  status: string;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const PullTrendyolProducts: React.FC = () => {
  const [products, setProducts] = useState<TrendyolProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<TrendyolProduct | null>(null);

  // Trendyol'dan ürünleri çek
  const fetchTrendyolProducts = async () => {
    try {
      setLoading(true);
      toast.loading('Trendyol\'dan ürünler çekiliyor...', { id: 'fetch-products' });

      const response = await axios.get('http://localhost:3001/api/trendyol/pull-products', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setProducts(response.data.data);
        toast.success(`${response.data.total} ürün başarıyla çekildi!`, { id: 'fetch-products' });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Ürün çekme hatası:', error);
      toast.error(error.response?.data?.message || 'Ürünler çekilirken hata oluştu', { id: 'fetch-products' });
    } finally {
      setLoading(false);
    }
  };

  // Seçilen ürünleri WooCommerce'a aktar
  const importToWooCommerce = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen aktarılacak ürünleri seçin');
      return;
    }

    try {
      setImporting(true);
      toast.loading(`${selectedProducts.length} ürün WooCommerce'a aktarılıyor...`, { id: 'import-products' });

      const response = await axios.post('http://localhost:3001/api/trendyol/import-to-woocommerce', {
        productIds: selectedProducts
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const { imported, failed } = response.data.data;
        
        if (imported.length > 0) {
          toast.success(`${imported.length} ürün başarıyla aktarıldı!`, { id: 'import-products' });
        }
        
        if (failed.length > 0) {
          toast.error(`${failed.length} ürün aktarılamadı`, { id: 'import-products' });
        }

        // Başarıyla aktarılan ürünleri listeden kaldır
        setProducts(prev => prev.filter(product => 
          !imported.some((imp: any) => imp.trendyolId === product.id)
        ));
        setSelectedProducts([]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Aktarma hatası:', error);
      toast.error(error.response?.data?.message || 'Ürünler aktarılırken hata oluştu', { id: 'import-products' });
    } finally {
      setImporting(false);
    }
  };

  // Ürün seçimi
  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Tümünü seç/kaldır
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Ürün önizleme
  const handlePreview = (product: TrendyolProduct) => {
    setPreviewProduct(product);
    setShowPreview(true);
  };

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fiyat formatla
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  // Stok durumu rengi
  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-100';
    if (stock < 10) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trendyol'dan Ürün Çek</h1>
          <p className="text-gray-600 mt-2">
            Trendyol'dan ürünleri çekin ve WooCommerce'a aktarın
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-3">
              <button
                onClick={fetchTrendyolProducts}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? 'Çekiliyor...' : 'Trendyol\'dan Çek'}</span>
              </button>

              <button
                onClick={importToWooCommerce}
                disabled={importing || selectedProducts.length === 0}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{importing ? 'Aktarılıyor...' : `WooCommerce'a Aktar (${selectedProducts.length})`}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {products.length} ürün • {selectedProducts.length} seçili
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <RefreshCw className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Download className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Ürün bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">
                {products.length === 0 
                  ? 'Trendyol\'dan ürün çekmek için "Trendyol\'dan Çek" butonuna tıklayın.'
                  : 'Arama kriterlerinize uygun ürün bulunamadı.'
                }
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
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleProductSelect(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.images[0]?.url || '/placeholder-product.jpg'}
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
                              ID: {product.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{formatPrice(product.price)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockColor(product.stock)}`}>
                          {product.stock} Adet
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handlePreview(product)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Ürün Önizleme</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ürün Görseli */}
                <div>
                  <img
                    src={previewProduct.images[0]?.url || '/placeholder-product.jpg'}
                    alt={previewProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                </div>

                {/* Ürün Bilgileri */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{previewProduct.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">ID: {previewProduct.id}</p>
                  </div>

                  <div>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(previewProduct.price)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Stok</span>
                      <p className="text-sm text-gray-900">{previewProduct.stock} Adet</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Kategori</span>
                      <p className="text-sm text-gray-900">{previewProduct.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Marka</span>
                      <p className="text-sm text-gray-900">{previewProduct.brand}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Durum</span>
                      <p className="text-sm text-gray-900">{previewProduct.status}</p>
                    </div>
                  </div>

                  {previewProduct.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Açıklama</span>
                      <p className="text-sm text-gray-900 mt-1 line-clamp-3">
                        {previewProduct.description}
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        handleProductSelect(previewProduct.id);
                        setShowPreview(false);
                      }}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedProducts.includes(previewProduct.id)
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {selectedProducts.includes(previewProduct.id) ? 'Seçimi Kaldır' : 'Seç'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PullTrendyolProducts; 