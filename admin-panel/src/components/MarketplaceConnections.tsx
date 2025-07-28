import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface MarketplaceConnection {
  id: number;
  customer_id: number;
  marketplace_name: string;
  store_name: string;
  api_key: string;
  api_secret: string;
  status: 'active' | 'passive';
  additional_config?: any;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
}

interface MarketplaceType {
  value: string;
  label: string;
}

const MarketplaceConnections: React.FC = () => {
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [marketplaceTypes, setMarketplaceTypes] = useState<MarketplaceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<MarketplaceConnection | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingConnection, setDeletingConnection] = useState<MarketplaceConnection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    marketplace_name: '',
    store_name: '',
    api_key: '',
    api_secret: '',
    status: 'active' as 'active' | 'passive',
    additional_config: {}
  });

  const navigate = useNavigate();

  // API instance
  const api = {
    get: async (url: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
    post: async (url: string, data: any) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    put: async (url: string, data: any) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000${url}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    delete: async (url: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000${url}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    }
  };

  // Bağlantıları getir
  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/marketplace-connections');
      if (response.success) {
        setConnections(response.data);
      } else {
        toast.error('Bağlantılar yüklenirken hata oluştu');
      }
    } catch (error) {
      toast.error('Bağlantılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Pazaryeri türlerini getir
  const fetchMarketplaceTypes = async () => {
    try {
      const response = await api.get('/api/marketplace-connections/types');
      if (response.success) {
        setMarketplaceTypes(response.data);
      }
    } catch (error) {
      console.error('Pazaryeri türleri yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchMarketplaceTypes();
  }, []);

  // Form verilerini güncelle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Modal'ı aç
  const openModal = (connection?: MarketplaceConnection) => {
    if (connection) {
      setEditingConnection(connection);
      setFormData({
        marketplace_name: connection.marketplace_name,
        store_name: connection.store_name,
        api_key: '',
        api_secret: '',
        status: connection.status,
        additional_config: connection.additional_config || {}
      });
    } else {
      setEditingConnection(null);
      setFormData({
        marketplace_name: '',
        store_name: '',
        api_key: '',
        api_secret: '',
        status: 'active',
        additional_config: {}
      });
    }
    setShowModal(true);
  };

  // Modal'ı kapat
  const closeModal = () => {
    setShowModal(false);
    setEditingConnection(null);
    setFormData({
      marketplace_name: '',
      store_name: '',
      api_key: '',
      api_secret: '',
      status: 'active',
      additional_config: {}
    });
  };

  // Bağlantı kaydet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marketplace_name || !formData.store_name || !formData.api_key || !formData.api_secret) {
      toast.error('Tüm zorunlu alanları doldurun');
      return;
    }

    try {
      let response;
      if (editingConnection) {
        // Güncelleme
        const updateData: any = { ...formData };
        if (!updateData.api_key) delete updateData.api_key;
        if (!updateData.api_secret) delete updateData.api_secret;
        
        response = await api.put(`/api/marketplace-connections/${editingConnection.id}`, updateData);
      } else {
        // Yeni oluşturma
        response = await api.post('/api/marketplace-connections', formData);
      }

      if (response.success) {
        toast.success(editingConnection ? 'Bağlantı güncellendi' : 'Bağlantı oluşturuldu');
        closeModal();
        fetchConnections();
      } else {
        toast.error(response.message || 'Bir hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  // Silme modal'ını aç
  const openDeleteModal = (connection: MarketplaceConnection) => {
    setDeletingConnection(connection);
    setShowDeleteModal(true);
  };

  // Bağlantıyı sil
  const handleDelete = async () => {
    if (!deletingConnection) return;

    try {
      const response = await api.delete(`/api/marketplace-connections/${deletingConnection.id}`);
      if (response.success) {
        toast.success('Bağlantı silindi');
        setShowDeleteModal(false);
        setDeletingConnection(null);
        fetchConnections();
      } else {
        toast.error(response.message || 'Silme işlemi başarısız');
      }
    } catch (error) {
      toast.error('Silme işlemi sırasında hata oluştu');
    }
  };

  // Filtreleme
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.marketplace_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || connection.status === statusFilter;
    const matchesMarketplace = marketplaceFilter === 'all' || connection.marketplace_name === marketplaceFilter;
    
    return matchesSearch && matchesStatus && matchesMarketplace;
  });

  // Pazaryeri adını getir
  const getMarketplaceLabel = (value: string) => {
    const type = marketplaceTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  // Durum badge'i
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {status === 'active' ? 'Aktif' : 'Pasif'}
    </span>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pazaryeri Bağlantıları</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>+</span>
          Yeni Bağlantı
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
            <input
              type="text"
              placeholder="Mağaza adı veya pazaryeri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pazaryeri</label>
            <select
              value={marketplaceFilter}
              onChange={(e) => setMarketplaceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tümü</option>
              {marketplaceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setMarketplaceFilter('all');
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Bağlantılar Tablosu */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pazaryeri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mağaza Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Anahtarı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oluşturulma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConnections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {connections.length === 0 ? 'Henüz bağlantı bulunmuyor' : 'Filtrelere uygun bağlantı bulunamadı'}
                  </td>
                </tr>
              ) : (
                filteredConnections.map((connection) => (
                  <tr key={connection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getMarketplaceLabel(connection.marketplace_name)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{connection.store_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{connection.api_key}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={connection.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(connection.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(connection)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => openDeleteModal(connection)}
                          className="text-red-600 hover:text-red-900"
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

      {/* Ekleme/Düzenleme Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingConnection ? 'Bağlantıyı Düzenle' : 'Yeni Bağlantı'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pazaryeri *
                    </label>
                    <select
                      name="marketplace_name"
                      value={formData.marketplace_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Pazaryeri seçin</option>
                      {marketplaceTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mağaza Adı *
                    </label>
                    <input
                      type="text"
                      name="store_name"
                      value={formData.store_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mağaza adını girin"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Anahtarı {!editingConnection && '*'}
                    </label>
                    <input
                      type="password"
                      name="api_key"
                      value={formData.api_key}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={editingConnection ? 'Değiştirmek için doldurun' : 'API anahtarını girin'}
                      required={!editingConnection}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Gizli Anahtarı {!editingConnection && '*'}
                    </label>
                    <input
                      type="password"
                      name="api_secret"
                      value={formData.api_secret}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={editingConnection ? 'Değiştirmek için doldurun' : 'API gizli anahtarını girin'}
                      required={!editingConnection}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durum
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Aktif</option>
                      <option value="passive">Pasif</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingConnection ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modal */}
      {showDeleteModal && deletingConnection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bağlantıyı Sil</h3>
              <p className="text-sm text-gray-500 mb-4">
                "{deletingConnection.store_name}" bağlantısını silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingConnection(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceConnections; 