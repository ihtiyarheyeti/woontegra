import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface MarketplaceSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
}

interface Marketplace {
  id: string;
  name: string;
  logo: string;
}

const marketplaces: Marketplace[] = [
  {
    id: 'trendyol',
    name: 'Trendyol',
    logo: '🟠'
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    logo: '🟡'
  },
  {
    id: 'n11',
    name: 'N11',
    logo: '🔵'
  },
  {
    id: 'ciceksepeti',
    name: 'ÇiçekSepeti',
    logo: '🌸'
  }
];

const MarketplaceSendModal: React.FC<MarketplaceSendModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName
}) => {
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  const handleMarketplaceToggle = (marketplaceId: string) => {
    setSelectedMarketplaces(prev => 
      prev.includes(marketplaceId)
        ? prev.filter(id => id !== marketplaceId)
        : [...prev, marketplaceId]
    );
  };

  const handleSend = async () => {
    if (selectedMarketplaces.length === 0) {
      console.warn('⚠️ Pazaryeri seçilmedi');
      toast.error('Lütfen en az bir pazaryeri seçin');
      return;
    }

    const startTime = Date.now();
    console.log(`🚀 Pazaryerlerine gönderme başlatılıyor - Product ID: ${productId}, Product Name: ${productName}, Marketplaces: ${selectedMarketplaces.join(', ')}`);

    setSending(true);
    try {
      const response = await api.post(`/api/products/${productId}/send-to-marketplaces`, {
        marketplaces: selectedMarketplaces
      });

      const duration = Date.now() - startTime;

      if (response.data.success) {
        const { success, failed, duration: serverDuration } = response.data.data;
        
        console.log(`✅ Pazaryerlerine gönderme tamamlandı - Başarılı: ${success.join(', ')}, Başarısız: ${failed.join(', ')}, Süre: ${duration}ms (Server: ${serverDuration}ms)`);
        
        // Başarılı olanları bildir
        success.forEach((marketplace: string) => {
          console.log(`✅ ${marketplace}'a başarıyla gönderildi`);
          toast.success(`✔️ ${marketplace}'a gönderildi`);
        });

        // Başarısız olanları bildir
        failed.forEach((marketplace: string) => {
          console.warn(`⚠️ ${marketplace} gönderilemedi`);
          toast.error(`⚠️ ${marketplace} gönderilemedi`);
        });

        onClose();
        setSelectedMarketplaces([]);
      } else {
        console.error(`❌ Pazaryerlerine gönderme başarısız - Mesaj: ${response.data.message}, Süre: ${duration}ms`);
        toast.error(response.data.message);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Pazaryerlerine gönderme hatası - Hata: ${error.response?.data?.message || error.message}, Süre: ${duration}ms`, error);
      toast.error(error.response?.data?.message || 'Pazaryerlerine gönderilirken hata oluştu');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedMarketplaces([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Pazaryerlerine Gönder
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Ürün:</p>
          <p className="font-medium text-gray-800">{productName}</p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Göndermek istediğiniz pazaryerlerini seçin:
          </p>
          
          <div className="space-y-3">
            {marketplaces.map((marketplace) => (
              <label
                key={marketplace.id}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedMarketplaces.includes(marketplace.id)}
                  onChange={() => handleMarketplaceToggle(marketplace.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-2xl">{marketplace.logo}</span>
                <span className="text-sm font-medium text-gray-700">
                  {marketplace.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            İptal
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedMarketplaces.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gönderiliyor...
              </span>
            ) : (
              'Gönder'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSendModal; 