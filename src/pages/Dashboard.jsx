import React from 'react';
import { 
  Box, Map, Package, Activity, Bell, HelpCircle, 
  Plus, MoreVertical, Sparkles, Send, LayoutTemplate 
} from 'lucide-react';

export default function Dashboard() {
  // Data dummy untuk Recent Layouts sesuai desain
  const recentLayouts = [
    { id: 1, name: 'Main Warehouse', updated: 'Updated 2 hours ago', size: '1.2 MB', active: true },
    { id: 2, name: 'Cold Storage', updated: 'Updated yesterday', size: '870 KB', active: true },
    { id: 3, name: 'Production Floor', updated: 'Updated 3 days ago', size: '2.1 MB', active: true },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50/50 p-6 space-y-6">
      
      {/* 1. HEADER DASHBOARD */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your inventory and spaces</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
            <Plus size={16} /> New Layout
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <HelpCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-xl"><Box size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Items</p>
            <h3 className="text-xl font-bold text-gray-800 mb-1">1,248 Items</h3>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              &uarr; 5.2% from last week
            </p>
          </div>
        </div>

        {/* Total Zones */}
        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl"><Map size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Zones</p>
            <h3 className="text-xl font-bold text-gray-800 mb-1">18 Zones</h3>
            <p className="text-xs text-gray-500">
              3 Floors &bull; 15 Rooms
            </p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-700 rounded-xl"><Package size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Low Stock</p>
            <h3 className="text-xl font-bold text-gray-800 mb-1">32 Items</h3>
            <p className="text-xs text-red-500 font-medium">
              Needs attention
            </p>
          </div>
        </div>

        {/* Utilization */}
        <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl"><Activity size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Utilization</p>
            <h3 className="text-xl font-bold text-gray-800 mb-1">68.4%</h3>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              &uarr; 2.1% from last week
            </p>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: Recent Layouts & AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RECENT LAYOUTS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Recent Layouts</h2>
            <button className="text-sm font-medium text-green-700 hover:text-green-800">View All</button>
          </div>
          
          <div className="flex-1 space-y-4">
            {recentLayouts.map((layout) => (
              <div key={layout.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-4">
                  {/* Thumbnail Placeholder */}
                  <div className="w-16 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <LayoutTemplate size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{layout.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{layout.updated} &bull; {layout.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {layout.active && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-full">
                      Active
                    </span>
                  )}
                  <button className="p-1 text-gray-400 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK AI ASSISTANT */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Quick AI Assistant</h2>
            <button className="text-sm font-medium text-green-700 hover:text-green-800">History</button>
          </div>

          <div className="flex-1 bg-green-50/50 border border-green-100 rounded-xl p-5 flex flex-col relative">
            <div className="flex gap-3 mb-6">
              <div className="mt-1 text-green-600">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-gray-800 font-semibold mb-1">Hi! I'm your Inventory Assistant.</p>
                <p className="text-sm text-gray-600">You can ask me anything about your stock and locations.</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs font-bold text-gray-500 mb-3">Try these examples:</p>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-green-700 font-medium py-2 px-3 rounded-lg hover:bg-green-100/50 transition-colors">
                  Where is the drill machine?
                </button>
                <button className="w-full text-left text-sm text-green-700 font-medium py-2 px-3 rounded-lg hover:bg-green-100/50 transition-colors">
                  Update stock: add 10 boxes of screws in Storage A
                </button>
                <button className="w-full text-left text-sm text-green-700 font-medium py-2 px-3 rounded-lg hover:bg-green-100/50 transition-colors">
                  What's running low this week?
                </button>
              </div>
            </div>

            <div className="mt-auto relative">
              <input 
                type="text" 
                placeholder="Type your command..." 
                className="w-full py-3 pl-4 pr-12 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors shadow-sm">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}