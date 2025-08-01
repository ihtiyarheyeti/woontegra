import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface OrderData {
  date: string;
  orders: number;
}

interface OrdersChartProps {
  data?: OrderData[];
}

const OrdersChart: React.FC<OrdersChartProps> = ({ data }) => {
  // Mock data - gelecekte API'den gelecek
  const mockData: OrderData[] = [
    { date: 'Pzt', orders: 45 },
    { date: 'Sal', orders: 67 },
    { date: 'Çar', orders: 52 },
    { date: 'Per', orders: 89 },
    { date: 'Cum', orders: 73 },
    { date: 'Cmt', orders: 98 },
    { date: 'Paz', orders: 84 }
  ];

  const chartData = data || mockData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-lg font-bold text-green-600">
            {payload[0].value} Sipariş
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Günlük Sipariş Sayısı</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Sipariş</span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone"
              dataKey="orders" 
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#colorGradient)"
              fillOpacity={0.3}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Toplam: {chartData.reduce((sum, item) => sum + item.orders, 0)} Sipariş</span>
        <span>Ortalama: {Math.round(chartData.reduce((sum, item) => sum + item.orders, 0) / chartData.length)}/gün</span>
      </div>
    </div>
  );
};

export default OrdersChart; 