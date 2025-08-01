import React, { useState, useEffect } from 'react';
import { Send, Eye, Package, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useProductContext } from '../contexts/ProductContext';

// WooProduct interface'ini genişlet
interface Product {
  id: number;
  name: string;
  price: string;
  stock_quantity: number;
  images: Array<{ src: string }>;
  categories: Array<{ id: number; name: string }>;
  description: string;
  trendyol_category?: {
    id: number;
    name: string;
  };
}

interface SendResponse {
  success: boolean;
  sent: number[];
  failed: Array<{
    id: number;
    reason: string;
  }>;
}

const ProductSend: React.FC = () => {
  // Global product context
  const { products: wooProducts, loading, fetchProducts } = useProductContext();
  
  // WooProduct'ları Product tipine cast et
  const products = wooProducts as Product[];
  
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null
  });

  // WooCommerce ürünlerini çek - sadece boşsa
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, []);

  const handleProductSelect = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSendProducts = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen gönderilecek ürünleri seçin');
      return;
    }

    try {
      setSending(true);
      toast.loading('Ürünler Trendyol\'a gönderiliyor...');

      const response = await axios.post<SendResponse>(
        'http://localhost:3001/api/trendyol/send-products',
        { productIds: selectedProducts },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const { sent, failed } = response.data;
        
        if (sent.length > 0) {
          toast.success(`${sent.length} ürün başarıyla gönderildi!`);
        }
        
        if (failed.length > 0) {
          toast.error(`${failed.length} ürün gönderilemedi. Detaylar için kontrol edin.`);
        }

        // Başarılı gönderilen ürünleri listeden çıkar
        setSelectedProducts([]);
        await fetchProducts(); // Listeyi yenile
      }
    } catch (error) {
      console.error('Ürün gönderimi hatası:', error);
      toast.error('Ürünler gönderilirken hata oluştu');
    } finally {
      setSending(false);
      toast.dismiss();
    }
  };

  const handlePreview = (product: Product) => {
    setPreviewModal({ open: true, product });
  };

  const getTrendyolPreviewData = (product: Product) => {
    if (!product.trendyol_category) {
      return null;
    }

    return {
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      stock: product.stock_quantity,
      categoryId: product.trendyol_category.id,
      images: product.images.map(img => img.src),
      brand: "Woontegra", // Varsayılan marka
      barcode: `WOON-${product.id}`, // Varsayılan barkod
      attributes: {
        "Renk": "Siyah", // Varsayılan özellikler
        "Beden": "M"
      }
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ürün Gönderimi</h1>
        <p className="text-gray-600">WooCommerce ürünlerini Trendyol'a gönderin</p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedProducts.length} ürün seçildi
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedProducts.length === products.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
            </button>
          </div>
          
          <button
            onClick={handleSendProducts}
            disabled={selectedProducts.length === 0 || sending}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>
              {sending ? 'Gönderiliyor...' : 'Seçilen Ürünleri Trendyol\'a Gönder'}
            </span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
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
                  Trendyol Kategorisi
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
              {products.map((product) => (
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
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.images[0]?.src || '/placeholder-product.png'}
                          alt={product.name}
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
                    ₺{product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.trendyol_category ? (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-900">
                          {product.trendyol_category.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-600">Eşleşme Yok</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.trendyol_category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Hazır
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Kategori Eşleşmesi Gerekli
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handlePreview(product)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Önizle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal.open && previewModal.product && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Trendyol'a Gönderilecek Veri
              </h3>
              <button
                onClick={() => setPreviewModal({ open: false, product: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Ürün Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Ürün Adı:</span> {previewModal.product.name}
                    </div>
                    <div>
                      <span className="font-medium">Fiyat:</span> ₺{previewModal.product.price}
                    </div>
                    <div>
                      <span className="font-medium">Stok:</span> {previewModal.product.stock_quantity}
                    </div>
                    <div>
                      <span className="font-medium">Kategori:</span> {previewModal.product.trendyol_category?.name || 'Eşleşme Yok'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Trendyol JSON Verisi</h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(getTrendyolPreviewData(previewModal.product), null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPreviewModal({ open: false, product: null })}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSend; 