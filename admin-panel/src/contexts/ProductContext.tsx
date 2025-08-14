import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { cacheStorage } from '../utils/cacheStorage';

interface WooProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number;
  stock_status: string;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  sku: string;
  status: string;
  date_created: string;
  date_modified: string;
  // WooCommerce'dan gelen gerçek alanlar
  tax_status: string;
  tax_class: string;
  type: string;
  brand?: string; // Eğer WooCommerce'da brand alanı varsa
  attributes?: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
}

interface ProductContextType {
  products: WooProduct[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  lastFetchTime: number | null;
  fetchProducts: (forceRefresh?: boolean) => Promise<void>;
  clearProducts: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Ürün verilerini sıkıştır
  const compressProductData = (productsData: WooProduct[]): string => {
    const compressedProducts = productsData.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      stock_quantity: product.stock_quantity,
      stock_status: product.stock_status,
      images: product.images.map(img => ({
        src: img.src,
        alt: img.alt
      })),
      categories: product.categories.map(cat => ({
        id: cat.id,
        name: cat.name
      })),
      sku: product.sku,
      status: product.status,
      // Yeni alanları ekle
      tax_status: product.tax_status,
      tax_class: product.tax_class,
      type: product.type,
      brand: product.brand,
      attributes: product.attributes
      // description ve date alanları kaldırıldı (çok büyük)
    }));
    
    return JSON.stringify(compressedProducts);
  };

  // Sıkıştırılmış veriyi genişlet
  const decompressProductData = (compressedData: string): WooProduct[] => {
    const compressedProducts = JSON.parse(compressedData);
    return compressedProducts.map((product: any) => ({
      ...product,
      description: '', // Boş description
      date_created: new Date().toISOString(),
      date_modified: new Date().toISOString(),
      images: product.images.map((img: any) => ({
        ...img,
        id: 0,
        name: img.alt || ''
      })),
      // Eksik alanları ekle
      tax_status: product.tax_status || 'taxable',
      tax_class: product.tax_class || 'standard',
      type: product.type || 'simple',
      brand: product.brand || '',
      attributes: product.attributes || [],
      categories: product.categories.map((cat: any) => ({
        ...cat,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-')
      }))
    }));
  };

  const fetchProducts = async (forceRefresh: boolean = false) => {
    const startTime = Date.now();
    
    // Cache kontrolü
    if (!forceRefresh && !hasLoaded) {
      const cachedProducts = await cacheStorage.get('woo_products');
      if (cachedProducts) {
        try {
          const parsedProducts = decompressProductData(cachedProducts);
          console.log('📦 Cache\'den ürünler yüklendi:', parsedProducts.length, 'ürün');
          setProducts(parsedProducts);
          setHasLoaded(true);
          setLastFetchTime(Date.now());
          
          // Arka planda güncel verileri çek (lazy update)
          setTimeout(() => {
            fetchProductsFromAPI();
          }, 100);
          
          return;
        } catch (error) {
          console.error('Cache parse hatası:', error);
          await cacheStorage.delete('woo_products');
        }
      }
    }
    
    // API'den veri çek
    await fetchProductsFromAPI();
  };

  const fetchProductsFromAPI = async () => {
    const startTime = Date.now();
    
    // Cache kontrolü - eğer daha önce yüklendiyse ve force refresh değilse, tekrar yükleme
    if (hasLoaded && products.length > 0) {
      console.log('📦 Ürünler zaten yüklü, cache kullanılıyor');
      return;
    }
    
    console.log('🔄 API\'den ürünler getiriliyor...');
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/woocommerce/products');
      
      const duration = Date.now() - startTime;
      
      if (response.data.success) {
        const productsData = response.data.data;
        console.log('Debug: API response data:', productsData);
        console.log('Debug: productsData type:', typeof productsData);
        console.log('Debug: productsData isArray:', Array.isArray(productsData));
        
        if (Array.isArray(productsData)) {
          setProducts(productsData);
          setHasLoaded(true);
          setLastFetchTime(Date.now());
          
          // Cache'e kaydet - sıkıştırılmış veri
          const compressedData = compressProductData(productsData);
          const cacheSuccess = await cacheStorage.set('woo_products', compressedData);
          
          if (cacheSuccess) {
            console.log('💾 Ürünler cache\'e kaydedildi (sıkıştırılmış)');
          } else {
            console.warn('Cache kaydedilemedi, veriler sadece memory\'de tutulacak');
          }
          
          console.log(`✅ Ürünler başarıyla getirildi - Ürün Sayısı: ${productsData.length}, Süre: ${duration}ms`);
        } else {
          throw new Error('API yanıtı geçerli bir ürün listesi değil');
        }
      } else {
        throw new Error(response.data.message || 'Ürünler getirilemedi');
      }
    } catch (error: any) {
      console.error('❌ Ürünler alınırken hata - Hata:', error.message, 'Süre:', Date.now() - startTime, 'ms', error);
      setError(error.response?.data?.message || error.message || 'Ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const clearProducts = async () => {
    setProducts([]);
    setHasLoaded(false);
    setLastFetchTime(null);
    setError(null);
    // Cache'i temizle
    await cacheStorage.delete('woo_products');
    console.log('🗑️ Cache temizlendi');
  };

  const value: ProductContextType = {
    products,
    loading,
    error,
    hasLoaded,
    lastFetchTime,
    fetchProducts,
    clearProducts
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}; 