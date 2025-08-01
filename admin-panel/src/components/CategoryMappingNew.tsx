import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface WooCommerceCategory {
  id: number;
  name: string;
  count: number;
  slug: string;
}

interface MarketplaceCategory {
  id: string;
  name: string;
  children?: MarketplaceCategory[];
}

interface CategoryMapping {
  id: number;
  local_category_id: string;
  local_category_name: string;
  marketplace: string;
  marketplace_category_id: string;
  marketplace_category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Marketplace {
  id: string;
  name: string;
  endpoint: string;
}

const CategoryMappingNew: React.FC = () => {
  const [wooCategories, setWooCategories] = useState<WooCommerceCategory[]>([]);
  const [marketplaceCategories, setMarketplaceCategories] = useState<MarketplaceCategory[]>([]);
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMappings, setSelectedMappings] = useState<{[key: string]: string}>({});
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('trendyol');
  
  const marketplaces: Marketplace[] = [
    { id: 'trendyol', name: 'Trendyol', endpoint: '/category-mappings/trendyol-categories' },
    { id: 'hepsiburada', name: 'Hepsiburada', endpoint: '/category-mappings/hepsiburada-categories' },
    { id: 'n11', name: 'N11', endpoint: '/category-mappings/n11-categories' },
    { id: 'ciceksepeti', name: 'Çiçeksepeti', endpoint: '/category-mappings/ciceksepeti-categories' },
    { id: 'pazarama', name: 'Pazarama', endpoint: '/category-mappings/pazarama-categories' }
  ];

  // WooCommerce kategorilerini getir
  const fetchWooCommerceCategories = async () => {
    try {
      const response = await api.get('/category-mappings/woo-categories');
      if (response.data.success) {
        setWooCategories(response.data.data);
      }
    } catch (error) {
      console.error('WooCommerce kategorileri getirilirken hata:', error);
      toast.error('WooCommerce kategorileri yüklenirken hata oluştu');
    }
  };

  // Pazaryeri kategorilerini getir
  const fetchMarketplaceCategories = async (marketplaceId: string) => {
    try {
      const marketplace = marketplaces.find(m => m.id === marketplaceId);
      if (!marketplace) return;
      
      const response = await api.get(marketplace.endpoint);
      if (response.data.success) {
        setMarketplaceCategories(response.data.data);
      }
    } catch (error) {
      console.error(`${marketplaceId} kategorileri getirilirken hata:`, error);
      toast.error(`${marketplaceId} kategorileri yüklenirken hata oluştu`);
    }
  };

  // Mevcut eşleştirmeleri getir
  const fetchMappings = async () => {
    try {
      const response = await api.get('/category-mappings');
      if (response.data.success) {
        setMappings(response.data.data);
        
        // Mevcut eşleştirmeleri selectedMappings'e yükle
        const existingMappings: {[key: string]: string} = {};
        response.data.data.forEach((mapping: CategoryMapping) => {
          if (mapping.marketplace === selectedMarketplace) {
            existingMappings[mapping.local_category_id] = mapping.marketplace_category_id;
          }
        });
        setSelectedMappings(existingMappings);
      }
    } catch (error) {
      console.error('Kategori eşleştirmeleri getirilirken hata:', error);
      toast.error('Kategori eşleştirmeleri yüklenirken hata oluştu');
    }
  };

  // Kategori seçimini güncelle
  const handleCategorySelection = (wooCategoryId: string, marketplaceCategoryId: string) => {
    setSelectedMappings(prev => ({
      ...prev,
      [wooCategoryId]: marketplaceCategoryId
    }));
  };

  // Tek kategori eşleştir
  const mapCategory = async (wooCategoryId: string, marketplaceCategoryId: string) => {
    if (!marketplaceCategoryId) {
      toast.error('Lütfen bir pazaryeri kategorisi seçin');
      return;
    }

    const wooCategory = wooCategories.find(cat => cat.id.toString() === wooCategoryId);
    const marketplaceCategory = findMarketplaceCategoryById(marketplaceCategories, marketplaceCategoryId);

    if (!wooCategory || !marketplaceCategory) {
      toast.error('Kategori bulunamadı');
      return;
    }

    try {
      const existingMapping = getExistingMapping(wooCategoryId);
      
      const mappingData = {
        local_category_id: wooCategoryId,
        local_category_name: wooCategory.name,
        marketplace: selectedMarketplace,
        marketplace_category_id: marketplaceCategoryId,
        marketplace_category_name: marketplaceCategory.name,
        is_active: true
      };

      if (existingMapping) {
        await api.put(`/category-mappings/${existingMapping.id}`, mappingData);
        toast.success('Kategori eşleştirmesi güncellendi!');
      } else {
        await api.post('/category-mappings', mappingData);
        toast.success('Kategori eşleştirmesi oluşturuldu!');
      }

      fetchMappings(); // Eşleştirmeleri yenile
    } catch (error) {
      console.error('Kategori eşleştirme hatası:', error);
      toast.error('Kategori eşleştirme işlemi başarısız');
    }
  };

  // Pazaryeri kategorisini ID ile bul
  const findMarketplaceCategoryById = (categories: MarketplaceCategory[], id: string): MarketplaceCategory | null => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children) {
        const found = findMarketplaceCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Pazaryeri kategorilerini düzleştir
  const flattenMarketplaceCategories = (categories: MarketplaceCategory[]): MarketplaceCategory[] => {
    const result: MarketplaceCategory[] = [];
    
    const flatten = (cats: MarketplaceCategory[], level = 0) => {
      cats.forEach(cat => {
        result.push({
          ...cat,
          name: '  '.repeat(level) + cat.name
        });
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, level + 1);
        }
      });
    };
    
    flatten(categories);
    return result;
  };

  // Mevcut eşleştirmeyi bul
  const getExistingMapping = (wooCategoryId: string) => {
    return mappings.find(mapping => 
      mapping.local_category_id === wooCategoryId && 
      mapping.marketplace === selectedMarketplace
    );
  };

  // Pazaryeri değiştiğinde
  const handleMarketplaceChange = (marketplaceId: string) => {
    setSelectedMarketplace(marketplaceId);
    setSelectedMappings({});
    fetchMarketplaceCategories(marketplaceId);
    fetchMappings();
  };

  // Verileri yükle
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWooCommerceCategories(),
        fetchMarketplaceCategories(selectedMarketplace),
        fetchMappings()
      ]);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMarketplace) {
      fetchMarketplaceCategories(selectedMarketplace);
      fetchMappings();
    }
  }, [selectedMarketplace]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const flatMarketplaceCategories = flattenMarketplaceCategories(marketplaceCategories);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Kategori Eşleştirme</h1>
        
        {/* Pazaryeri Seçimi */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pazaryeri Seçin
          </label>
          <select
            value={selectedMarketplace}
            onChange={(e) => handleMarketplaceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {marketplaces.map(marketplace => (
              <option key={marketplace.id} value={marketplace.id}>
                {marketplace.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* WooCommerce Kategorileri */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">WooCommerce Kategorileri</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {wooCategories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.count} ürün</p>
                </div>
                <div className="text-sm text-gray-500">
                  {getExistingMapping(category.id.toString()) ? (
                    <span className="text-green-600">✓ Eşleştirildi</span>
                  ) : (
                    <span className="text-red-600">✗ Eşleştirilmedi</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pazaryeri Kategorileri */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {marketplaces.find(m => m.id === selectedMarketplace)?.name} Kategorileri
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {flatMarketplaceCategories.map(category => (
              <div key={category.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <h3 className="font-medium text-gray-900">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eşleştirme Tablosu */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Kategori Eşleştirmeleri</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WooCommerce Kategorisi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pazaryeri Kategorisi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wooCategories.map(category => {
                const existingMapping = getExistingMapping(category.id.toString());
                const selectedCategoryId = selectedMappings[category.id.toString()];
                
                return (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.count} ürün</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={selectedCategoryId || ''}
                        onChange={(e) => handleCategorySelection(category.id.toString(), e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Kategori seçin</option>
                        {flatMarketplaceCategories.map(mpCategory => (
                          <option key={mpCategory.id} value={mpCategory.id}>
                            {mpCategory.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => mapCategory(category.id.toString(), selectedCategoryId || '')}
                        disabled={!selectedCategoryId}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {existingMapping ? 'Güncelle' : 'Eşleştir'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryMappingNew; 