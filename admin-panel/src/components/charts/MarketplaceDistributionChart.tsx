import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface MarketplaceData {
  name: string;
  orders: number;
  color: string;
  percentage: number;
}

interface MarketplaceDistributionChartProps {
  data?: MarketplaceData[];
}

const MarketplaceDistributionChart: React.FC<MarketplaceDistributionChartProps> = ({ data }) => {
  // Mock data - gelecekte API'den gelecek
  const mockData: MarketplaceData[] = [
    { name: 'Trendyol', orders: 456, color: '#ff6b35', percentage: 42 },
    { name: 'Hepsiburada', orders: 324, color: '#ff4757', percentage: 30 },
    { name: 'N11', orders: 189, color: '#3742fa', percentage: 17 },
    { name: 'Çiçeksepeti', orders: 98, color: '#2ed573', percentage: 9 },
    { name: 'Pazarama', orders: 23, color: '#ffa502', percentage: 2 }
  ];

  const chartData = data || mockData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-600">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.color }}>
            {data.orders} Sipariş
          </p>
          <p className="text-sm text-gray-500">%{data.percentage} pay</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {entry.value}
              </p>
              <p className="text-xs text-gray-500">
                {chartData[index].orders} sipariş (%{chartData[index].percentage})
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Pazaryeri Dağılımı</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Sipariş</span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={3}
              dataKey="orders"
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
          Toplam: {chartData.reduce((sum, item) => sum + item.orders, 0)} Sipariş
        </p>
      </div>
    </div>
  );
};

export default MarketplaceDistributionChart; 