import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ListChecks,
  Store,
  ClipboardList,
  Settings,
  Menu,
  X,
  BarChart3,
  Bell,
  Users,
  FileSearch,
  Download
} from 'lucide-react';
import SidebarItem from './SidebarItem';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    {
      label: "Kontrol Paneli",
      icon: LayoutDashboard,
      route: "/dashboard"
    },
    {
      label: "Ürün Yönetimi",
      icon: Package,
      children: [
        { label: "Ürünler", route: "/woo-product-list" },
        { label: "Yeni Ürün Ekle", route: "/add-product" },
        { label: "Toplu Ürün Yükle", route: "/bulk-upload" },
        { label: "Stok & Fiyat Güncelle", route: "/stock-price-update" },
        { label: "Varyant Yönetimi", route: "/variant-management" },
        { label: "Ürün Eşleştirme", route: "/product-mapping" }
      ]
    },
    {
      label: "Ürün Alma",
      icon: Download,
      children: [
        { label: "Trendyol'dan Ürün Çek", route: "/pull-trendyol" }
      ]
    },
    {
      label: "Kategori Yönetimi",
      icon: ListChecks,
      children: [
        { label: "Kategori Eşleştirme", route: "/category-mapping" }
      ]
    },
    {
      label: "Pazaryeri Yönetimi",
      icon: Store,
      children: [
        { label: "Bağlantı Ayarları", route: "/marketplace-connections" },
        { label: "Ürün Gönderimi", route: "/product-send" },
        { label: "Kategori Haritalama", route: "/marketplace-category-map" },
        { label: "Fiyat Güncelleme", route: "/price-update" },
        { label: "Stok Güncelleme", route: "/stock-update" }
      ]
    },
    {
      label: "Sipariş Yönetimi",
      icon: ClipboardList,
      children: [
        { label: "Sipariş Yönetimi", route: "/order-management" },
        { label: "İade / İptal Yönetimi", route: "/returns-cancellations" },
        { label: "Sipariş Logları", route: "/order-logs" }
      ]
    },
    {
      label: "Raporlar & Analiz",
      icon: BarChart3,
      children: [
        { label: "Satış Raporları", route: "/sales-reports" },
        { label: "Sipariş Analizi", route: "/order-analytics" }
      ]
    },
    {
      label: "Bildirimler",
      icon: Bell,
      route: "/notifications"
    },
    {
      label: "Kullanıcı Yönetimi",
      icon: Users,
      route: "/user-management"
    },
    {
      label: "Log Kayıtları",
      icon: FileSearch,
      route: "/logs"
    },
    {
      label: "Entegrasyon Ayarları",
      icon: Settings,
      children: [
        { label: "Ayarlar", route: "/settings" },
        { label: "İşlem Kayıtları", route: "/activity-logs" }
      ]
    }
  ];

  // Auto-expand parent items when child is active
  const getExpandedItems = () => {
    const expanded: { [key: string]: boolean } = {};
    menuItems.forEach((item, index) => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          location.pathname === child.route
        );
        if (hasActiveChild) {
          expanded[index] = true;
        }
      }
    });
    return expanded;
  };

  const [expandedItems, setExpandedItems] = useState(getExpandedItems());

  const handleToggle = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 border-r border-gray-200
      `}>
                 {/* Header */}
         <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Woontegra</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

                 {/* Navigation */}
         <nav className="px-4 py-2 space-y-2">
          {menuItems.map((item, index) => (
            <SidebarItem
              key={index}
              label={item.label}
              icon={item.icon}
              route={item.route}
              children={item.children}
              isExpanded={expandedItems[index]}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            v1.0.0
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 