import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import BackButton from './BackButton';
import MarketplaceSendModal from './MarketplaceSendModal';

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Brand {
  id: number;
  name: string;
}

interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  combinations: Array<{
    id: string;
    values: string[];
    price: number;
    stock: number;
    sku: string;
    barcode: string;
    image?: string;
  }>;
}

interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  sku: string;
  barcode: string;
  status: 'active' | 'inactive';
  description: string;
  category_id: number | null;
  brand_id: number | null;
  seo_title: string;
  seo_description: string;
  main_image: string;
  gallery_images: string[];
  variants: ProductVariant[];
}

const AddNewProduct: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [lastCreatedProductId, setLastCreatedProductId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    stock: 0,
    sku: '',
    barcode: '',
    status: 'active',
    description: '',
    category_id: null,
    brand_id: null,
    seo_title: '',
    seo_description: '',
    main_image: '',
    gallery_images: [],
    variants: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch categories and brands
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchCategories = async () => {
    try {
              const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
              const response = await api.get('/brands');
      setBrands(response.data.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ürün adı zorunludur';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Fiyat 0\'dan büyük olmalıdır';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stok adedi negatif olamaz';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Kategori seçimi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File, type: 'main' | 'gallery'): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.data.url;
    } catch (error) {
      throw new Error('Görsel yüklenirken hata oluştu');
    }
  };

  // Handle main image change
  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await handleImageUpload(file, 'main');
        handleInputChange('main_image', imageUrl);
        toast.success('Ana görsel yüklendi');
      } catch (error) {
        toast.error('Ana görsel yüklenirken hata oluştu');
      }
    }
  };

  // Handle gallery images change
  const handleGalleryImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        const uploadPromises = files.map(file => handleImageUpload(file, 'gallery'));
        const imageUrls = await Promise.all(uploadPromises);
        handleInputChange('gallery_images', [...formData.gallery_images, ...imageUrls]);
        toast.success(`${files.length} görsel galeriye eklendi`);
      } catch (error) {
        toast.error('Galeri görselleri yüklenirken hata oluştu');
      }
    }
  };

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    const newGalleryImages = formData.gallery_images.filter((_, i) => i !== index);
    handleInputChange('gallery_images', newGalleryImages);
  };

  // Add variant
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: '',
      options: [],
      combinations: []
    };
    handleInputChange('variants', [...formData.variants, newVariant]);
  };

  // Remove variant
  const removeVariant = (index: number) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    handleInputChange('variants', newVariants);
  };

  // Update variant
  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    handleInputChange('variants', newVariants);
  };

  // Add variant option
  const addVariantOption = (variantIndex: number) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].options.push('');
    handleInputChange('variants', newVariants);
  };

  // Remove variant option
  const removeVariantOption = (variantIndex: number, optionIndex: number) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].options.splice(optionIndex, 1);
    handleInputChange('variants', newVariants);
  };

  // Update variant option
  const updateVariantOption = (variantIndex: number, optionIndex: number, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].options[optionIndex] = value;
    handleInputChange('variants', newVariants);
  };

  // Generate variant combinations
  const generateCombinations = (variantIndex: number) => {
    const variant = formData.variants[variantIndex];
    if (variant.options.length === 0) return;

    const combinations = variant.options.map((option, index) => ({
      id: `${variantIndex}-${index}`,
      values: [option],
      price: formData.price,
      stock: 0,
      sku: '',
      barcode: '',
      image: ''
    }));

    const newVariants = [...formData.variants];
    newVariants[variantIndex].combinations = combinations;
    handleInputChange('variants', newVariants);
  };

  // Update combination
  const updateCombination = (variantIndex: number, combinationIndex: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].combinations[combinationIndex] = {
      ...newVariants[variantIndex].combinations[combinationIndex],
      [field]: value
    };
    handleInputChange('variants', newVariants);
  };

  // Submit single product form
  const handleSingleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Lütfen form hatalarını düzeltin');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/products', formData);
      
      if (response.data.success) {
        toast.success('Ürün başarıyla eklendi!');
        
        // Ürün ID'sini kaydet ve modal'ı aç
        setLastCreatedProductId(response.data.data.id);
        setShowMarketplaceModal(true);
        
        // Form'u reset etme - kullanıcı modal'ı kapattıktan sonra reset edilecek
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Ürün eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for bulk upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleBulkUpload(file);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setPreviewData(response.data.data.preview);
        toast.success('Dosya başarıyla yüklendi ve önizleme hazırlandı');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Dosya yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  // Confirm bulk upload
  const confirmBulkUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('confirm', 'true');

      const response = await api.post('/api/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(`Başarıyla ${response.data.data.imported} ürün eklendi!`);
        setSelectedFile(null);
        setPreviewData([]);
      }
    } catch (error: any) {
      console.error('Error confirming bulk upload:', error);
      toast.error(error.response?.data?.message || 'Toplu yükleme sırasında hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/product-import-template.xlsx';
    link.download = 'urun-import-sablonu.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarketplaceModalClose = () => {
    setShowMarketplaceModal(false);
    setLastCreatedProductId(null);
    
    // Form'u reset et
    setFormData({
      name: '',
      price: 0,
      stock: 0,
      sku: '',
      barcode: '',
      status: 'active',
      description: '',
      category_id: null,
      brand_id: null,
      seo_title: '',
      seo_description: '',
      main_image: '',
      gallery_images: [],
      variants: []
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Yeni Ürün Ekle</h2>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('single')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'single'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tekli Ürün Ekle
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bulk'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Toplu Ürün Yükle
              </button>
            </nav>
          </div>

          {/* Single Product Tab */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleProductSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Temel Bilgiler</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ürün adını girin"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fiyat (TL) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stok Adedi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                      className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.stock ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SKU kodu"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barkod
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Barkod"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durum
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleInputChange('status', formData.status === 'active' ? 'inactive' : 'active')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.status === 'active' ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="ml-3 text-sm text-gray-700">
                        {formData.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category and Brand */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Kategori ve Marka</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : null)}
                      className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.category_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Kategori seçin</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marka
                    </label>
                    <select
                      value={formData.brand_id || ''}
                      onChange={(e) => handleInputChange('brand_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Marka seçin</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Açıklama</h3>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ürün açıklamasını girin..."
                />
              </div>

              {/* SEO */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO Bilgileri</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Başlığı
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => handleInputChange('seo_title', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SEO başlığı"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Açıklaması
                    </label>
                    <textarea
                      value={formData.seo_description}
                      onChange={(e) => handleInputChange('seo_description', e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SEO açıklaması"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Görseller</h3>
                
                <div className="space-y-6">
                  {/* Main Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ana Görsel
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {formData.main_image && (
                        <img
                          src={formData.main_image}
                          alt="Ana görsel"
                          className="h-20 w-20 object-cover rounded-md"
                        />
                      )}
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Galeri Görselleri
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImagesChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    
                    {formData.gallery_images.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.gallery_images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Galeri ${index + 1}`}
                              className="h-20 w-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Varyantlar</h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Varyant Ekle
                  </button>
                </div>

                {formData.variants.map((variant, variantIndex) => (
                  <div key={variant.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-800">Varyant {variantIndex + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeVariant(variantIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Kaldır
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Varyant Adı
                        </label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(variantIndex, 'name', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Örn: Beden, Renk"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => addVariantOption(variantIndex)}
                          className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          Seçenek Ekle
                        </button>
                      </div>
                    </div>

                    {/* Variant Options */}
                    {variant.options.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seçenekler
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {variant.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateVariantOption(variantIndex, optionIndex, e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Seçenek"
                              />
                              <button
                                type="button"
                                onClick={() => removeVariantOption(variantIndex, optionIndex)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => generateCombinations(variantIndex)}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Kombinasyonları Oluştur
                        </button>
                      </div>
                    )}

                    {/* Variant Combinations */}
                    {variant.combinations.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Varyant Kombinasyonları
                        </label>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kombinasyon</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Barkod</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {variant.combinations.map((combination, combinationIndex) => (
                                <tr key={combination.id}>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {combination.values.join(', ')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={combination.price}
                                      onChange={(e) => updateCombination(variantIndex, combinationIndex, 'price', parseFloat(e.target.value) || 0)}
                                      className="w-full p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={combination.stock}
                                      onChange={(e) => updateCombination(variantIndex, combinationIndex, 'stock', parseInt(e.target.value) || 0)}
                                      className="w-full p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={combination.sku}
                                      onChange={(e) => updateCombination(variantIndex, combinationIndex, 'sku', e.target.value)}
                                      className="w-full p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={combination.barcode}
                                      onChange={(e) => updateCombination(variantIndex, combinationIndex, 'barcode', e.target.value)}
                                      className="w-full p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ekleniyor...
                    </span>
                  ) : (
                    'Ürünü Ekle'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Bulk Upload Tab */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">
              {/* File Upload */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dosya Yükleme</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosya Seçin
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.csv,.xml"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Desteklenen formatlar: Excel (.xlsx), CSV (.csv), XML (.xml)
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Örnek Dosya İndir
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Önizleme</h3>
                    <button
                      type="button"
                      onClick={confirmBulkUpload}
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Yükleniyor...' : 'Ürünleri Ekle'}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün Adı</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.slice(0, 10).map((product, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.price} TL
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.sku || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.category || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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

                  {previewData.length > 10 && (
                    <p className="mt-4 text-sm text-gray-500">
                      Toplam {previewData.length} ürün bulundu. İlk 10 ürün gösteriliyor.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Marketplace Send Modal */}
      {lastCreatedProductId && (
        <MarketplaceSendModal
          isOpen={showMarketplaceModal}
          onClose={handleMarketplaceModalClose}
          productId={lastCreatedProductId}
          productName={formData.name}
        />
      )}
    </div>
  );
};

export default AddNewProduct; 