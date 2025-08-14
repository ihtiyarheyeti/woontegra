import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import BackButton from './BackButton';

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
}

interface MarketplaceType {
  value: string;
  label: string;
}

interface ConnectionFormData {
  marketplace_name: string;
  store_name: string;
  api_key: string;
  api_secret: string;
  additional_config: string;
  status: 'active' | 'passive';
}

const UserConnections: React.FC = () => {
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [marketplaceTypes, setMarketplaceTypes] = useState<MarketplaceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<MarketplaceConnection | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingConnection, setDeletingConnection] = useState<MarketplaceConnection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ConnectionFormData>();

  // API instance with authentication
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

  // Fetch connections
  const fetchConnections = async () => {
    try {
      setLoading(true);
              const response = await api.get('/user-connections');
      if (response.success) {
        setConnections(response.data);
      } else {
        toast.error(response.message || 'Bağlantılar yüklenirken hata oluştu');
      }
    } catch (error) {
      toast.error('Bağlantılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch marketplace types
  const fetchMarketplaceTypes = async () => {
    try {
              const response = await api.get('/user-connections/types/marketplaces');
      if (response.success) {
        setMarketplaceTypes(response.data);
      }
    } catch (error) {
      console.error('Error fetching marketplace types:', error);
    }
  };

  // Form submit handler
  const onSubmit = async (data: ConnectionFormData) => {
    try {
      let response;
      if (editingConnection) {
        response = await api.put(`/api/user-connections/${editingConnection.id}`, data);
      } else {
        response = await api.post('/api/user-connections', data);
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

  // Open modal for add/edit
  const openModal = (connection?: MarketplaceConnection) => {
    if (connection) {
      setEditingConnection(connection);
      reset({
        marketplace_name: connection.marketplace_name,
        store_name: connection.store_name,
        api_key: '',
        api_secret: '',
        additional_config: connection.additional_config ? JSON.stringify(connection.additional_config) : '',
        status: connection.status
      });
    } else {
      setEditingConnection(null);
      reset({
        marketplace_name: '',
        store_name: '',
        api_key: '',
        api_secret: '',
        additional_config: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingConnection(null);
    reset();
  };

  // Delete connection
  const handleDelete = async () => {
    if (!deletingConnection) return;

    try {
      const response = await api.delete(`/api/user-connections/${deletingConnection.id}`);
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

  // Toggle API key visibility
  const toggleApiKeyVisibility = (connectionId: number) => {
    setShowApiKeys(prev => ({
      ...prev,
      [connectionId]: !prev[connectionId]
    }));
  };

  // Mask API key
  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return '';
    return '***' + apiKey.slice(-4);
  };

  // Get marketplace label
  const getMarketplaceLabel = (value: string) => {
    const type = marketplaceTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  // Filter connections
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.marketplace_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || connection.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {status === 'active' ? 'Aktif' : 'Pasif'}
    </span>
  );

  useEffect(() => {
    fetchConnections();
    fetchMarketplaceTypes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Pazaryeri Bağlantılarım</h2>
            <button
              onClick={() => openModal()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              + Yeni Bağlantı Ekle
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </div>

          {/* Connections Table */}
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
                    API Anahtarları
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
                {filteredConnections.map((connection) => (
                  <tr key={connection.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {getMarketplaceLabel(connection.marketplace_name)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{connection.store_name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>API Key: {showApiKeys[connection.id] ? connection.api_key : maskApiKey(connection.api_key)}</div>
                        <div>API Secret: {showApiKeys[connection.id] ? connection.api_secret : maskApiKey(connection.api_secret)}</div>
                        <button
                          onClick={() => toggleApiKeyVisibility(connection.id)}
                          className="text-indigo-600 hover:text-indigo-900 text-xs"
                        >
                          {showApiKeys[connection.id] ? 'Gizle' : 'Göster'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={connection.status} />
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
                          onClick={() => {
                            setDeletingConnection(connection);
                            setShowDeleteModal(true);
                          }}
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
          </div>

          {filteredConnections.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz bağlantı bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingConnection ? 'Bağlantıyı Düzenle' : 'Yeni Bağlantı Ekle'}
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pazaryeri *
                  </label>
                  <select
                    {...register('marketplace_name', { required: 'Pazaryeri seçimi zorunludur' })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Pazaryeri seçin</option>
                    {marketplaceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.marketplace_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.marketplace_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mağaza Adı *
                  </label>
                  <input
                    {...register('store_name', { required: 'Mağaza adı zorunludur' })}
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Mağaza adınızı girin"
                  />
                  {errors.store_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.store_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key *
                  </label>
                  <input
                    {...register('api_key', { required: 'API key zorunludur' })}
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="API anahtarınızı girin"
                  />
                  {errors.api_key && (
                    <p className="mt-1 text-sm text-red-600">{errors.api_key.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret *
                  </label>
                  <input
                    {...register('api_secret', { required: 'API secret zorunludur' })}
                    type="password"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="API secret'ınızı girin"
                  />
                  {errors.api_secret && (
                    <p className="mt-1 text-sm text-red-600">{errors.api_secret.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ek Yapılandırma
                  </label>
                  <textarea
                    {...register('additional_config')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="JSON formatında ek yapılandırma"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <select
                    {...register('status')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="passive">Pasif</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {editingConnection ? 'Güncelle' : 'Kaydet'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bağlantıyı Sil</h3>
              <p className="text-sm text-gray-500 mb-4">
                "{deletingConnection?.store_name}" bağlantısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Sil
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserConnections;