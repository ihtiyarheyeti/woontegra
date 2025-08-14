import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface TrendyolCategory {
  id: number;
  name: string;
  leaf: boolean;
  subCategories: TrendyolCategory[];
}

interface SupplierAddress {
  id: number;
  name: string;
}

interface ShippingProvider {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
}

interface ProductMarketplaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductMarketplaceSettingsModal: React.FC<ProductMarketplaceSettingsModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [categories, setCategories] = useState<TrendyolCategory[]>([]);
  const [supplierAddresses, setSupplierAddresses] = useState<SupplierAddress[]>([]);
  const [shippingProviders, setShippingProviders] = useState<ShippingProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    supplierAddressId: '',
    shippingProviderId: '',
    fixedPriceIncrease: 0,
    percentagePriceIncrease: 0
  });

  const [attributeModalOpen, setAttributeModalOpen] = useState(false);

  // Axios interceptor'ları ekle
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    if (isOpen && product) {
      fetchData();
    }
  }, [isOpen, product]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Test authentication first
      try {
        await axios.get('/api/trendyol/test-auth');
      } catch (authError: any) {
        if (authError.response?.status === 401) {
          toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
      }

      // Fetch all data in parallel
      const [categoriesResponse, addressesResponse, providersResponse] = await Promise.all([
        axios.get('/api/trendyol/real-categories'),
        axios.get('/api/trendyol/supplier-addresses'),
        axios.get('/api/trendyol/static-providers')
      ]);

      if (categoriesResponse.data.success) {
        setCategories(categoriesResponse.data.data || categoriesResponse.data.categories || []);
      }

      if (addressesResponse.data.success) {
        setSupplierAddresses(addressesResponse.data.data || addressesResponse.data.addresses || []);
      }

      if (providersResponse.data.success) {
        setShippingProviders(providersResponse.data.data || providersResponse.data.providers || []);
      }

    } catch (error: any) {
      console.error('Veriler yüklenirken hata:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'fixedPriceIncrease' || name === 'percentagePriceIncrease' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSave = async () => {
    if (!product) return;

    try {
      setSaving(true);
      
      const response = await axios.post('/api/trendyol/product-settings', {
        productId: product.id,
        ...formData
      });

      if (response.data.success) {
        toast.success('Ayarlar başarıyla kaydedildi');
        onClose();
      } else {
        throw new Error(response.data.message || 'Kayıt başarısız');
      }
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      toast.error(error.response?.data?.message || 'Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    try {
      // Önce ayarları kaydet
      await handleSave();
      
      // Sonra Trendyol'a gönder
      const response = await axios.post('/api/trendyol/send-product', {
        productId: product?.id
      });

      if (response.data.success) {
        toast.success('Ürün başarıyla Trendyol\'a gönderildi!');
        onClose();
      } else {
        throw new Error(response.data.message || 'Gönderim başarısız');
      }
    } catch (error: any) {
      console.error('Kaydet ve gönder hatası:', error);
      toast.error(error.response?.data?.message || 'Ürün gönderilirken hata oluştu');
    }
  };

  const handleAttributeMapping = () => {
    setAttributeModalOpen(true);
    toast('Özellik eşleştirme özelliği yakında eklenecek');
  };

  if (!isOpen || !product) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {product.name} - Trendyol Ayarları
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-2 text-gray-600">Veriler yükleniyor...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Trendyol Kategori Eşleştirme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trendyol Kategori Eşleştirme
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Özellik Eşleştirme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Özellik Eşleştirme
                  </label>
                  <button
                    type="button"
                    onClick={handleAttributeMapping}
                    className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Özellik Eşleştirme
                  </button>
                </div>

                {/* Kargo Firması Seçimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kargo Firması Seçimi
                  </label>
                  <select
                    name="shippingProviderId"
                    value={formData.shippingProviderId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Kargo Firması Seçin</option>
                    {shippingProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Depo Seçimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depo Seçimi
                  </label>
                  <select
                    name="supplierAddressId"
                    value={formData.supplierAddressId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Depo Seçin</option>
                    {supplierAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fiyat Artırımı */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sabit Fiyat Artırımı (TL)
                    </label>
                    <input
                      type="number"
                      name="fixedPriceIncrease"
                      value={formData.fixedPriceIncrease}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yüzdelik Fiyat Artırımı (%)
                    </label>
                    <input
                      type="number"
                      name="percentagePriceIncrease"
                      value={formData.percentagePriceIncrease}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                onClick={handleSaveAndSend}
                disabled={saving}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'İşleniyor...' : 'Trendyol\'a Gönder'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductMarketplaceSettingsModal;
