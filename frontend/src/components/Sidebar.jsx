import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, LayoutGrid, Sparkles, FileText } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/2d-layout', label: '2D Layout Editor', icon: LayoutGrid },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { path: '/markdown', label: 'Markdown Files', icon: FileText },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-4">
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

      <div>
        <div className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold">
            RM
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-800">Admin TwinStock</p>
            <p className="text-xs text-gray-500">admin@twinstock.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}