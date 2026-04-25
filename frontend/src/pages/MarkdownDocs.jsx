import React, { useState } from 'react';
import { 
  FileText, Clock, HardDrive, Code, Plus, Upload, RefreshCw, 
  Search, List, Grid, MoreVertical, X, Maximize, Edit3, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function MarkdownDocs() {
  // Data dummy sesuai desain
  const files = [
    { id: 1, name: 'main_warehouse.md', path: '/layouts/main_warehouse.md', modified: '2 hours ago', author: 'Rafi Maulana', lines: 156, active: true },
    { id: 2, name: 'production_line.md', path: '/layouts/production_line.md', modified: '1 day ago', author: 'Rafi Maulana', lines: 89, active: false },
    { id: 3, name: 'office_layout.md', path: '/layouts/office_layout.md', modified: '3 days ago', author: 'Rafi Maulana', lines: 67, active: false },
    { id: 4, name: 'storage_facility.md', path: '/layouts/storage_facility.md', modified: '1 week ago', author: 'Rafi Maulana', lines: 134, active: false },
    { id: 5, name: 'backup_warehouse_v2.md', path: '/backups/backup_warehouse_v2.md', modified: '2 weeks ago', author: 'Rafi Maulana', lines: 156, active: false },
  ];

  const [activeFile, setActiveFile] = useState(files[0]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50 space-y-4">
      
      {/* 1. HEADER HALAMAN */}
      <div className="flex justify-between items-start shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Markdown Files</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your layout files and version history</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
            <Plus size={16} /> New Markdown File
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Upload size={16} /> Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><FileText size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Files</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-800">12</span>
              <span className="text-xs text-gray-500">3 active layouts</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Clock size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Modified</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-800">2 hours ago</span>
            </div>
            <p className="text-xs text-gray-500 truncate w-32">main_warehouse.md</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><HardDrive size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Storage Used</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-800">24.8 MB</span>
              <span className="text-xs text-gray-500">of 1 GB</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Code size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Lines</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-800">1,247</span>
            </div>
            <p className="text-xs text-gray-500">across all files</p>
          </div>
        </div>
      </div>

      {/* 3. AREA KONTEN BAWAH (Split: List & Preview) */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* KIRI: Daftar File */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar Pencarian & Filter */}
          <div className="flex justify-between items-center mb-4 shrink-0 gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search markdown files..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none">
                <option>All Status</option>
              </select>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white outline-none">
                <option>Sort by: Recent</option>
              </select>
              <div className="flex bg-gray-100 border border-gray-200 rounded-lg overflow-hidden ml-2">
                <button className="p-2 bg-white text-green-700 shadow-sm"><List size={18} /></button>
                <button className="p-2 text-gray-500 hover:text-gray-700"><Grid size={18} /></button>
              </div>
            </div>
          </div>

          {/* List File */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {files.map((file) => {
              const isActive = activeFile.id === file.id;
              return (
                <div 
                  key={file.id} 
                  onClick={() => setActiveFile(file)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    isActive ? 'border-green-500 bg-green-50/30 shadow-sm' : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg border ${isActive ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-green-600'}`}>
                      <span className="text-xs font-extrabold">MD</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${isActive ? 'text-green-800' : 'text-gray-800'}`}>{file.name}</h3>
                        {file.active && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Active</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{file.path}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> Modified {file.modified}</span>
                        <span className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-green-800 text-white flex items-center justify-center text-[8px] font-bold">RM</div>
                          {file.author}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-gray-400 px-3 py-1 bg-gray-50 rounded-md border border-gray-100">{file.lines} lines</span>
                    <button className="text-gray-400 hover:text-gray-700"><MoreVertical size={18} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center py-4 text-sm text-gray-500 shrink-0">
            <span>Showing 5 of 12 files</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={16} /></button>
              <button className="px-2.5 py-1 bg-green-700 text-white rounded font-medium">1</button>
              <button className="px-2.5 py-1 hover:bg-gray-200 rounded">2</button>
              <button className="px-2.5 py-1 hover:bg-gray-200 rounded">3</button>
              <button className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* KANAN: Panel Detail/Preview */}
        <div className="w-[420px] bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm shrink-0">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-green-50 border border-green-100 text-green-600 rounded">
                <span className="text-[10px] font-extrabold">MD</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-800 truncate max-w-[180px]">{activeFile.name}</h2>
                  {activeFile.active && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Active</span>}
                </div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
          </div>

          {/* Panel Tabs */}
          <div className="flex border-b border-gray-100 px-4">
            <button className="px-4 py-3 text-sm font-semibold text-green-700 border-b-2 border-green-600">Preview</button>
            <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">Info</button>
            <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">History</button>
          </div>

          {/* Panel Quick Stats */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="p-4 text-center">
              <p className="text-xl font-bold text-gray-800">3</p>
              <p className="text-xs text-gray-500 mt-1">Zones</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xl font-bold text-gray-800">65</p>
              <p className="text-xs text-gray-500 mt-1">Items</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xl font-bold text-gray-800">196.00 m²</p>
              <p className="text-xs text-gray-500 mt-1">Total Area</p>
            </div>
          </div>

          {/* Panel Code Preview */}
          <div className="flex-1 flex overflow-auto font-mono text-xs">
            <div className="bg-gray-50 text-gray-400 px-3 py-4 text-right select-none border-r border-gray-100">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="leading-5">{i + 1}</div>
              ))}
            </div>
            <pre className="p-4 text-gray-800 w-full overflow-auto whitespace-pre-wrap leading-5">
              <span className="text-green-700 font-bold"># Main Warehouse</span>{'\n'}
              <span className="text-blue-600">Scale:</span> 1:100{'\n'}
              <span className="text-blue-600">Unit:</span> meters{'\n\n'}
              <span className="text-green-600 font-bold">## Zones</span>{'\n\n'}
              <span className="text-green-500 font-bold">### Production Area</span>{'\n'}
              <span className="text-red-500">id:</span> production{'\n'}
              <span className="text-red-500">points:</span> [[0,0], [12,0], [12,8], [0,8]]{'\n'}
              <span className="text-red-500">color:</span> <span className="text-purple-600">#EFEFEF</span>{'\n'}
              <span className="text-red-500">items:</span>{'\n'}
              {'  '}<span className="text-gray-500">-</span> <span className="text-blue-500">id:</span> cnc_01{'\n'}
              {'    '}<span className="text-blue-500">name:</span> "CNC Machine 01"{'\n'}
              {'    '}<span className="text-blue-500">pos:</span> [2,2]{'\n'}
              {'    '}<span className="text-blue-500">icon:</span> machine{'\n'}
            </pre>
          </div>

          {/* Panel Footer Actions */}
          <div className="p-4 border-t border-gray-100 flex gap-2 bg-gray-50 rounded-b-xl">
            <button className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
              <Maximize size={16} /> Open in 2D Editor
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Edit3 size={16} /> Edit File
            </button>
            <button className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}