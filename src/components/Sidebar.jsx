import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, LayoutGrid, Sparkles, FileText, LogOut } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  // Mengambil data user dari localStorage yang disimpan saat Login
  const userString = localStorage.getItem("user");
  const userData = userString ? JSON.parse(userString) : null;

  // Fungsi untuk Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Menggunakan window.location agar state aplikasi benar-benar bersih (hard reset)
    window.location.href = "/login";
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/2d-layout', label: '2D Layout Editor', icon: LayoutGrid },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { path: '/markdown', label: 'Markdown Files', icon: FileText },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-4">
      
      {/* --- BAGIAN ATAS: LOGO & NAVIGASI --- */}
      <div>
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center text-white font-bold">
            <Package size={20} />
          </div>
          <span className="text-xl font-bold text-gray-800">TwinStock</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* --- BAGIAN BAWAH: PROFIL & LOGOUT --- */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        
        {/* 1. Informasi Profil User */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold uppercase shadow-sm">
            {/* Mengambil 2 huruf pertama dari nama user, jika kosong tampilkan 'AD' */}
            {userData?.name?.substring(0, 2) || "AD"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-gray-800 truncate">
              {userData?.name || "Admin TwinStock"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userData?.email || "admin@twinstock.com"}
            </p>
          </div>
        </div>

        {/* 2. Tombol Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Logout Account</span>
        </button>

      </div>
      
    </div>
  );
}