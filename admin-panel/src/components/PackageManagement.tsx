import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Package {
  id: number;
  name: string;
  slug: string;
  max_products: number;
  max_integrations: number;
  max_users: number;
  price: number;
  description: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  tenants?: Array<{
    id: number;
    name: string;
    status: string;
  }>;
}

interface PackageFormData {
  name: string;
  slug: string;
  max_products: number;
  max_integrations: number;
  max_users: number;
  price: number;
  description: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

const PackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    slug: '',
    max_products: 100,
    max_integrations: 5,
    max_users: 3,
    price: 0,
    description: '',
    features: [],
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPackages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingPackage) {
        // Update existing package
        await axios.put(`http://localhost:3000/api/packages/${editingPackage.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new package
        await axios.post('http://localhost:3000/api/packages', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowForm(false);
      setEditingPackage(null);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
    }
  };

  const handleEdit = (packageItem: Package) => {
    setEditingPackage(packageItem);
    setFormData({
      name: packageItem.name,
      slug: packageItem.slug,
      max_products: packageItem.max_products,
      max_integrations: packageItem.max_integrations,
      max_users: packageItem.max_users,
      price: packageItem.price,
      description: packageItem.description || '',
      features: packageItem.features || [],
      is_active: packageItem.is_active,
      sort_order: packageItem.sort_order
    });
    setShowForm(true);
  };

  const handleDelete = async (packageId: number) => {
    if (!window.confirm('Bu paketi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/packages/${packageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      max_products: 100,
      max_integrations: 5,
      max_users: 3,
      price: 0,
      description: '',
      features: [],
      is_active: true,
      sort_order: 0
    });
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">📦 Paket Yönetimi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Yeni Paket Ekle
        </button>
      </div>

      {/* Package Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPackage ? 'Paket Düzenle' : 'Yeni Paket Ekle'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paket Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksimum Ürün
                  </label>
                  <input
                    type="number"
                    value={formData.max_products}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_products: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksimum Entegrasyon
                  </label>
                  <input
                    type="number"
                    value={formData.max_integrations}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_integrations: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksimum Kullanıcı
                  </label>
                  <input
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_users: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sıralama
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <select
                    value={formData.is_active.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Pasif</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Özellikler
                </label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Özellik açıklaması"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    + Özellik Ekle
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPackage(null);
                    resetForm();
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPackage ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((packageItem) => (
          <div key={packageItem.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{packageItem.name}</h3>
                  <p className="text-sm text-gray-500">{packageItem.slug}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(packageItem)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(packageItem.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fiyat:</span>
                  <span className="text-sm font-semibold">₺{packageItem.price.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maks. Ürün:</span>
                  <span className="text-sm font-semibold">{packageItem.max_products}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maks. Entegrasyon:</span>
                  <span className="text-sm font-semibold">{packageItem.max_integrations}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maks. Kullanıcı:</span>
                  <span className="text-sm font-semibold">{packageItem.max_users}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Durum:</span>
                  <span className={`text-sm font-semibold ${packageItem.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {packageItem.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                
                {packageItem.tenants && packageItem.tenants.length > 0 && (
                  <div className="pt-3 border-t">
                    <span className="text-sm text-gray-600">
                      {packageItem.tenants.length} kiracı kullanıyor
                    </span>
                  </div>
                )}
              </div>
              
              {packageItem.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">{packageItem.description}</p>
                </div>
              )}
              
              {packageItem.features && packageItem.features.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Özellikler:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {packageItem.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageManagement; 