import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Map, Package, Activity, Bell, HelpCircle,
  Plus, LayoutTemplate, Upload, FileText, Trash2, AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalItems: 0, totalZones: 0, lowStock: 0, utilization: 0 });
  const [projectData, setProjectData] = useState(null);
  const [hasLayout, setHasLayout] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Modal create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileSelected, setFileSelected] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Modal delete konfirmasi
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = () => localStorage.getItem('token');
  const authHeader = () => ({ headers: { Authorization: `Bearer ${token()}` } });

  const fetchProjectStatus = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/markdown/project/status', authHeader());
      if (res.data.success) {
        setHasLayout(res.data.hasLayout);
        setProjectData(res.data.project || null);
      }
    } catch (err) {
      console.error('Gagal load project status:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/markdown/stats', authHeader());
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.error('Gagal load stats:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProjectStatus(), fetchStats()]).finally(() => setFetchLoading(false));
  }, [fetchProjectStatus, fetchStats]);

  const handleCreateLayout = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Nama layout wajib diisi!');
    setCreateLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (fileSelected) formData.append('markdownFile', fileSelected);

      const res = await axios.post('http://localhost:5000/api/markdown/create-project', formData, {
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setName(''); setDescription(''); setFileSelected(null);
        await Promise.all([fetchProjectStatus(), fetchStats()]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat layout.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteLayout = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete('http://localhost:5000/api/markdown/project', authHeader());
      setShowDeleteModal(false);
      setHasLayout(false);
      setProjectData(null);
      setStats({ totalItems: 0, totalZones: 0, lowStock: 0, utilization: 0 });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus layout.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50/50 p-4 sm:p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Overview of your inventory and spaces</p>
        </div>
        <div className="flex items-center gap-3">
          {!hasLayout && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors shadow-sm"
            >
              <Plus size={16} /> New Layout
            </button>
          )}
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Bell size={18} /></button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><HelpCircle size={18} /></button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50/50 p-4 sm:p-5 rounded-2xl border border-green-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-xl"><Box size={22} /></div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Items</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{stats.totalItems.toLocaleString()} Items</h3>
            <p className="text-[10px] sm:text-xs text-green-600 font-medium">From all markdown files</p>
          </div>
        </div>
        <div className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl"><Map size={22} /></div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Zones</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{stats.totalZones} Zones</h3>
          </div>
        </div>
        <div className="bg-orange-50/50 p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-700 rounded-xl"><Package size={22} /></div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Low Stock</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{stats.lowStock} Items</h3>
          </div>
        </div>
        <div className="bg-purple-50/50 p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl"><Activity size={22} /></div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Utilization</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{stats.utilization}%</h3>
          </div>
        </div>
      </div>

      {/* LAYOUT CARD */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">Active Layout</h2>
        </div>

        {fetchLoading ? (
          <p className="text-sm text-gray-400 text-center py-10 animate-pulse">Memuat data layout...</p>
        ) : !hasLayout ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <LayoutTemplate size={40} className="text-gray-200" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Belum ada layout</p>
              <p className="text-xs text-gray-400 mt-1">Klik "New Layout" untuk mulai buat denah gudang</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
            >
              <Plus size={16} /> Buat Layout Pertama
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 border border-green-200 rounded-xl flex items-center justify-center text-green-600">
                <LayoutTemplate size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">{projectData?.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {projectData?.file_count || 0} file .md &bull; {projectData?.description || 'No description'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Dibuat: {new Date(projectData?.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded-full">Active</span>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} /> Hapus Layout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREATE LAYOUT */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Buat Layout Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateLayout} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Gudang / Layout *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Gudang Hub Bandung"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-600 focus:bg-white transition-all"
                  required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Deskripsi</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan lokasi gudang..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-600 focus:bg-white transition-all h-20 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Upload File .md (Opsional)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center hover:bg-gray-100 transition-all relative cursor-pointer">
                  <input type="file" accept=".md" onChange={(e) => setFileSelected(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center gap-1 text-gray-500">
                    {fileSelected ? (
                      <><FileText size={20} className="text-green-600" /><p className="text-xs font-semibold text-gray-700">{fileSelected.name}</p></>
                    ) : (
                      <><Upload size={18} className="text-gray-400" /><p className="text-xs text-gray-500">Klik atau seret file .md ke sini</p></>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1 justify-end">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={createLoading}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg disabled:bg-gray-300">
                  {createLoading ? 'Memproses...' : fileSelected ? 'Import Layout' : 'Buat Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DELETE KONFIRMASI */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-xl"><AlertTriangle size={20} className="text-red-500" /></div>
              <h3 className="font-bold text-gray-800">Hapus Layout?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">Aksi ini akan menghapus:</p>
            <ul className="text-sm text-red-500 font-medium mb-4 space-y-0.5 ml-4 list-disc">
              <li>Layout <span className="font-bold">{projectData?.name}</span></li>
              <li>Semua {projectData?.file_count || 0} file .md di dalamnya</li>
              <li>Seluruh inventory logs terkait</li>
            </ul>
            <p className="text-xs text-gray-400 mb-5">Aksi ini tidak bisa dibatalkan.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Batal</button>
              <button onClick={handleDeleteLayout} disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}