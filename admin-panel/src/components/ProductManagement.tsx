import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  external_id?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id?: number;
  images: string[];
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    external_id: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    images: [''],
    status: 'active' as 'active' | 'inactive' | 'draft'
  });

  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
      'X-API-Key': localStorage.getItem('apiKey') || ''
    }
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/product-management');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/active');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const response = await api.post('/product-management/import');
      
      if (response.data.success) {
        const { summary } = response.data.data;
        toast.success(`Senkronizasyon tamamlandı! ${summary.imported} yeni, ${summary.updated} güncellendi, ${summary.skipped} atlandı`);
        fetchProducts();
      }
    } catch (error: any) {
      console.error('Error importing products:', error);
      toast.error(error.response?.data?.message || 'Senkronizasyon sırasında hata oluştu');
    } finally {
      setImporting(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        images: formData.images.filter(img => img.trim() !== '')
      };

      await api.post('/product-management', productData);
      toast.success('Ürün başarıyla eklendi');
      setShowAddModal(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Ürün eklenirken hata oluştu');
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        images: formData.images.filter(img => img.trim() !== '')
      };

      await api.put(`/product-management/${selectedProduct.id}`, productData);
      toast.success('Ürün başarıyla güncellendi');
      setShowEditModal(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Ürün güncellenirken hata oluştu');
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setDeleting(selectedProduct.id);
      await api.delete(`/product-management/${selectedProduct.id}`);
      toast.success('Ürün başarıyla silindi');
      setShowDeleteModal(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'Ürün silinirken hata oluştu');
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      external_id: '',
      name: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      images: [''],
      status: 'active'
    });
  };

  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      external_id: product.external_id || '',
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category_id: product.category_id?.toString() || '',
      images: product.images.length > 0 ? product.images : [''],
      status: product.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImageField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '-';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Ürün Detayları</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    );
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            disabled={importing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? 'Senkronizasyon...' : 'Senkronizasyon'}
          </button>
          <button
            onClick={openAddModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Ürün ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="draft">Taslak</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürün
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fiyat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
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
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.external_id || 'Yerel ürün'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getCategoryName(product.category_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                    {product.status === 'active' ? 'Aktif' : product.status === 'inactive' ? 'Pasif' : 'Taslak'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDetailModal(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Detay
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => openDeleteModal(product)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Ürün bulunamadı
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)}>
        {selectedProduct && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Ürün Adı</h3>
              <p>{selectedProduct.name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Açıklama</h3>
              <p>{selectedProduct.description || '-'}</p>
            </div>
            <div>
              <h3 className="font-semibold">Fiyat</h3>
              <p>{formatPrice(selectedProduct.price)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Stok</h3>
              <p>{selectedProduct.stock}</p>
            </div>
            <div>
              <h3 className="font-semibold">Kategori</h3>
              <p>{getCategoryName(selectedProduct.category_id)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Durum</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProduct.status)}`}>
                {selectedProduct.status === 'active' ? 'Aktif' : selectedProduct.status === 'inactive' ? 'Pasif' : 'Taslak'}
              </span>
            </div>
            {selectedProduct.images.length > 0 && (
              <div>
                <h3 className="font-semibold">Görseller</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Ürün görseli ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Görsel+Yüklenemedi';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal || showEditModal} onClose={() => { setShowAddModal(false); setShowEditModal(false); }}>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{showAddModal ? 'Yeni Ürün Ekle' : 'Ürün Düzenle'}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dış ID</label>
              <input
                type="text"
                value={formData.external_id}
                onChange={(e) => setFormData({...formData, external_id: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Dış sistem ID'si (opsiyonel)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ürün Adı *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Ürün adı"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              placeholder="Ürün açıklaması"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fiyat *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stok</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategori</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Kategori Seçin</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Durum</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="draft">Taslak</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Görseller</label>
            <div className="space-y-2">
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => updateImageField(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Görsel URL'si"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Sil
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Görsel Ekle
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={showAddModal ? handleAddProduct : handleEditProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showAddModal ? 'Ekle' : 'Güncelle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Ürün Sil</h2>
          <p>
            <strong>{selectedProduct?.name}</strong> ürününü silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={handleDeleteProduct}
              disabled={deleting === selectedProduct?.id}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {deleting === selectedProduct?.id ? 'Siliniyor...' : 'Sil'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagement; 