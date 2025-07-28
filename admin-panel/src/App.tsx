import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CategoryMapping from './components/CategoryMapping';
import ProductSync from './components/ProductSync';
import StockPriceUpdate from './components/StockPriceUpdate';
import OrderManagement from './components/OrderManagement';
import Reports from './components/Reports';
import ProductManagement from './components/ProductManagement';
import MarketplaceConnections from './components/MarketplaceConnections';
import TrendyolSync from './components/TrendyolSync';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/category-mapping" element={<PrivateRoute><CategoryMapping /></PrivateRoute>} />
            <Route path="/product-sync" element={<PrivateRoute><ProductSync /></PrivateRoute>} />
            <Route path="/stock-price-update" element={<PrivateRoute><StockPriceUpdate /></PrivateRoute>} />
            <Route path="/order-management" element={<PrivateRoute><OrderManagement /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/product-management" element={<PrivateRoute><ProductManagement /></PrivateRoute>} />
            <Route path="/marketplace-connections" element={<PrivateRoute><MarketplaceConnections /></PrivateRoute>} />
            <Route path="/trendyol-sync" element={<PrivateRoute><TrendyolSync /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
