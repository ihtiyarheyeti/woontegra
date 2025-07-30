import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import api from '../services/api';

interface MarketplaceConnectionsProps {}

interface ConnectionData {
  woocommerce: {
    storeUrl: string;
    consumerKey: string;
    consumerSecret: string;
    isConnected: boolean;
  };
  trendyol: {
    seller_id: string;
    integration_code: string;
    api_key: string;
    api_secret: string;
    token: string;
    isConnected: boolean;
  };
  hepsiburada: {
    merchant_id: string;
    api_key: string;
    api_secret: string;
    isConnected: boolean;
  };
  n11: {
    app_key: string;
    app_secret: string;
    isConnected: boolean;
  };
  ciceksepeti: {
    dealer_code: string;
    api_key: string;
    secret_key: string;
    isConnected: boolean;
  };
  pazarama: {
    merchant_id: string;
    api_key: string;
    secret_key: string;
    isConnected: boolean;
  };
}

interface TestResult {
  success: boolean;
  message: string;
  duration: number;
}

const MarketplaceConnections: React.FC<MarketplaceConnectionsProps> = () => {
  const [connections, setConnections] = useState<ConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnections, setTestingConnections] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [activeTab, setActiveTab] = useState('woocommerce');

  // Form hooks for each marketplace
  const woocommerceForm = useForm();
  const trendyolForm = useForm();
  const hepsiburadaForm = useForm();
  const n11Form = useForm();
  const ciceksepetiForm = useForm();
  const pazaramaForm = useForm();

  // Load existing connections
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/marketplaces/connections');
      
      if (response.data.success) {
        setConnections(response.data.data);
        
        // Pre-fill forms with existing data
        woocommerceForm.reset(response.data.data.woocommerce);
        trendyolForm.reset(response.data.data.trendyol);
        hepsiburadaForm.reset(response.data.data.hepsiburada);
        n11Form.reset(response.data.data.n11);
        ciceksepetiForm.reset(response.data.data.ciceksepeti);
        pazaramaForm.reset(response.data.data.pazarama);
      }
    } catch (error: any) {
      console.error('Bağlantılar yüklenirken hata:', error);
      toast.error('Bağlantılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Test connection function
  const testConnection = async (marketplace: string, formData: any) => {
    setTestingConnections(prev => ({ ...prev, [marketplace]: true }));
    
    try {
      const response = await api.post(`/marketplaces/test-${marketplace}`, formData);
      
      if (response.data.success) {
        const result = response.data.data;
        setTestResults(prev => ({ ...prev, [marketplace]: result }));
        
        if (result.success) {
          toast.success(`${getMarketplaceName(marketplace)} bağlantısı başarılı! (${result.duration}ms)`);
        } else {
          toast.error(`${getMarketplaceName(marketplace)} bağlantısı başarısız: ${result.message}`);
        }
      }
    } catch (error: any) {
      console.error(`${marketplace} bağlantı testi hatası:`, error);
      toast.error(`${getMarketplaceName(marketplace)} bağlantı testi sırasında hata oluştu`);
    } finally {
      setTestingConnections(prev => ({ ...prev, [marketplace]: false }));
    }
  };

  // Save connection function
  const saveConnection = async (marketplace: string, formData: any) => {
    try {
      const response = await api.post('/marketplaces/save-connection', {
        marketplace,
        connectionData: formData
      });
      
      if (response.data.success) {
        toast.success(`${getMarketplaceName(marketplace)} bağlantısı kaydedildi`);
        await loadConnections(); // Reload connections
      }
    } catch (error: any) {
      console.error(`${marketplace} bağlantısı kaydetme hatası:`, error);
      toast.error(`${getMarketplaceName(marketplace)} bağlantısı kaydedilirken hata oluştu`);
    }
  };

  const getMarketplaceName = (marketplace: string): string => {
    const names: Record<string, string> = {
      woocommerce: 'WooCommerce',
      trendyol: 'Trendyol',
      hepsiburada: 'Hepsiburada',
      n11: 'N11',
      ciceksepeti: 'ÇiçekSepeti',
      pazarama: 'Pazarama'
    };
    return names[marketplace] || marketplace;
  };

  const getMarketplaceIcon = (marketplace: string): string => {
    const icons: Record<string, string> = {
      woocommerce: '🛒',
      trendyol: '🟠',
      hepsiburada: '🟡',
      n11: '🔵',
      ciceksepeti: '🌸',
      pazarama: '🛍️'
    };
    return icons[marketplace] || '🔗';
  };

  const getMarketplaceColor = (marketplace: string): string => {
    const colors: Record<string, string> = {
      woocommerce: 'bg-blue-500',
      trendyol: 'bg-orange-500',
      hepsiburada: 'bg-yellow-500',
      n11: 'bg-blue-600',
      ciceksepeti: 'bg-pink-500',
      pazarama: 'bg-purple-500'
    };
    return colors[marketplace] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Pazaryeri bağlantıları yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pazaryeri Bağlantıları</h1>
          <p className="text-gray-600 mt-2">
            Tüm pazaryeri API bağlantılarınızı merkezi olarak yönetin
          </p>
        </div>

        {/* Marketplace Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['woocommerce', 'trendyol', 'hepsiburada', 'n11', 'ciceksepeti', 'pazarama'].map((marketplace) => (
                <button
                  key={marketplace}
                  onClick={() => setActiveTab(marketplace)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === marketplace
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{getMarketplaceIcon(marketplace)}</span>
                  <span>{getMarketplaceName(marketplace)}</span>
                  {connections?.[marketplace as keyof ConnectionData]?.isConnected && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Bağlandı
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* WooCommerce Tab */}
            {activeTab === 'woocommerce' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">🛒</span>
                    WooCommerce Bağlantısı
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    WooCommerce mağazanızın API bilgilerini girin
                  </p>
                </div>

                <form onSubmit={woocommerceForm.handleSubmit((data) => saveConnection('woocommerce', data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mağaza URL</label>
                      <input
                        type="url"
                        {...woocommerceForm.register('storeUrl', { required: 'Mağaza URL gereklidir' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com"
                      />
                      {woocommerceForm.formState.errors.storeUrl && (
                        <p className="mt-1 text-sm text-red-600">{woocommerceForm.formState.errors.storeUrl.message?.toString()}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Consumer Key</label>
                      <input
                        type="text"
                        {...woocommerceForm.register('consumerKey', { required: 'Consumer Key gereklidir' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                      {woocommerceForm.formState.errors.consumerKey && (
                        <p className="mt-1 text-sm text-red-600">{woocommerceForm.formState.errors.consumerKey.message?.toString()}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Consumer Secret</label>
                    <input
                      type="password"
                      {...woocommerceForm.register('consumerSecret', { required: 'Consumer Secret gereklidir' })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    {woocommerceForm.formState.errors.consumerSecret && (
                      <p className="mt-1 text-sm text-red-600">{woocommerceForm.formState.errors.consumerSecret.message?.toString()}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => testConnection('woocommerce', woocommerceForm.getValues())}
                      disabled={testingConnections.woocommerce}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {testingConnections.woocommerce ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Kaydet
                    </button>
                  </div>

                  {testResults.woocommerce && (
                    <div className={`p-3 rounded-md ${testResults.woocommerce.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="text-sm">{testResults.woocommerce.message} ({testResults.woocommerce.duration}ms)</p>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Trendyol Tab */}
            {activeTab === 'trendyol' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">🟠</span>
                    Trendyol Bağlantısı
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Trendyol satıcı hesabınızın API bilgilerini girin
                  </p>
                </div>

                <form onSubmit={trendyolForm.handleSubmit((data) => saveConnection('trendyol', data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Seller ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...trendyolForm.register('seller_id', { 
                          required: 'Seller ID gereklidir',
                          minLength: { value: 3, message: 'Seller ID en az 3 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        placeholder="12345"
                      />
                      {trendyolForm.formState.errors.seller_id && (
                        <p className="mt-1 text-sm text-red-600">{trendyolForm.formState.errors.seller_id.message?.toString()}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Integration Reference Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...trendyolForm.register('integration_code', { 
                          required: 'Integration Reference Code gereklidir',
                          minLength: { value: 5, message: 'Integration Code en az 5 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        placeholder="INTEGRATION_REF_123"
                      />
                      {trendyolForm.formState.errors.integration_code && (
                        <p className="mt-1 text-sm text-red-600">{trendyolForm.formState.errors.integration_code.message?.toString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        API Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...trendyolForm.register('api_key', { 
                          required: 'API Key gereklidir',
                          minLength: { value: 10, message: 'API Key en az 10 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        placeholder="api_key_xxxxxxxxxxxxxxxx"
                      />
                      {trendyolForm.formState.errors.api_key && (
                        <p className="mt-1 text-sm text-red-600">{trendyolForm.formState.errors.api_key.message?.toString()}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        API Secret <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        {...trendyolForm.register('api_secret', { 
                          required: 'API Secret gereklidir',
                          minLength: { value: 10, message: 'API Secret en az 10 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        placeholder="••••••••••••••••"
                      />
                      {trendyolForm.formState.errors.api_secret && (
                        <p className="mt-1 text-sm text-red-600">{trendyolForm.formState.errors.api_secret.message?.toString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Access Token <span className="text-gray-500">(Opsiyonel)</span>
                    </label>
                    <input
                      type="password"
                      {...trendyolForm.register('token')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Access token opsiyoneldir, eğer varsa girebilirsiniz
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => testConnection('trendyol', trendyolForm.getValues())}
                      disabled={testingConnections.trendyol}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                      {testingConnections.trendyol ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      Kaydet
                    </button>
                  </div>

                  {testResults.trendyol && (
                    <div className={`p-3 rounded-md ${testResults.trendyol.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="text-sm">{testResults.trendyol.message} ({testResults.trendyol.duration}ms)</p>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Hepsiburada Tab */}
            {activeTab === 'hepsiburada' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">🟡</span>
                    Hepsiburada Bağlantısı
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Hepsiburada satıcı hesabınızın API bilgilerini girin
                  </p>
                </div>

                <form onSubmit={hepsiburadaForm.handleSubmit((data) => saveConnection('hepsiburada', data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Merchant ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...hepsiburadaForm.register('merchant_id', { 
                          required: 'Merchant ID gereklidir',
                          minLength: { value: 3, message: 'Merchant ID en az 3 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="12345"
                      />
                      {hepsiburadaForm.formState.errors.merchant_id && (
                        <p className="mt-1 text-sm text-red-600">{hepsiburadaForm.formState.errors.merchant_id.message?.toString()}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        API Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...hepsiburadaForm.register('api_key', { 
                          required: 'API Key gereklidir',
                          minLength: { value: 10, message: 'API Key en az 10 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="api_key_xxxxxxxxxxxxxxxx"
                      />
                      {hepsiburadaForm.formState.errors.api_key && (
                        <p className="mt-1 text-sm text-red-600">{hepsiburadaForm.formState.errors.api_key.message?.toString()}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      API Secret <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      {...hepsiburadaForm.register('api_secret', { 
                        required: 'API Secret gereklidir',
                        minLength: { value: 10, message: 'API Secret en az 10 karakter olmalıdır' }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="••••••••••••••••"
                    />
                    {hepsiburadaForm.formState.errors.api_secret && (
                      <p className="mt-1 text-sm text-red-600">{hepsiburadaForm.formState.errors.api_secret.message?.toString()}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => testConnection('hepsiburada', hepsiburadaForm.getValues())}
                      disabled={testingConnections.hepsiburada}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                      {testingConnections.hepsiburada ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Kaydet
                    </button>
                  </div>

                  {testResults.hepsiburada && (
                    <div className={`p-3 rounded-md ${testResults.hepsiburada.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="text-sm">{testResults.hepsiburada.message} ({testResults.hepsiburada.duration}ms)</p>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* N11 Tab */}
            {activeTab === 'n11' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">🔵</span>
                    N11 Bağlantısı
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    N11 satıcı hesabınızın API bilgilerini girin
                  </p>
                </div>

                <form onSubmit={n11Form.handleSubmit((data) => saveConnection('n11', data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        App Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...n11Form.register('app_key', { 
                          required: 'App Key gereklidir',
                          minLength: { value: 10, message: 'App Key en az 10 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-600 focus:border-blue-600"
                        placeholder="app_key_xxxxxxxxxxxxxxxx"
                      />
                      {n11Form.formState.errors.app_key && (
                        <p className="mt-1 text-sm text-red-600">{n11Form.formState.errors.app_key.message?.toString()}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        App Secret <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        {...n11Form.register('app_secret', { 
                          required: 'App Secret gereklidir',
                          minLength: { value: 10, message: 'App Secret en az 10 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-600 focus:border-blue-600"
                        placeholder="••••••••••••••••"
                      />
                      {n11Form.formState.errors.app_secret && (
                        <p className="mt-1 text-sm text-red-600">{n11Form.formState.errors.app_secret.message?.toString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => testConnection('n11', n11Form.getValues())}
                      disabled={testingConnections.n11}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
                    >
                      {testingConnections.n11 ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                    >
                      Kaydet
                    </button>
                  </div>

                  {testResults.n11 && (
                    <div className={`p-3 rounded-md ${testResults.n11.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="text-sm">{testResults.n11.message} ({testResults.n11.duration}ms)</p>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* ÇiçekSepeti Tab */}
            {activeTab === 'ciceksepeti' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">🌸</span>
                    ÇiçekSepeti Bağlantısı
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    ÇiçekSepeti satıcı hesabınızın API bilgilerini girin
                  </p>
                </div>

                <form onSubmit={ciceksepetiForm.handleSubmit((data) => saveConnection('ciceksepeti', data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Dealer Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...ciceksepetiForm.register('dealer_code', { 
                          required: 'Dealer Code gereklidir',
                          minLength: { value: 5, message: 'Dealer Code en az 5 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                        placeholder="DEALER12345"
                      />
                      {ciceksepetiForm.formState.errors.dealer_code && (
                        <p className="mt-1 text-sm text-red-600">{ciceksepetiForm.formState.errors.dealer_code.message?.toString()}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        API Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...ciceksepetiForm.register('api_key', { 
                          required: 'API Key gereklidir',
                          minLength: { value: 10, message: 'API Key en az 10 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                        placeholder="api_key_xxxxxxxxxxxxxxxx"
                      />
                      {ciceksepetiForm.formState.errors.api_key && (
                        <p className="mt-1 text-sm text-red-600">{ciceksepetiForm.formState.errors.api_key.message?.toString()}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Secret Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      {...ciceksepetiForm.register('secret_key', { 
                        required: 'Secret Key gereklidir',
                        minLength: { value: 10, message: 'Secret Key en az 10 karakter olmalıdır' }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                      placeholder="••••••••••••••••"
                    />
                    {ciceksepetiForm.formState.errors.secret_key && (
                      <p className="mt-1 text-sm text-red-600">{ciceksepetiForm.formState.errors.secret_key.message?.toString()}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => testConnection('ciceksepeti', ciceksepetiForm.getValues())}
                      disabled={testingConnections.ciceksepeti}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                    >
                      {testingConnections.ciceksepeti ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      Kaydet
                    </button>
                  </div>

                  {testResults.ciceksepeti && (
                    <div className={`p-3 rounded-md ${testResults.ciceksepeti.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="text-sm">{testResults.ciceksepeti.message} ({testResults.ciceksepeti.duration}ms)</p>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Pazarama Tab */}
            {activeTab === 'pazarama' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">🛍️</span>
                    Pazarama Bağlantısı
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Pazarama satıcı hesabınızın API bilgilerini girin
                  </p>
                </div>

                <form onSubmit={pazaramaForm.handleSubmit((data) => saveConnection('pazarama', data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Merchant ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...pazaramaForm.register('merchant_id', { 
                          required: 'Merchant ID gereklidir',
                          minLength: { value: 3, message: 'Merchant ID en az 3 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        placeholder="12345"
                      />
                      {pazaramaForm.formState.errors.merchant_id && (
                        <p className="mt-1 text-sm text-red-600">{pazaramaForm.formState.errors.merchant_id.message?.toString()}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        API Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...pazaramaForm.register('api_key', { 
                          required: 'API Key gereklidir',
                          minLength: { value: 10, message: 'API Key en az 10 karakter olmalıdır' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        placeholder="api_key_xxxxxxxxxxxxxxxx"
                      />
                      {pazaramaForm.formState.errors.api_key && (
                        <p className="mt-1 text-sm text-red-600">{pazaramaForm.formState.errors.api_key.message?.toString()}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Secret Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      {...pazaramaForm.register('secret_key', { 
                        required: 'Secret Key gereklidir',
                        minLength: { value: 10, message: 'Secret Key en az 10 karakter olmalıdır' }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      placeholder="••••••••••••••••"
                    />
                    {pazaramaForm.formState.errors.secret_key && (
                      <p className="mt-1 text-sm text-red-600">{pazaramaForm.formState.errors.secret_key.message?.toString()}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => testConnection('pazarama', pazaramaForm.getValues())}
                      disabled={testingConnections.pazarama}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {testingConnections.pazarama ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Kaydet
                    </button>
                  </div>

                  {testResults.pazarama && (
                    <div className={`p-3 rounded-md ${testResults.pazarama.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="text-sm">{testResults.pazarama.message} ({testResults.pazarama.duration}ms)</p>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceConnections; 
 