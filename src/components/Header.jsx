import React from 'react';
import { Search, Plus, Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-96">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Search files, layouts, or ask AI..." 
          className="bg-transparent border-none outline-none ml-2 w-full text-sm placeholder-gray-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Plus size={16} />
          New Layout
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}