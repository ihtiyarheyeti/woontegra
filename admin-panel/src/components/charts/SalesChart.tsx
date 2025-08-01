import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface SalesData {
  date: string;
  sales: number;
}

interface SalesChartProps {
  data?: SalesData[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  // Mock data - gelecekte API'den gelecek
  const mockData: SalesData[] = [
    { date: 'Pzt', sales: 12500 },
    { date: 'Sal', sales: 18900 },
    { date: 'Çar', sales: 14200 },
    { date: 'Per', sales: 22100 },
    { date: 'Cum', sales: 18700 },
    { date: 'Cmt', sales: 23400 },
    { date: 'Paz', sales: 19800 }
  ];

  const chartData = data || mockData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Son 7 Gün Satışları</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Günlük Satış</span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="sales" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Toplam: {formatCurrency(chartData.reduce((sum, item) => sum + item.sales, 0))}</span>
        <span>Ortalama: {formatCurrency(chartData.reduce((sum, item) => sum + item.sales, 0) / chartData.length)}</span>
      </div>
    </div>
  );
};

export default SalesChart; 