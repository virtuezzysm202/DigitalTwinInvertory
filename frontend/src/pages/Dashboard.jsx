import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Map, Package, Activity, Bell, HelpCircle, 
  Plus, MoreVertical, LayoutTemplate, Upload, FileText
} from 'lucide-react';

export default function Dashboard() {
  // --- STATE MANAGEMENT ---
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileSelected, setFileSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State Data Riil Backend
  const [recentLayouts, setRecentLayouts] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalZones: 0,
    lowStock: 0,
    utilization: 0
  });
  const [fetchLoading, setFetchLoading] = useState(true);

// --- FETCH DATA DASHBOARD & STATISTIK (SUPER STABLE VERSION) ---
  const fetchDashboardData = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // 1. Tembak ke endpoint inventory
      const statsRes = await axios.get('http://localhost:5000/api/inventory?limit=1', { headers }); 

      // KUNCI DEBUG: Intip struktur JSON asli dari backend di Console Browser (F12)
      console.log("ISI RESPONS BACKEND INVENTORY:", statsRes.data);

      if (statsRes.data && statsRes.data.success) {
        const resData = statsRes.data;

        // 2. Pemetaan Pintar (Mendukung format mentah maupun format ber-objek)
        setStats({
          // Cek resData.totalItems atau resData.data.totalItems
          totalItems: resData.totalItems ?? resData.data?.totalItems ?? 0,
          
          // Cek semua kemungkinan penamaan Global Total Zones
          totalZones: resData.globalTotalZones ?? resData.totalZones ?? resData.data?.globalTotalZones ?? resData.data?.totalZones ?? 0,
          
          // Cek semua kemungkinan penamaan Low Stock
          lowStock: resData.globalLowStock ?? resData.lowStock ?? resData.data?.globalLowStock ?? resData.data?.lowStock ?? 0,
          
          utilization: (resData.totalItems ?? resData.data?.totalItems ?? 0) > 0 ? 45.5 : 0
        });
      }

      // 3. Ambil data layout untuk workspace aktif
      const projectRes = await axios.get('http://localhost:5000/api/markdown/layout', { headers });

      if (projectRes.data && projectRes.data.success) {
        setRecentLayouts([
          {
            id: projectRes.data.projectId,
            name: projectRes.data.data?.room?.name || "Gudang Utama",
            description: "Active Layout Workspace",
            updated_at: new Date().toISOString()
          }
        ]);
      }

    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
      setStats({ totalItems: 0, totalZones: 0, lowStock: 0, utilization: 0 });
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- HANDLER SUBMIT MODAL (HYBRID NEW LAYOUT) ---
  const handleCreateLayout = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Nama gudang wajib diisi!');

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      
      if (fileSelected) {
        formData.append('markdownFile', fileSelected);
      }

      const response = await axios.post(
        'http://localhost:5000/api/markdown/create-project',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        setIsOpen(false);
        setName('');
        setDescription('');
        setFileSelected(null);
        fetchDashboardData(); // Refresh data halaman utama
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Gagal membuat layout baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50/50 p-4 sm:p-6 space-y-6">
      
      {/* 1. HEADER DASHBOARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Overview of your inventory and spaces</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-800 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus size={16} /> New Layout
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={18} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-green-50/50 p-4 sm:p-5 rounded-2xl border border-green-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-xl"><Box size={22} /></div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Items</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-0.5">{stats.totalItems.toLocaleString()} Items</h3>
            <p className="text-[10px] sm:text-xs text-green-600 font-medium">Live sync data</p>
          </div>
        </div>

        {/* Total Zones */}
        <div className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl"><Map size={22} /></div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Zones</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-0.5">{stats.totalZones} Zones</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">Dynamic Area Map</p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-orange-50/50 p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-700 rounded-xl"><Package size={22} /></div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Low Stock</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-0.5">{stats.lowStock} Items</h3>
            <p className="text-[10px] sm:text-xs text-red-500 font-medium">Needs attention</p>
          </div>
        </div>

        {/* Utilization */}
        <div className="bg-purple-50/50 p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl"><Activity size={22} /></div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Utilization</p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-0.5">{stats.utilization}%</h3>
            <p className="text-[10px] sm:text-xs text-purple-600 font-medium">Space status</p>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: RECENT LAYOUTS */}
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">Recent Layouts</h2>
            <button className="text-xs sm:text-sm font-medium text-green-700 hover:text-green-800">View All</button>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {fetchLoading ? (
              <p className="text-xs sm:text-sm text-gray-400 text-center py-16 animate-pulse">Memuat data gudang...</p>
            ) : recentLayouts.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-400 text-center py-16">Belum ada layout. Klik "New Layout" untuk buat baru.</p>
            ) : (
              recentLayouts.map((layout) => (
                <div key={layout.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer border border-gray-100/50 lg:border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-14 h-11 sm:w-16 sm:h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                      <LayoutTemplate size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm truncate">{layout.name}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                        {layout.description || 'No description'} &bull; {new Date(layout.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded-full">
                      Active
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-800 block lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- FLOATING MODAL INTERFACE --- */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 sm:px-6 sm:py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">Inisialisasi Layout Baru</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleCreateLayout} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-600 uppercase mb-1">Nama Gudang / Layout *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Contoh: Gudang Hub Bandung" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-green-600 focus:bg-white transition-all text-gray-800" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-600 uppercase mb-1">Deskripsi Singkat</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Tulis catatan lokasi gudang..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-green-600 focus:bg-white transition-all text-gray-800 h-16 sm:h-20 resize-none" 
                />
              </div>

              <div className="pt-1">
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1.5">Upload File .md (Opsional)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50 text-center hover:bg-gray-100/70 transition-all relative cursor-pointer">
                  <input 
                    type="file" 
                    accept=".md" 
                    onChange={(e) => setFileSelected(e.target.files[0])} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  />
                  <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                    {fileSelected ? (
                      <>
                        <FileText size={20} className="text-green-600 animate-bounce" />
                        <p className="text-[11px] sm:text-xs font-semibold text-gray-700 truncate max-w-[200px]">{fileSelected.name}</p>
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="text-gray-400" />
                        <p className="text-[11px] sm:text-xs font-medium text-gray-600">Klik / seret file .md ke sini</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end text-xs sm:text-sm">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-all disabled:bg-gray-300"
                >
                  {loading ? 'Memproses...' : fileSelected ? 'Import Layout' : 'Buat Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}