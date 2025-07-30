import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ödeme İptal Edildi</h1>
        <p className="text-gray-600 mb-6">
          Ödeme işlemi iptal edildi veya tamamlanamadı. Aboneliğiniz henüz aktif değil.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            Ödeme işlemini tekrar deneyebilir veya daha sonra tekrar deneyebilirsiniz.
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/payment-management')}
            className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ödeme Yönetimine Git
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel; 