import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, HardDrive, Code, RefreshCw,
  Maximize, Trash2, Plus, X, CheckCircle,
  AlertCircle, ChevronRight, Layers
} from 'lucide-react';

export default function MarkdownDocs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileIdFromUrl = searchParams.get('fileId');

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk preview panel kanan
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('raw');

  // State untuk modal buat file baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchAllFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/markdown/files', getAuthHeader());
      if (res.data.success) setFiles(res.data.files || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesi habis atau tidak punya akses.');
      } else {
        setError(err.response?.data?.message || 'Gagal mengambil daftar file.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreview = async (fileId) => {
    setIsPreviewLoading(true);
    setPreviewData(null);
    try {
      const res = await axios.get(`/api/markdown/files/${fileId}`, getAuthHeader());
      if (res.data.success) setPreviewData(res.data);
    } catch (err) {
      console.error('Gagal load preview:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    fetchPreview(file.id);
  };

  const handleDeleteFile = async (fileId, filename, e) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus file "${filename}"? Aksi ini tidak bisa dibatalkan.`)) return;
    try {
      await axios.delete(`/api/markdown/files/${fileId}`, getAuthHeader());
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setPreviewData(null);
      }
      fetchAllFiles();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus file.');
    }
  };

  const handleCreateFile = async () => {
    if (!newFilename.trim()) {
      setCreateError('Nama file tidak boleh kosong.');
      return;
    }
    setIsCreating(true);
    setCreateError('');
    try {
      await axios.post('/api/markdown/files', { filename: newFilename.trim() }, getAuthHeader());
      setShowCreateModal(false);
      setNewFilename('');
      fetchAllFiles();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Gagal membuat file.');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => { fetchAllFiles(); }, []);

  const totalFiles = files.length;
  const totalZones = files.reduce((s, f) => s + (f.totalZones || 0), 0);
  const totalItems = files.reduce((s, f) => s + (f.totalItems || 0), 0);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-green-700 mx-auto" size={32} />
          <p className="text-sm text-gray-500 font-medium">Memuat daftar file Markdown...</p>
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
          <button onClick={fetchAllFiles} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-4 md:p-6 gap-4 overflow-y-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Markdown Files</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua file denah gudang (.md) milik kamu</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAllFiles} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors shadow-sm">
            <Plus size={16} /> File Baru
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><FileText size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Files</p>
            <span className="text-2xl font-bold text-gray-800">{totalFiles} <span className="text-xs font-normal text-gray-400">files</span></span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Layers size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Zones</p>
            <span className="text-2xl font-bold text-gray-800">{totalZones} <span className="text-xs font-normal text-gray-400">zona</span></span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><HardDrive size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Items</p>
            <span className="text-2xl font-bold text-gray-800">{totalItems} <span className="text-xs font-normal text-gray-400">items</span></span>
          </div>
        </div>
      </div>

      {/* MAIN AREA: LIST + PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">

        {/* FILE LIST */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70">
            <span className="text-sm font-bold text-gray-700">Daftar File ({totalFiles})</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <FileText size={36} className="text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-500">Belum ada file</p>
                <p className="text-xs text-gray-400 mt-1">Klik "File Baru" untuk membuat denah pertama kamu</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors group ${selectedFile?.id === file.id ? 'bg-green-50/60 border-l-2 border-green-600' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${selectedFile?.id === file.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{file.filename}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{file.totalZones} zona</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400">{file.totalItems} items</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400">{file.totalLines} baris</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleDeleteFile(file.id, file.filename, e)}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={14} className={`text-gray-300 ${selectedFile?.id === file.id ? 'text-green-500' : ''}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PREVIEW PANEL */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-[500px]">
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Code size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-400">Pilih file untuk melihat isi dan detailnya</p>
            </div>
          ) : isPreviewLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="animate-spin text-green-600" size={24} />
            </div>
          ) : (
            <>
              {/* Header Preview */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-green-600" />
                  <span className="text-sm font-bold text-gray-700">{selectedFile.filename}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle size={10} /> Live
                  </span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-gray-100 bg-gray-50/70 shrink-0">
                {['raw', 'json'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 text-xs font-semibold transition-all ${activeTab === tab ? 'text-green-700 border-b-2 border-green-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {tab === 'raw' ? 'Source Code' : 'JSON Runtime'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto">
                {activeTab === 'raw' ? (
                  <div className="font-mono text-xs bg-slate-900 text-slate-100 p-4 min-h-full leading-5">
                    <pre className="whitespace-pre-wrap">{previewData?.rawMarkdown || '# Empty'}</pre>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    <div className="bg-green-50/50 p-3 rounded-lg border border-green-100/70 text-xs text-green-800">
                      💡 Hasil parse dari <code>markdownParser.js</code> backend secara real-time.
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daftar Zona</h3>
                      <div className="space-y-1.5">
                        {(previewData?.data?.zones || []).map((zone, idx) => (
                          <div key={idx} className="bg-gray-50 px-3 py-2 rounded-md border border-gray-200/60 text-xs flex justify-between items-center">
                            <span className="font-semibold text-gray-700">{zone.name || zone.id || `Zone ${idx + 1}`}</span>
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-[10px]">{zone.items?.length || 0} items</span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">{zone.area || '0'} sqm</span>
                            </div>
                          </div>
                        ))}
                        {(!previewData?.data?.zones || previewData?.data?.zones.length === 0) && (
                          <p className="text-xs text-gray-400 italic">Tidak ada zona terdeteksi.</p>
                        )}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] bg-gray-900 text-green-400 p-3 rounded-xl overflow-auto max-h-[200px]">
                      <pre>{JSON.stringify(previewData?.data, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 flex gap-2 bg-gray-50 shrink-0">
                <button
                  onClick={() => navigate(`/2d-layout?fileId=${selectedFile.id}`)}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors shadow-sm"
                >
                  <Maximize size={16} /> Open in 2D Editor
                </button>
                <button
                  onClick={(e) => handleDeleteFile(selectedFile.id, selectedFile.filename, e)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL BUAT FILE BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Buat File Baru</h2>
              <button onClick={() => { setShowCreateModal(false); setCreateError(''); setNewFilename(''); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">File baru akan diisi template default dan langsung bisa diedit di 2D Editor.</p>
            <div className="space-y-1 mb-4">
              <label className="text-xs font-semibold text-gray-600">Nama File</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-green-500">
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                  placeholder="contoh: gudang-lantai-2"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                />
                <span className="px-3 py-2 bg-gray-50 border-l border-gray-200 text-xs text-gray-400 font-mono">.md</span>
              </div>
              {createError && <p className="text-xs text-red-500 mt-1">{createError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowCreateModal(false); setCreateError(''); setNewFilename(''); }} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Batal
              </button>
              <button onClick={handleCreateFile} disabled={isCreating} className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-60">
                {isCreating ? 'Membuat...' : 'Buat File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}