import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import BackButton from './BackButton';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'basic' | 'premium' | 'enterprise';
  max_users: number;
  max_connections: number;
  created_at: string;
  customers: Customer[];
}

interface Customer {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    slug: '',
    plan: 'basic' as const,
    max_users: 5,
    max_connections: 10
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTenants(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Kiracılar alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/tenants', createFormData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Kiracı başarıyla oluşturuldu');
        setShowCreateForm(false);
        setCreateFormData({
          name: '',
          slug: '',
          plan: 'basic',
          max_users: 5,
          max_connections: 10
        });
        fetchTenants();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kiracı oluşturulurken bir hata oluştu';
      toast.error(message);
    }
  };

  const handleUpdateTenantStatus = async (tenantId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:3000/api/tenants/${tenantId}`, {
        status
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Kiracı durumu güncellendi');
        fetchTenants();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kiracı güncellenirken bir hata oluştu';
      toast.error(message);
    }
  };

  const handleDeleteTenant = async (tenantId: number) => {
    if (!window.confirm('Bu kiracıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:3000/api/tenants/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Kiracı başarıyla silindi');
        fetchTenants();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kiracı silinirken bir hata oluştu';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      case 'basic':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kiracı Yönetimi</h1>
              <p className="mt-1 text-sm text-gray-500">
                Tüm kiracıları ve kullanıcılarını yönetin
              </p>
            </div>
            <div className="flex space-x-3">
              <BackButton />
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Yeni Kiracı Ekle
              </button>
            </div>
          </div>

          {/* Create Tenant Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Kiracı Oluştur</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kiracı Adı</label>
                      <input
                        type="text"
                        value={createFormData.name}
                        onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Slug</label>
                      <input
                        type="text"
                        value={createFormData.slug}
                        onChange={(e) => setCreateFormData({ ...createFormData, slug: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Plan</label>
                      <select
                        value={createFormData.plan}
                        onChange={(e) => setCreateFormData({ ...createFormData, plan: e.target.value as any })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maksimum Kullanıcı</label>
                      <input
                        type="number"
                        value={createFormData.max_users}
                        onChange={(e) => setCreateFormData({ ...createFormData, max_users: parseInt(e.target.value) })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maksimum Bağlantı</label>
                      <input
                        type="number"
                        value={createFormData.max_connections}
                        onChange={(e) => setCreateFormData({ ...createFormData, max_connections: parseInt(e.target.value) })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleCreateTenant}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Oluştur
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tenants List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <li key={tenant.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{tenant.name.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">{tenant.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                            {tenant.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(tenant.plan)}`}>
                            {tenant.plan}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Slug: {tenant.slug}</p>
                        <p className="text-sm text-gray-500">
                          Kullanıcılar: {tenant.customers.length}/{tenant.max_users} | 
                          Bağlantılar: {tenant.max_connections}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={tenant.status}
                        onChange={(e) => handleUpdateTenantStatus(tenant.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                        <option value="suspended">Askıya Alınmış</option>
                      </select>
                      <button
                        onClick={() => setSelectedTenant(selectedTenant?.id === tenant.id ? null : tenant)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        {selectedTenant?.id === tenant.id ? 'Gizle' : 'Detaylar'}
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Sil
                      </button>
                    </div>
                  </div>

                  {/* Tenant Details */}
                  {selectedTenant?.id === tenant.id && (
                    <div className="mt-4 pl-14">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Kullanıcılar</h4>
                      <div className="bg-gray-50 rounded-md p-4">
                        {tenant.customers.length > 0 ? (
                          <div className="space-y-2">
                            {tenant.customers.map((customer) => (
                              <div key={customer.id} className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="font-medium">{customer.name}</span>
                                  <span className="text-gray-500 ml-2">({customer.email})</span>
                                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    customer.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {customer.role}
                                  </span>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {customer.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Bu kiracının henüz kullanıcısı yok.</p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantManagement; 