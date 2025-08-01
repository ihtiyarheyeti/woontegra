import React from 'react';

const BulkUpload: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Toplu Ürün Yükleme
        </h1>
        <p className="text-gray-600">
          Excel veya CSV dosyası ile toplu ürün yükleme işlemi
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Dosya Yükleme
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Dosya seçin veya sürükleyip bırakın
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Excel (.xlsx) veya CSV (.csv) dosyaları desteklenir
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
              Dosya Seç
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Şablon İndir
          </h3>
          <p className="text-gray-600 mb-4">
            Doğru format için örnek şablonu indirin ve kullanın.
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
            Excel Şablonu İndir
          </button>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Yükleme Geçmişi
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 text-center">
              Henüz yükleme geçmişi bulunmuyor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload; 