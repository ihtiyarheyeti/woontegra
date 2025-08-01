import React from 'react';

const StockUpdate: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stok Güncelleme</h1>
        <p className="text-gray-600">Ürün stoklarını toplu olarak güncelleyin</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Stok Güncelleme Sayfası</h2>
          <p className="text-gray-600">Bu sayfa yakında aktif olacak</p>
        </div>
      </div>
    </div>
  );
};

export default StockUpdate; 