import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface WooCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface TrendyolCategory {
  id: number;
  name: string;
  parent_id: number | null;
}

interface CategoryMapping {
  id: number;
  woo_category_id: number;
  woo_category_name: string;
  trendyol_category_id: number;
  trendyol_category_name: string;
  is_active: boolean;
  created_at: string;
}

const CategoryMapping: React.FC = () => {
  const [wooCategories, setWooCategories] = useState<WooCategory[]>([]);
  const [trendyolCategories, setTrendyolCategories] = useState<TrendyolCategory[]>([]);
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedWooCategory, setSelectedWooCategory] = useState<number | ''>('');
  const [selectedTrendyolCategory, setSelectedTrendyolCategory] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const customerId = 1; // Demo customer ID

      const [wooRes, trendyolRes, mappingsRes] = await Promise.all([
        axios.get(`/api/categories/woocommerce?customer_id=${customerId}`),
        axios.get(`/api/categories/trendyol?customer_id=${customerId}`),
        axios.get(`/api/categories/mapping?customer_id=${customerId}`)
      ]);

      setWooCategories(wooRes.data.data.categories);
      setTrendyolCategories(trendyolRes.data.data.categories);
      setMappings(mappingsRes.data.data.mappings);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMapping = async () => {
    if (!selectedWooCategory || !selectedTrendyolCategory) {
      toast.error('Lütfen her iki kategoriyi de seçin');
      return;
    }

    const wooCategory = wooCategories.find(cat => cat.id === selectedWooCategory);
    const trendyolCategory = trendyolCategories.find(cat => cat.id === selectedTrendyolCategory);

    if (!wooCategory || !trendyolCategory) {
      toast.error('Seçilen kategoriler bulunamadı');
      return;
    }

    try {
      setSaving(true);
      const customerId = 1; // Demo customer ID

      await axios.post('/api/categories/mapping', {
        customer_id: customerId,
        woo_category_id: selectedWooCategory,
        woo_category_name: wooCategory.name,
        trendyol_category_id: selectedTrendyolCategory,
        trendyol_category_name: trendyolCategory.name
      });

      toast.success('Kategori eşleştirmesi başarıyla kaydedildi');
      
      // Reset form
      setSelectedWooCategory('');
      setSelectedTrendyolCategory('');
      
      // Refresh mappings
      fetchData();
    } catch (error: any) {
      console.error('Error saving mapping:', error);
      const message = error.response?.data?.message || 'Eşleştirme kaydedilirken hata oluştu';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMapping = async (mappingId: number, isActive: boolean) => {
    try {
      await axios.put(`/api/categories/mapping/${mappingId}`, {
        is_active: !isActive
      });

      toast.success('Eşleştirme durumu güncellendi');
      fetchData();
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const handleDeleteMapping = async (mappingId: number) => {
    if (!window.confirm('Bu eşleştirmeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axios.delete(`/api/categories/mapping/${mappingId}`);
      toast.success('Eşleştirme silindi');
      fetchData();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Eşleştirme silinirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
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
            Kategori Eşleştirme
          </h1>
          <p className="text-lg text-gray-600">
            WooCommerce ve Trendyol kategorilerini eşleştirin
          </p>
        </div>

        {/* Mapping Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Yeni Eşleştirme Oluştur
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WooCommerce Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WooCommerce Kategorisi
              </label>
              <select
                value={selectedWooCategory}
                onChange={(e) => setSelectedWooCategory(Number(e.target.value) || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kategori seçin</option>
                {wooCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count} ürün)
                  </option>
                ))}
              </select>
            </div>

            {/* Trendyol Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trendyol Kategorisi
              </label>
              <select
                value={selectedTrendyolCategory}
                onChange={(e) => setSelectedTrendyolCategory(Number(e.target.value) || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kategori seçin</option>
                {trendyolCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveMapping}
              disabled={saving || !selectedWooCategory || !selectedTrendyolCategory}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                'Eşleştirmeyi Kaydet'
              )}
            </button>
          </div>
        </div>

        {/* Existing Mappings */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Mevcut Eşleştirmeler ({mappings.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WooCommerce
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trendyol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Henüz eşleştirme bulunmuyor
                    </td>
                  </tr>
                ) : (
                  mappings.map((mapping) => (
                    <tr key={mapping.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {mapping.woo_category_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {mapping.woo_category_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {mapping.trendyol_category_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {mapping.trendyol_category_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          mapping.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {mapping.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(mapping.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleMapping(mapping.id, mapping.is_active)}
                            className={`text-sm px-3 py-1 rounded ${
                              mapping.is_active
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {mapping.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                          </button>
                          <button
                            onClick={() => handleDeleteMapping(mapping.id)}
                            className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryMapping; 