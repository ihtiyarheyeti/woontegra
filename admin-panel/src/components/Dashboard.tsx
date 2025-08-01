import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Package,
  ShoppingCart,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';
import SalesChart from './charts/SalesChart';
import OrdersChart from './charts/OrdersChart';
import TopProductsChart from './charts/TopProductsChart';
import MarketplaceDistributionChart from './charts/MarketplaceDistributionChart';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  marketplaceConnections: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    marketplaceConnections: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch products stats
      const productsResponse = await api.get('/products/stats');
      console.log('🔍 Products Response:', productsResponse.data);
      console.log('📊 Products Data:', productsResponse.data.data);
      
      // Fetch orders stats
      const ordersResponse = await api.get('/orders/stats/summary');
      console.log('🔍 Orders Response:', ordersResponse.data);
      console.log('📊 Orders Data:', ordersResponse.data.data);
      
      // For marketplace connections, we'll use a simple count for now
      const marketplaceConnections = 0;

      const newStats = {
        totalProducts: productsResponse.data.data?.total || 0,
        activeProducts: productsResponse.data.data?.active || 0,
        totalOrders: ordersResponse.data.data?.total || 0,
        pendingOrders: ordersResponse.data.data?.pending || 0,
        totalRevenue: ordersResponse.data.data?.totalRevenue || 0,
        marketplaceConnections: marketplaceConnections
      };

      console.log('🎯 Final Stats:', newStats);
      setStats(newStats);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Dashboard istatistikleri yüklenirken hata oluştu';
      
      toast.error(errorMessage);
      
      // Set default values on error
      setStats({
        totalProducts: 0,
        activeProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        marketplaceConnections: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  return (
    <div className="bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="px-6 pt-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kontrol Paneli</h1>
          <p className="text-gray-600">Pazaryeri entegrasyon yönetim paneli</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 px-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalProducts)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktif Ürün</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.activeProducts)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalOrders)}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6 px-6">
          <SalesChart />
          <OrdersChart />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 px-6 pb-6">
          <TopProductsChart />
          <MarketplaceDistributionChart />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

