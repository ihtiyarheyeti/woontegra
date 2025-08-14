import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import BackButton from './BackButton';

interface Product {
  id: number;
  name: string;
  sku?: string;
  seller_sku?: string;
  price?: number;
  sale_price?: number;
  stock_quantity?: number;
  stock?: number;
  tax_rate?: number;
  brand?: string;
  category?: string;
  product_type?: 'simple' | 'variable';
  status: 'active' | 'inactive';
  image_url?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  marketplace_status?: {
    trendyol: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: 0,
    sale_price: 0,
    stock_quantity: 0,
    tax_rate: 0,
    brand: '',
    category: '',
    product_type: 'simple' as 'simple' | 'variable',
    status: 'active' as 'active' | 'inactive',
    barcode: '',
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    }
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      
      if (response.data.success) {
        const productData = response.data.data || response.data.product;
        
        if (!productData) {
          console.error('Ürün verisi bulunamadı. Response:', response.data);
          throw new Error('Ürün verisi bulunamadı');
        }

        // Status alanını doğru tipe dönüştür
        const normalizedProductData: Product = {
          ...productData,
          status: (productData.status === 'active' || productData.status === 'inactive'
            ? productData.status
            : 'inactive') as 'active' | 'inactive',
          marketplace_status: productData.marketplace_status || { trendyol: false }
        };

        setProduct(normalizedProductData);
        setFormData({
          name: productData.name || '',
          sku: productData.seller_sku || productData.sku || '',
          price: productData.price || 0,
          sale_price: productData.sale_price || 0,
          stock_quantity: productData.stock || productData.stock_quantity || 0,
          tax_rate: productData.tax_rate || 0,
          brand: productData.brand || '',
          category: productData.category || '',
          product_type: productData.product_type || 'simple',
          status: normalizedProductData.status,
          barcode: productData.barcode || '',
          weight: productData.weight || 0,
          dimensions: productData.dimensions || { length: 0, width: 0, height: 0 }
        });
      } else {
        throw new Error(response.data.message || 'Ürün yüklenirken hata oluştu');
      }
    } catch (error: any) {
      console.error('Ürün yüklenirken hata:', error);
      toast.error(error.message || 'Ürün yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('dimensions.')) {
      const dimension = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimension]: parseFloat(value) || 0
        }
      }));
    } else if (name === 'price' || name === 'sale_price' || name === 'stock_quantity' || name === 'tax_rate' || name === 'weight') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put(`/products/${id}`, formData);
      
      if (response.data.success) {
        toast.success('Ürün başarıyla güncellendi');
        fetchProduct(); // Güncel veriyi yeniden çek
      } else {
        throw new Error(response.data.message || 'Güncelleme başarısız');
      }
    } catch (error: any) {
      console.error('Güncelleme hatası:', error);
      toast.error(error.message || 'Ürün güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ürün yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Ürün bulunamadı</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ürünlere Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Ürün Detayı</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ürün Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Adı
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Fiyat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat (TL)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* İndirimli Fiyat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İndirimli Fiyat (TL)
                </label>
                <input
                  type="number"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stok Miktarı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stok Miktarı
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* KDV Oranı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KDV Oranı (%)
                </label>
                <input
                  type="number"
                  name="tax_rate"
                  value={formData.tax_rate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Marka */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marka
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ürün Tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Tipi
                </label>
                <select
                  name="product_type"
                  value={formData.product_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="simple">Basit Ürün</option>
                  <option value="variable">Varyasyonlu Ürün</option>
                </select>
              </div>

              {/* Durum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>

              {/* Barkod */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barkod
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ağırlık */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ağırlık (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Boyutlar */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Boyutlar (cm)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uzunluk
                  </label>
                  <input
                    type="number"
                    name="dimensions.length"
                    value={formData.dimensions.length}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genişlik
                  </label>
                  <input
                    type="number"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yükseklik
                  </label>
                  <input
                    type="number"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
