import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface SummaryData {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  sync_success_rate: number;
  orders_this_month: number;
  revenue_this_month: number;
  avg_order_value: number;
  top_platform: string;
}

interface MonthlySales {
  month: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  platform: string;
}

interface SyncStats {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  success_rate: number;
  by_platform: {
    woocommerce: { total: number; success: number; failed: number };
    trendyol: { total: number; success: number; failed: number };
  };
  by_operation: {
    product_sync: { total: number; success: number; failed: number };
    order_sync: { total: number; success: number; failed: number };
    stock_update: { total: number; success: number; failed: number };
  };
}

const Reports: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const [summaryRes, salesRes, productsRes, syncRes] = await Promise.all([
        axios.get(`/api/reports/summary?period=${period}`),
        axios.get(`/api/reports/sales-by-month?period=${period}`),
        axios.get(`/api/reports/top-products?period=${period}`),
        axios.get(`/api/reports/sync-stats?period=${period}`)
      ]);

      setSummary(summaryRes.data.data);
      setMonthlySales(salesRes.data.data);
      setTopProducts(productsRes.data.data);
      setSyncStats(syncRes.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Raporlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Raporlar yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Detaylı Raporlama</h1>
        <p className="text-gray-600">Senkronizasyon, satış ve sipariş verilerini analiz edin</p>
      </div>

      {/* Period Filter */}
      <div className="mb-6">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="30">Son 30 Gün</option>
          <option value="90">Son 3 Ay</option>
          <option value="365">Son 1 Yıl</option>
        </select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_orders)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.total_revenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Senkronizasyon Başarı Oranı</p>
                <p className="text-2xl font-bold text-gray-900">%{summary.sync_success_rate}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Ortalama Sipariş Değeri</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.avg_order_value)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Satışlar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatPrice(Number(value))} />
              <Legend />
              <Bar dataKey="sales" fill="#3B82F6" name="Satış" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sync Success Rate Chart */}
        {syncStats && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Senkronizasyon Başarı Oranı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Başarılı', value: syncStats.successful_syncs },
                    { name: 'Başarısız', value: syncStats.failed_syncs }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#00C49F" />
                  <Cell fill="#FF8042" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Products Chart */}
      <div className="bg-white p-6 rounded-lg shadow border mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">En Çok Satan Ürünler</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topProducts} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Legend />
            <Bar dataKey="sales" fill="#10B981" name="Satış Adedi" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sync Statistics Table */}
      {syncStats && (
        <div className="bg-white p-6 rounded-lg shadow border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Senkronizasyon İstatistikleri</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Platform Bazında</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">WooCommerce:</span>
                  <span className="font-medium">{syncStats.by_platform.woocommerce.success}/{syncStats.by_platform.woocommerce.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trendyol:</span>
                  <span className="font-medium">{syncStats.by_platform.trendyol.success}/{syncStats.by_platform.trendyol.total}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">İşlem Bazında</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ürün Senkronizasyonu:</span>
                  <span className="font-medium">{syncStats.by_operation.product_sync.success}/{syncStats.by_operation.product_sync.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sipariş Senkronizasyonu:</span>
                  <span className="font-medium">{syncStats.by_operation.order_sync.success}/{syncStats.by_operation.order_sync.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stok Güncelleme:</span>
                  <span className="font-medium">{syncStats.by_operation.stock_update.success}/{syncStats.by_operation.stock_update.total}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Genel İstatistikler</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Toplam Senkronizasyon:</span>
                  <span className="font-medium">{formatNumber(syncStats.total_syncs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Başarılı:</span>
                  <span className="font-medium text-green-600">{formatNumber(syncStats.successful_syncs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Başarısız:</span>
                  <span className="font-medium text-red-600">{formatNumber(syncStats.failed_syncs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Başarı Oranı:</span>
                  <span className="font-medium text-blue-600">%{syncStats.success_rate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Products Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">En Çok Satan Ürünler Detayı</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satış Adedi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gelir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(product.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(product.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.platform === 'woocommerce' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {product.platform === 'woocommerce' ? 'WooCommerce' : 'Trendyol'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports; 
 