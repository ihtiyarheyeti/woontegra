import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  status: string;
  plan: string;
  stripe_customer_id?: string;
  subscription_id?: string;
  subscription_status?: string;
  plan_expiry?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  max_users: number;
  max_connections: number;
}

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

const PaymentManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
    fetchPlans();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/tenants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTenants(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/stripe/plans');
      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheckout = async () => {
    if (!selectedTenant || !selectedPlan) {
      window.alert('Lütfen kiracı ve plan seçin');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/stripe/checkout', {
        tenant_id: selectedTenant.id,
        plan: selectedPlan
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Stripe checkout sayfasına yönlendir
        window.location.href = response.data.data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      window.alert('Ödeme sayfası oluşturulurken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckSubscription = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setLoadingSubscription(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/stripe/subscription/${tenant.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        if (response.data.data.has_subscription) {
          setSubscriptionStatus(response.data.data.subscription);
        } else {
          setSubscriptionStatus(null);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedTenant) return;

    if (!window.confirm('Aboneliği iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3000/api/stripe/subscription/${selectedTenant.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        window.alert('Abonelik başarıyla iptal edildi');
        setSubscriptionStatus(null);
        fetchTenants(); // Tenant listesini yenile
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      window.alert('Abonelik iptal edilirken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'canceled': return 'text-red-600';
      case 'past_due': return 'text-yellow-600';
      case 'trialing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ödeme Yönetimi</h1>
              <p className="mt-2 text-gray-600">Kiracı aboneliklerini ve ödemelerini yönetin</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Geri Dön
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol Panel - Kiracı Listesi */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Kiracılar</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTenant?.id === tenant.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCheckSubscription(tenant)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                        <p className="text-sm text-gray-500">{tenant.slug}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                            tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tenant.status}
                          </span>
                          <span className="text-sm text-gray-600">Plan: {tenant.plan}</span>
                        </div>
                      </div>
                      {tenant.subscription_id && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Abonelikli
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Panel - Abonelik Detayları ve İşlemler */}
          <div className="space-y-6">
            {/* Abonelik Durumu */}
            {selectedTenant && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedTenant.name} - Abonelik Durumu
                  </h2>
                </div>
                <div className="p-6">
                  {loadingSubscription ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Yükleniyor...</p>
                    </div>
                  ) : subscriptionStatus ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Durum</label>
                          <p className={`mt-1 text-sm font-medium ${getStatusColor(subscriptionStatus.status)}`}>
                            {subscriptionStatus.status}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatDate(subscriptionStatus.current_period_end)}
                          </p>
                        </div>
                      </div>
                      {subscriptionStatus.cancel_at_period_end && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            Bu abonelik dönem sonunda iptal edilecek.
                          </p>
                        </div>
                      )}
                      <button
                        onClick={handleCancelSubscription}
                        disabled={processing}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {processing ? 'İşleniyor...' : 'Aboneliği İptal Et'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">Bu kiracının aktif aboneliği bulunmuyor.</p>
                      
                      {/* Yeni Abonelik Oluştur */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Plan Seçin
                          </label>
                          <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Plan seçin</option>
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} - ₺{plan.price}/ay
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleCreateCheckout}
                          disabled={!selectedPlan || processing}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {processing ? 'İşleniyor...' : 'Ödeme Sayfasına Git'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Planlar */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Mevcut Planlar</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-2xl font-bold text-indigo-600 mt-2">₺{plan.price}</p>
                      <p className="text-sm text-gray-600">/ay</p>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-600">
                          Maksimum {plan.max_users} kullanıcı
                        </p>
                        <p className="text-sm text-gray-600">
                          Maksimum {plan.max_connections} bağlantı
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement; 