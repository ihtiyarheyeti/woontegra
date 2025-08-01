import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface ProductData {
  name: string;
  sales: number;
  color: string;
}

interface TopProductsChartProps {
  data?: ProductData[];
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ data }) => {
  // Mock data - gelecekte API'den gelecek
  const mockData: ProductData[] = [
    { name: 'iPhone 15 Pro', sales: 234, color: '#3b82f6' },
    { name: 'Samsung Galaxy S24', sales: 189, color: '#10b981' },
    { name: 'MacBook Air M2', sales: 156, color: '#f59e0b' },
    { name: 'AirPods Pro', sales: 134, color: '#8b5cf6' },
    { name: 'iPad Air', sales: 98, color: '#ef4444' }
  ];

  const chartData = data || mockData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = chartData.reduce((sum, item) => sum + item.sales, 0);
      const percentage = ((data.sales / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-600">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.color }}>
            {data.sales} Satış
          </p>
          <p className="text-sm text-gray-500">%{percentage} pay</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-xs text-gray-600">
              {entry.value} ({chartData[index].sales})
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">En Çok Satan 5 Ürün</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Satış</span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="sales"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Toplam: {chartData.reduce((sum, item) => sum + item.sales, 0)} Satış
        </p>
      </div>
    </div>
  );
};

export default TopProductsChart; 