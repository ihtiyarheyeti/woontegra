import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AddNewProduct from './components/AddNewProduct';
import CategoryMappingNew from './components/CategoryMappingNew';
import ProductSync from './components/ProductSync';
import StockPriceUpdate from './components/StockPriceUpdate';
import OrderManagement from './components/OrderManagement';
import Reports from './components/Reports';
import ProductManagement from './components/ProductManagement';
import MarketplaceConnections from './components/MarketplaceConnections';
import TrendyolSync from './components/TrendyolSync';
import MarketplaceSync from './components/MarketplaceSync';
import WooProductList from './components/WooProductList';
import UserConnections from './components/UserConnections';
import TenantManagement from './components/TenantManagement';
import PaymentManagement from './components/PaymentManagement';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import TenantLogin from './components/TenantLogin';
import TenantDashboard from './components/TenantDashboard';
import DashboardLayout from './components/DashboardLayout';
import BulkUpload from './components/BulkUpload';
import ProductSend from './components/ProductSend';
import Settings from './components/Settings';
import VariantManagement from './components/VariantManagement';
import ProductMapping from './components/ProductMapping';
import PriceUpdate from './components/PriceUpdate';
import StockUpdate from './components/StockUpdate';
import ReturnsCancellations from './components/ReturnsCancellations';
import OrderLogs from './components/OrderLogs';
import ActivityLogs from './components/ActivityLogs';
import PullTrendyolProducts from './components/PullTrendyolProducts';
import { Toaster } from 'react-hot-toast';
import { ProductProvider } from './contexts/ProductContext';

// Protected Route Component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  console.log('🔒 PrivateRoute check - Token:', token ? 'exists' : 'missing');
  
  if (!token) {
    console.log('🚫 No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ Token found, rendering protected content');
  return <DashboardLayout>{children}</DashboardLayout>;
};

// Tenant Protected Route Component
const TenantPrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/tenant-login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Tenant Public Route Component
const TenantPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    return <Navigate to="/tenant-dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ProductProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/tenant-login" element={
            <TenantPublicRoute>
              <TenantLogin />
            </TenantPublicRoute>
          } />
          
          {/* Admin Protected Routes with Dashboard Layout */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/tenant-management" element={
            <PrivateRoute>
              <TenantManagement />
            </PrivateRoute>
          } />
          <Route path="/payment-management" element={
            <PrivateRoute>
              <PaymentManagement />
            </PrivateRoute>
          } />
          <Route path="/payment/success" element={
            <PrivateRoute>
              <PaymentSuccess />
            </PrivateRoute>
          } />
          <Route path="/payment/cancel" element={
            <PrivateRoute>
              <PaymentCancel />
            </PrivateRoute>
          } />
          <Route path="/category-mapping" element={
            <PrivateRoute>
              <CategoryMappingNew />
            </PrivateRoute>
          } />
          <Route path="/product-sync" element={
            <PrivateRoute>
              <ProductSync />
            </PrivateRoute>
          } />
          <Route path="/stock-price-update" element={
            <PrivateRoute>
              <StockPriceUpdate />
            </PrivateRoute>
          } />
          <Route path="/order-management" element={
            <PrivateRoute>
              <OrderManagement />
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          } />
          <Route path="/add-product" element={
            <PrivateRoute>
              <AddNewProduct />
            </PrivateRoute>
          } />
          <Route path="/product-management" element={
            <PrivateRoute>
              <ProductManagement />
            </PrivateRoute>
          } />
          <Route path="/marketplace-connections" element={
            <PrivateRoute>
              <MarketplaceConnections />
            </PrivateRoute>
          } />
          <Route path="/trendyol-sync" element={
            <PrivateRoute>
              <TrendyolSync />
            </PrivateRoute>
          } />
          <Route path="/marketplace-sync" element={
            <PrivateRoute>
              <MarketplaceSync />
            </PrivateRoute>
          } />
          <Route path="/user-connections" element={
            <PrivateRoute>
              <UserConnections />
            </PrivateRoute>
          } />
          <Route path="/woo-product-list" element={
            <PrivateRoute>
              <WooProductList />
            </PrivateRoute>
          } />
          <Route path="/bulk-upload" element={
            <PrivateRoute>
              <BulkUpload />
            </PrivateRoute>
          } />
          <Route path="/product-send" element={
            <PrivateRoute>
              <ProductSend />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } />
          <Route path="/variant-management" element={
            <PrivateRoute>
              <VariantManagement />
            </PrivateRoute>
          } />
          <Route path="/product-mapping" element={
            <PrivateRoute>
              <ProductMapping />
            </PrivateRoute>
          } />
          <Route path="/price-update" element={
            <PrivateRoute>
              <PriceUpdate />
            </PrivateRoute>
          } />
          <Route path="/stock-update" element={
            <PrivateRoute>
              <StockUpdate />
            </PrivateRoute>
          } />
          <Route path="/returns-cancellations" element={
            <PrivateRoute>
              <ReturnsCancellations />
            </PrivateRoute>
          } />
          <Route path="/order-logs" element={
            <PrivateRoute>
              <OrderLogs />
            </PrivateRoute>
          } />
          <Route path="/activity-logs" element={
            <PrivateRoute>
              <ActivityLogs />
            </PrivateRoute>
          } />
          <Route path="/pull-trendyol" element={
            <PrivateRoute>
              <PullTrendyolProducts />
            </PrivateRoute>
          } />
          
          {/* Tenant Protected Routes */}
          <Route path="/tenant-dashboard" element={
            <TenantPrivateRoute>
              <TenantDashboard />
            </TenantPrivateRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
    </ProductProvider>
  );
}

export default App;
