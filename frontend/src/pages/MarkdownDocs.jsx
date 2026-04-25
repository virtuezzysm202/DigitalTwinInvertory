import React from 'react';
import { FileText, BookOpen, Download, Search } from 'lucide-react';

export default function MarkdownDocs() {
  // Data statis untuk daftar file
  const files = [
    { id: 1, name: 'Getting_Started.md', date: 'Oct 24, 2026', size: '2.4 KB' },
    { id: 2, name: 'API_Documentation.md', date: 'Oct 25, 2026', size: '15.1 KB' },
    { id: 3, name: 'Warehouse_Setup.md', date: 'Nov 02, 2026', size: '8.7 KB' },
    { id: 4, name: 'System_Architecture.md', date: 'Nov 10, 2026', size: '5.2 KB' },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 max-h-full">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">System Documentation</h1>
          <p className="text-sm text-gray-500">Read system manuals and technical guidelines.</p>
        </div>
        <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 w-full sm:w-auto">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search docs..." 
            className="bg-transparent border-none outline-none ml-2 text-sm w-full" 
          />
        </div>
      </div>

      {/* Area Konten Utama (Kiri List, Kanan Isi) */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden">
        
        {/* Sidebar Kiri: Daftar File */}
        <div className="w-full lg:w-1/3 xl:w-1/4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen size={18} className="text-green-600" />
              Markdown Files
            </h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {files.map((file, idx) => (
              <div 
                key={file.id} 
                className={`p-3 rounded-lg cursor-pointer flex items-start gap-3 transition-colors ${
                  idx === 0 ? 'bg-green-50 border border-green-100' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <FileText size={20} className={idx === 0 ? 'text-green-600' : 'text-gray-400'} />
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-medium truncate ${idx === 0 ? 'text-green-800' : 'text-gray-700'}`}>
                    {file.name}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">{file.date}</span>
                    <span className="text-xs text-gray-400">{file.size}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Konten Kanan: Pembaca File (Viewer) */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm p-6 overflow-y-auto">
          {/* Judul File */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Getting_Started.md</h2>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <Download size={16} /> <span className="hidden sm:inline">Download</span>
            </button>
          </div>
          
          {/* Simulasi Teks Markdown */}
          <div className="text-gray-700 space-y-4">
            <h1 className="text-3xl font-extrabold text-gray-900 border-b border-gray-200 pb-2">Welcome to TwinStock</h1>
            <p className="leading-relaxed">
              TwinStock is a modern digital twin inventory management system. This guide will help you set up your warehouse environment and start tracking your items efficiently.
            </p>
            
            <h2 className="text-xl font-bold text-gray-800 mt-8">1. Setting Up Your 2D Layout</h2>
            <p className="leading-relaxed">To begin mapping your warehouse physically, navigate to the <strong>2D Layout Editor</strong>.</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Use the <strong>"Add Zone"</strong> tool to create designated areas (e.g., Receiving, Storage, Shipping).</li>
              <li>Use the <strong>"Add Rack"</strong> tool to place shelving units inside those zones.</li>
              <li>You can drag and drop these elements at any time to match your physical warehouse structure.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-800 mt-8">2. Managing Inventory Data</h2>
            <p className="leading-relaxed">
              Once your zones are set up, head over to the <code>Inventory</code> tab. When adding a new item, you can assign it directly to a specific Rack or Zone you created in the 2D Editor.
            </p>

            <div className="bg-gray-800 text-gray-100 rounded-lg p-4 mt-6 font-mono text-sm shadow-inner">
              <p className="text-gray-400 mb-1"># Command to start the application locally</p>
              <p><span className="text-green-400">npm</span> install</p>
              <p><span className="text-green-400">npm</span> run dev</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}