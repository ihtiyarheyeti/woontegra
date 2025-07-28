import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  woo_price: number;
  trendyol_price: number;
  woo_stock: number;
  trendyol_stock: number;
  price_diff: number;
  stock_diff: number;
  needs_update: boolean;
}

interface UpdateData {
  product_id: number;
  platform: 'woocommerce' | 'trendyol';
  price?: number;
  stock?: number;
}

const StockPriceUpdate: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/stocks-prices?filter=${filter}`);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Lütfen güncellenecek ürünleri seçin');
      return;
    }

    const updates: UpdateData[] = [];
    products.forEach(product => {
      if (selectedProducts.has(product.id)) {
        if (product.price_diff !== 0) {
          updates.push({
            product_id: product.id,
            platform: 'trendyol',
            price: product.woo_price
          });
        }
        if (product.stock_diff !== 0) {
          updates.push({
            product_id: product.id,
            platform: 'trendyol',
            stock: product.woo_stock
          });
        }
      }
    });

    if (updates.length === 0) {
      toast.error('Seçilen ürünlerde güncellenecek veri bulunamadı');
      return;
    }

    try {
      setUpdating(true);
      const response = await axios.post('/api/products/update-stock-price', {
        updates
      });

      toast.success(response.data.message);
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Ürünler güncellenirken hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const getPriceDiffColor = (diff: number) => {
    if (diff === 0) return 'text-gray-600';
    if (diff > 0) return 'text-green-600';
    return 'text-red-600';
  };

  const getStockDiffColor = (diff: number) => {
    if (diff === 0) return 'text-gray-600';
    if (diff > 0) return 'text-green-600';
    return 'text-red-600';
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 font-semibold';
    if (stock < 10) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stok ve Fiyat Güncellemeleri</h1>
        <p className="text-gray-600">WooCommerce ve Trendyol arasındaki stok ve fiyat farklarını görüntüleyin ve güncelleyin</p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Ürünler</option>
            <option value="needs_update">Güncelleme Gerekenler</option>
            <option value="low_stock">Düşük Stok</option>
          </select>

          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {selectedProducts.size === products.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
          </button>
          <button
            onClick={handleBulkUpdate}
            disabled={selectedProducts.size === 0 || updating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {updating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Güncelleniyor...
              </span>
            ) : (
              `Seçilenleri Güncelle (${selectedProducts.size})`
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Toplam Ürün</div>
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Güncelleme Gereken</div>
          <div className="text-2xl font-bold text-orange-600">
            {products.filter(p => p.needs_update).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Düşük Stok</div>
          <div className="text-2xl font-bold text-red-600">
            {products.filter(p => p.woo_stock < 10 || p.trendyol_stock < 10).length}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Ürünler yükleniyor...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Ürün bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WooCommerce
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trendyol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fark
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{formatPrice(product.woo_price)}</div>
                        <div className={`text-sm ${getStockStatusColor(product.woo_stock)}`}>
                          Stok: {product.woo_stock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{formatPrice(product.trendyol_price)}</div>
                        <div className={`text-sm ${getStockStatusColor(product.trendyol_stock)}`}>
                          Stok: {product.trendyol_stock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-medium ${getPriceDiffColor(product.price_diff)}`}>
                          {product.price_diff > 0 ? '+' : ''}{formatPrice(product.price_diff)}
                        </div>
                        <div className={`text-sm ${getStockDiffColor(product.stock_diff)}`}>
                          Stok: {product.stock_diff > 0 ? '+' : ''}{product.stock_diff}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.needs_update ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Güncelleme Gerekli
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Güncel
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockPriceUpdate; 