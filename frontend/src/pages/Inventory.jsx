import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, MoreVertical } from 'lucide-react';

export default function Inventory() {
  // Data statis (dummy)
  const inventoryData = [
    { id: 'ITM-001', name: 'Intel Core i7 Processor', category: 'Electronics', stock: 150, zone: 'Zone A', status: 'In Stock' },
    { id: 'ITM-002', name: 'Ergonomic Office Chair', category: 'Furniture', stock: 12, zone: 'Zone C', status: 'Low Stock' },
    { id: 'ITM-003', name: 'Logitech Wireless Mouse', category: 'Electronics', stock: 0, zone: 'Zone A', status: 'Out of Stock' },
    { id: 'ITM-004', name: 'Cardboard Boxes (Large)', category: 'Packaging', stock: 500, zone: 'Zone B', status: 'In Stock' },
    { id: 'ITM-005', name: 'DDR4 16GB RAM', category: 'Electronics', stock: 3, zone: 'Zone A', status: 'Low Stock' },
  ];

  return (
    <div className="space-y-6">
      {/* Bagian Header & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your products, stock levels, and warehouse locations.</p>
        </div>
        <button className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} />
          Add New Item
        </button>
      </div>

      {/* Bagian Toolbar (Search & Filter) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 w-full sm:w-96 border border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search items by name or ID..." 
            className="bg-transparent border-none outline-none ml-2 w-full text-sm placeholder-gray-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full sm:w-auto justify-center">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Item ID</th>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventoryData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.id}</td>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.zone}</td>
                  <td className="px-6 py-4 font-medium">{item.stock}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === 'In Stock' ? 'bg-green-100 text-green-700' : 
                      item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing <span className="font-medium text-gray-800">1</span> to <span className="font-medium text-gray-800">5</span> of <span className="font-medium text-gray-800">1,248</span> results</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-400 cursor-not-allowed">Prev</button>
            <button className="px-3 py-1 border border-gray-200 rounded text-sm bg-green-50 text-green-700 font-medium">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}