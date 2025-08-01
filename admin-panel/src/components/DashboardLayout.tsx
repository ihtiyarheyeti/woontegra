import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Bell } from 'lucide-react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

        return (
     <div className="flex h-screen bg-gray-50">
       {/* Sidebar */}
       <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

       {/* Main Content */}
       <div className="flex flex-col flex-1">
         {/* Header */}
         <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 h-12">
           <div className="flex items-center justify-between px-4 py-1 h-full">
             {/* Left side - Menu button and title */}
             <div className="flex items-center space-x-4">
               <button
                 onClick={() => setSidebarOpen(!sidebarOpen)}
                 className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
               >
                 <Menu className="w-5 h-5" />
               </button>
               <h1 className="text-lg font-semibold text-gray-900">
                 Woontegra Dashboard
               </h1>
             </div>

             {/* Right side - User menu and notifications */}
             <div className="flex items-center space-x-4">
               {/* Notifications */}
               <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
               </button>

               {/* User menu */}
               <div className="relative">
                 <button className="flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-100">
                   <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                     <User className="w-4 h-4 text-white" />
                   </div>
                   <span className="hidden md:block text-sm font-medium">
                     {user.name || 'Kullanıcı'}
                   </span>
                 </button>
               </div>

               {/* Logout button */}
               <button
                 onClick={handleLogout}
                 className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
               >
                 <LogOut className="w-4 h-4" />
                 <span className="hidden md:block">Çıkış</span>
               </button>
             </div>
           </div>
         </header>

         {/* Page Content */}
         <main className="flex-1 overflow-auto">
           {children}
         </main>
       </div>
     </div>
   );
};

export default DashboardLayout; 