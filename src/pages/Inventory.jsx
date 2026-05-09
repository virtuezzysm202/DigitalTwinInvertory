import React, { useState } from 'react';
import { 
  Box, ClipboardList, DollarSign, LayoutGrid, Search, Filter, 
  MoreVertical, X, Edit, ArrowRightLeft, Trash2, Sparkles, 
  ChevronLeft, ChevronRight, Package, Settings, Monitor, HardHat, Droplets
} from 'lucide-react';

export default function Inventory() {
  // Data dummy sesuai dengan desain UI
  const inventoryData = [
    { 
      id: 'cnc_01', name: 'CNC Machine 01', category: 'Equipment', location: 'Production Area', 
      stock: 1, status: 'In Stock', updated: '2 hours ago', value: '$15,500.00', 
      desc: 'Computer Numerical Control Machine for precision machining', icon: Settings 
    },
    { 
      id: 'box_sensor_01', name: 'Box Sensor 01', category: 'Sensor', location: 'Storage A', 
      stock: 48, status: 'In Stock', updated: '5 hours ago', value: '$1,200.00', 
      desc: 'Standard IoT sensor for box weight tracking', icon: Package 
    },
    { 
      id: 'pallet_rack_a', name: 'Pallet Rack A', category: 'Furniture', location: 'Production Area', 
      stock: 12, status: 'In Stock', updated: '1 day ago', value: '$3,600.00', 
      desc: 'Heavy duty steel pallet rack', icon: LayoutGrid 
    },
    { 
      id: 'office_desk', name: 'Office Desk', category: 'Furniture', location: 'Office', 
      stock: 5, status: 'In Stock', updated: '2 days ago', value: '$1,500.00', 
      desc: 'Ergonomic wooden office desk', icon: Box 
    },
    { 
      id: 'hydraulic_pump', name: 'Hydraulic Pump', category: 'Equipment', location: 'Production Area', 
      stock: 2, status: 'Low Stock', updated: '3 days ago', value: '$2,400.00', 
      desc: 'Industrial grade hydraulic pump', icon: Settings 
    },
    { 
      id: 'safety_helmet', name: 'Safety Helmet', category: 'PPE', location: 'Storage A', 
      stock: 3, status: 'Low Stock', updated: '1 week ago', value: '$150.00', 
      desc: 'Standard safety helmet (yellow)', icon: HardHat 
    },
    { 
      id: 'lubricant_oil', name: 'Lubricant Oil', category: 'Consumable', location: 'Storage A', 
      stock: 0, status: 'Out of Stock', updated: '2 weeks ago', value: '$0.00', 
      desc: 'Machine lubricant oil (5L drum)', icon: Droplets 
    },
    { 
      id: 'monitor_24', name: 'Monitor 24"', category: 'Electronics', location: 'Office', 
      stock: 8, status: 'In Stock', updated: '2 weeks ago', value: '$1,600.00', 
      desc: '24-inch 1080p IPS display', icon: Monitor 
    },
  ];

  // State untuk item yang dipilih (default: item pertama)
  const [activeItem, setActiveItem] = useState(inventoryData[0]);

  // Fungsi penentu warna status
  const getStatusColor = (status) => {
    if (status === 'In Stock') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Low Stock') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50 space-y-4">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-start shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, search, and track all your items</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
            + Add Item
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100"><Box size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Items</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-800">65</span>
            </div>
            <p className="text-xs text-gray-500">Across 3 zones</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full border border-orange-100"><ClipboardList size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-800">7 items</span>
            </div>
            <p className="text-xs text-orange-600 font-medium">Need attention</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100"><DollarSign size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-800">$24,850</span>
            </div>
            <p className="text-xs text-green-600 font-medium">+5.2% this month</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100"><LayoutGrid size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zones</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-800">3</span>
            </div>
            <p className="text-xs text-gray-500">196.00 m²</p>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR & FILTER */}
      <div className="flex justify-between items-center shrink-0 gap-4 mt-2">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none">
            <option>All Zones</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none">
            <option>All Status</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT (Split View) */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* KIRI: Tabel Inventory */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventoryData.map((item) => {
                  const isActive = activeItem?.id === item.id;
                  const IconComp = item.icon;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setActiveItem(item)}
                      className={`cursor-pointer transition-colors ${
                        isActive ? 'bg-green-50/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0 border border-gray-200">
                            <IconComp size={20} />
                          </div>
                          <div>
                            <p className={`font-semibold ${isActive ? 'text-green-800' : 'text-gray-900'}`}>{item.name}</p>
                            <p className="text-xs text-gray-500">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          {item.location}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center font-semibold text-gray-800">{item.stock}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-3 py-1 border text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">{item.updated}</td>
                      <td className="px-6 py-3 text-right">
                        <button className="p-1.5 text-gray-400 hover:text-gray-800 rounded">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-white shrink-0">
            <span className="text-sm text-gray-500">Showing 8 of 65 items</span>
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400"><ChevronLeft size={16} /></button>
              <button className="px-3 py-1 bg-green-700 text-white rounded font-medium text-sm">1</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600 text-sm">2</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600 text-sm">3</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600 text-sm">4</button>
              <button className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600 text-sm">5</button>
              <span className="px-2 py-1 text-gray-400">...</span>
              <button className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600 text-sm">9</button>
              <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* KANAN: Item Details Panel */}
        {activeItem && (
          <div className="w-[340px] bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm shrink-0 overflow-hidden">
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item Details</p>
              <button onClick={() => setActiveItem(null)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Item Overview */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 shrink-0">
                  {React.createElement(activeItem.icon, { size: 32 })}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{activeItem.name}</h2>
                  <p className="text-sm text-gray-500 mb-2">{activeItem.category}</p>
                  <span className={`px-2.5 py-0.5 border text-xs font-medium rounded-full ${getStatusColor(activeItem.status)}`}>
                    {activeItem.status}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="space-y-4 mb-6 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Item ID</span>
                  <span className="font-medium text-gray-900 text-right">{activeItem.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900 text-right">{activeItem.location}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Stock Quantity</span>
                  <span className="font-medium text-gray-900 text-right">{activeItem.stock} unit{activeItem.stock !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Unit Value</span>
                  <span className="font-medium text-gray-900 text-right">{activeItem.value}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium text-gray-900 text-right">Dec 10, 2024 14:30</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-800 mb-1">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{activeItem.desc}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mb-6">
                <button className="w-full flex justify-center items-center gap-2 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
                  <Edit size={16} /> Edit Item
                </button>
                <button className="w-full flex justify-center items-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ArrowRightLeft size={16} /> Move to...
                </button>
                <button className="w-full flex justify-center items-center gap-2 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors mt-4">
                  <Trash2 size={16} /> Delete Item
                </button>
              </div>

              {/* AI Suggestion Box */}
              <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-2 uppercase tracking-wide">
                  <Sparkles size={14} /> AI Suggestion
                </div>
                <p className="text-sm text-blue-900 mb-3 leading-relaxed">
                  Consider setting reorder point for this item. Similar items usually reorder at 2 units.
                </p>
                <button className="text-sm text-blue-700 font-semibold hover:text-blue-800 flex items-center gap-1">
                  Set Reorder Point &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}