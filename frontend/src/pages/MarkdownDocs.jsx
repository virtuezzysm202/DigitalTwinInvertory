import React, { useState, useEffect } from 'react';
import axios from 'axios';
// 🔽 1. IMPORT useNavigate dari react-router-dom
import { useNavigate } from 'react-router-dom'; 
import { 
  FileText, Clock, HardDrive, Code, RefreshCw, 
  Maximize, Edit3, CheckCircle, AlertCircle
} from 'lucide-react';

export default function MarkdownDocs() {
  // 🔽 2. INISIALISASI NAVIGASI
  const navigate = useNavigate(); 

  const [rawMarkdown, setRawMarkdown] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [activeTab, setActiveTab] = useState('JSON-Runtime'); // disamakan dengan default tab di bawah
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarkdownData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token'); 
      const response = await axios.get('/api/markdown/layout', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setRawMarkdown(response.data.rawMarkdown || '');
        setParsedData(response.data.data || null);
      }
    } catch (err) {
      console.error("Error fetching markdown:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesi lu habis atau lu ga punya akses (Unauthorized), bro.');
      } else {
        setError(err.response?.data?.message || 'Gagal membaca berkas Markdown utama dari server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkdownData();
  }, []);

  const totalZones = parsedData?.zones?.length || parsedData?.layout?.zones?.length || 0;
  const totalItems = parsedData?.items?.length || parsedData?.layout?.items?.length || 0;
  const totalLines = rawMarkdown.split('\n').length;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-green-700 mx-auto" size={32} />
          <p className="text-sm text-gray-500 font-medium">Memuat JSON Runtime dari berkas Markdown...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-gray-50 p-4">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="text-red-500 mx-auto mb-3" size={40} />
          <p className="text-red-600 font-semibold mb-2">Terjadi Kesalahan</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={fetchMarkdownData} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 space-y-4 p-4 md:p-6 overflow-y-auto">
      
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">warehouse.md</h1>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
              <CheckCircle size={12} /> Live Runtime
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Sistem Manajemen Layout Inventory berbasis Markdown-First</p>
        </div>
        <button onClick={fetchMarkdownData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw size={16} /> Sync Server
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><FileText size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">File Target</p>
            <span className="text-lg font-bold text-gray-800">warehouse.md</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Clock size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Zones Detected</p>
            <span className="text-2xl font-bold text-gray-800">{totalZones} <span className="text-xs font-normal text-gray-400">grup</span></span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><HardDrive size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Items Tracked</p>
            <span className="text-2xl font-bold text-gray-800">{totalItems} <span className="text-xs font-normal text-gray-400">units</span></span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Code size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Document Length</p>
            <span className="text-2xl font-bold text-gray-800">{totalLines} <span className="text-xs font-normal text-gray-400">lines</span></span>
          </div>
        </div>
      </div>

      {/* CORE INTERFACE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL KIRI: Raw Teks Editor Box */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Code size={16} className="text-green-700" /> Source File Code Content
            </span>
          </div>
          <div className="flex-1 font-mono text-xs bg-slate-900 text-slate-100 p-4 overflow-auto leading-5 select-text">
            <pre className="whitespace-pre-wrap">{rawMarkdown || "# File Kosong"}</pre>
          </div>
        </div>

        {/* PANEL KANAN: Live Parse Analyzer Preview */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-[500px]">
          <div className="border-b border-gray-100 px-4 flex justify-between items-center bg-gray-50/70 shrink-0">
            <div className="flex">
              {['JSON-Runtime', 'Raw-Debug'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === tab 
                      ? 'text-green-700 border-b-2 border-green-600 bg-white' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 bg-gray-50/30">
            {activeTab === 'JSON-Runtime' ? (
              <div className="space-y-4">
                <div className="bg-green-50/50 p-3 rounded-lg border border-green-100/70 text-xs text-green-800">
                  💡 <strong>Info Mesin:</strong> Data di bawah ini dirender dinamis dari hasil konversi <code>markdownParser.js</code> backend.
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-700">Metadata Gudang</h3>
                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs space-y-1 text-xs">
                    <p><span className="text-gray-400">File Name:</span> {parsedData?.name || 'warehouse.md'}</p>
                    <p><span className="text-gray-400">Parsing Status:</span> Success</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-700">Daftar Zona Terdeteksi</h3>
                  <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
                    {(parsedData?.zones || parsedData?.layout?.zones || []).map((zone, idx) => (
                      <div key={idx} className="bg-white px-3 py-2 rounded-md border border-gray-200/60 text-xs flex justify-between items-center">
                        <span className="font-semibold text-gray-700">{zone.name || zone.id || `Zone ${idx + 1}`}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">{zone.area || '0'} sqm</span>
                      </div>
                    ))}
                    {!(parsedData?.zones || parsedData?.layout?.zones) && (
                      <p className="text-xs text-gray-400 italic">Tidak ada data zona.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="font-mono text-[11px] bg-gray-900 text-green-400 p-4 rounded-xl overflow-auto h-full shadow-inner">
                <pre>{JSON.stringify(parsedData, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Panel Footer Action Buttons */}
          <div className="p-4 border-t border-gray-100 flex gap-2 bg-gray-50 shrink-0">
            {/* 🔽 3. PASANG onClick KE JALUR ROUTE UTAMA LAYOUT 2D KAMU */}
            <button 
              onClick={() => navigate('/2d-layout')} 
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors shadow-sm"
            >
              <Maximize size={16} /> <span>Open in 2D Editor</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Edit3 size={16} /> <span>Edit File</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}