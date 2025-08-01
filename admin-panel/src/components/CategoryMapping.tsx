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

interface TrendyolCategory {
  id: string;
  name: string;
  children?: TrendyolCategory[];
}

interface Marketplace {
  id: string;
  name: string;
  endpoint: string;
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

const CategoryMapping: React.FC = () => {
  const [wooCategories, setWooCategories] = useState<WooCommerceCategory[]>([]);
  const [marketplaceCategories, setMarketplaceCategories] = useState<MarketplaceCategory[]>([]);
  const [trendyolCategories, setTrendyolCategories] = useState<TrendyolCategory[]>([]);
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

  // Trendyol kategorilerini getir
  const fetchTrendyolCategories = async () => {
    try {
      const response = await api.get('/category-mappings/trendyol-categories');
      if (response.data.success) {
        setTrendyolCategories(response.data.data);
      }
    } catch (error) {
      console.error('Trendyol kategorileri getirilirken hata:', error);
      toast.error('Trendyol kategorileri yüklenirken hata oluştu');
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
          existingMappings[mapping.local_category_id] = mapping.marketplace_category_id;
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

  // Tek kategori eşleştir
  const mapCategory = async (wooCategoryId: string, marketplaceCategoryId: string) => {
    if (!marketplaceCategoryId) {
      toast.error('Lütfen bir pazaryeri kategorisi seçin');
      return;
    }

    const wooCategory = wooCategories.find(cat => cat.id.toString() === wooCategoryId);
    const marketplaceCategory = findMarketplaceCategoryById(marketplaceCategories, marketplaceCategoryId);

    if (!wooCategory || !marketplaceCategory) {
      toast.error('Kategori bilgileri bulunamadı');
      return;
    }

    try {
      // Mevcut eşleştirme var mı kontrol et
      const existingMapping = mappings.find(m => m.local_category_id === wooCategoryId);

      if (existingMapping) {
        // Güncelle
        await api.put(`/category-mappings/${existingMapping.id}`, {
          marketplace_category_id: marketplaceCategoryId,
          marketplace_category_name: marketplaceCategory.name
        });
        toast.success(`${wooCategory.name} kategorisi güncellendi`);
      } else {
        // Yeni oluştur
        await api.post('/category-mappings', {
          local_category_id: wooCategoryId,
          local_category_name: wooCategory.name,
          marketplace: 'trendyol',
          marketplace_category_id: marketplaceCategoryId,
          marketplace_category_name: marketplaceCategory.name
        });
        toast.success(`${wooCategory.name} kategorisi eşleştirildi`);
      }

      // Listeyi yenile
      await fetchMappings();
    } catch (error) {
      console.error('Kategori eşleştirme hatası:', error);
      toast.error('Kategori eşleştirme sırasında hata oluştu');
    }
  };

  // Trendyol kategorisini ID ile bul
  const findTrendyolCategoryById = (categories: TrendyolCategory[], id: string): TrendyolCategory | null => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children) {
        const found = findTrendyolCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Trendyol kategorilerini düz liste haline getir
  const flattenTrendyolCategories = (categories: TrendyolCategory[]): TrendyolCategory[] => {
    const result: TrendyolCategory[] = [];
    
    const flatten = (cats: TrendyolCategory[], level = 0) => {
      cats.forEach(cat => {
        result.push({
          ...cat,
          name: '─'.repeat(level) + ' ' + cat.name
        });
        if (cat.children) {
          flatten(cat.children, level + 1);
        }
      });
    };

    flatten(categories);
    return result;
  };

  // Mevcut eşleştirmeyi getir
  const getExistingMapping = (wooCategoryId: string) => {
    return mappings.find(m => m.local_category_id === wooCategoryId);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWooCommerceCategories(),
        fetchTrendyolCategories(),
        fetchMappings()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const flatTrendyolCategories = flattenTrendyolCategories(trendyolCategories);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Kategori Eşleştirme
        </h1>
        <p className="text-gray-600">
          WooCommerce kategorilerinizi Trendyol kategorileriyle eşleştirin
        </p>
      </div>

             <div className="bg-white rounded-lg shadow-md p-6">
         <div className="mb-6">
           <h2 className="text-xl font-semibold text-gray-800">
             Kategori Eşleştirmeleri
           </h2>
           <p className="text-sm text-gray-600 mt-1">
             {wooCategories.length} WooCommerce kategorisi bulundu
           </p>
         </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   WooCommerce Kategorisi
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Trendyol Kategorisi
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   İşlem
                 </th>
               </tr>
             </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wooCategories.map((wooCategory) => {
                const existingMapping = getExistingMapping(wooCategory.id.toString());
                const selectedCategoryId = selectedMappings[wooCategory.id.toString()] || '';

                return (
                  <tr key={wooCategory.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {wooCategory.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {wooCategory.id} • {wooCategory.count} ürün
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => handleCategorySelection(wooCategory.id.toString(), e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Kategori seçin</option>
                        {flatTrendyolCategories.map((trendyolCategory) => (
                          <option key={trendyolCategory.id} value={trendyolCategory.id}>
                            {trendyolCategory.name}
                          </option>
                        ))}
                      </select>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       {existingMapping ? (
                         <div className="flex items-center space-x-2">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             Eşleştirilmiş
                           </span>
                           <button
                             onClick={() => mapCategory(wooCategory.id.toString(), selectedCategoryId)}
                             disabled={!selectedCategoryId || selectedCategoryId === existingMapping.marketplace_category_id}
                             className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                           >
                             Güncelle
                           </button>
                         </div>
                       ) : (
                         <button
                           onClick={() => mapCategory(wooCategory.id.toString(), selectedCategoryId)}
                           disabled={!selectedCategoryId}
                           className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                         >
                           Eşleştir
                         </button>
                       )}
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {wooCategories.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">
              WooCommerce kategorisi bulunamadı
            </div>
            <p className="text-gray-400 mt-2">
              WooCommerce bağlantınızı kontrol edin
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryMapping; 