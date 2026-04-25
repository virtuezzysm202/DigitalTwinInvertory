import React from 'react';
import { Package, AlertTriangle, LayoutGrid, TrendingUp, Clock, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  // Data statis (dummy) untuk sementara sebelum backend siap
  const stats = [
    { label: 'Total Inventory', value: '1,248', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Low Stock Alerts', value: '12', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Active 2D Layouts', value: '4', icon: LayoutGrid, color: 'text-green-700', bg: 'bg-green-100' },
    { label: 'Monthly Turnaround', value: '+14%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const recentActivities = [
    { id: 1, action: 'Stock added', item: 'Intel Core i7 Processors', time: '2 hours ago', qty: '+50' },
    { id: 2, action: 'Layout updated', item: 'Warehouse Zone A', time: '4 hours ago', qty: null },
    { id: 3, action: 'Stock removed', item: 'Logitech Wireless Mouse', time: '5 hours ago', qty: '-12' },
    { id: 4, action: 'Low stock alert', item: 'DDR4 16GB RAM', time: '1 day ago', qty: 'Only 3 left' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, Admin. Here's what's happening in your warehouse today.</p>
      </div>

      {/* Kartu Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Area Konten Bawah (Dibagi 2 kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Quick 2D Layout Access (Porsi lebih besar) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Active Warehouse Layouts</h2>
            <button className="text-sm text-green-700 font-medium hover:text-green-800 flex items-center gap-1">
              View Editor <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 h-64 flex flex-col items-center justify-center text-gray-400">
            <LayoutGrid size={48} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">2D Layout Preview Canvas</p>
            <p className="text-sm mt-1">Select a layout from the 2D Editor to preview it here.</p>
          </div>
        </div>

        {/* Kolom Kanan: Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <Clock size={14} />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {activity.action} <span className="font-normal text-gray-500">- {activity.item}</span>
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{activity.time}</span>
                    {activity.qty && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        activity.qty.includes('+') ? 'bg-green-100 text-green-700' : 
                        activity.qty.includes('-') ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {activity.qty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            View All History
          </button>
        </div>

      </div>
    </div>
  );
}