import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
  return (
    <header className="bg-white h-16 border-b border-gray-200 flex items-center px-4 shrink-0">
      <button 
        onClick={onToggleSidebar}
        className="md:hidden p-2 mr-2 rounded-lg text-gray-600 hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>
      <div className="font-semibold text-gray-700">TwinStock System</div>
    </header>
  );
}