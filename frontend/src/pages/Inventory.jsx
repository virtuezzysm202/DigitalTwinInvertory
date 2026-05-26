import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  ClipboardList,
  DollarSign,
  LayoutGrid,
  Search,
  Filter,
  MoreVertical,
  X,
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Inventory() {
  // --- STATE MANAGEMENT ---
  const [inventoryData, setInventoryData] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Pagination State (Sesuai Controller Backend)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10); 

  // Summary Metrics (Sesuai Variabel Global Controller)
  const [globalSummary, setGlobalSummary] = useState({
    lowStock: 0,
    totalValue: 0,
    totalZones: 0
  });

  // Form State (Untuk Add & Edit)
  const [formData, setFormData] = useState({
    item_code: "",
    name: "",
    category: "",
    location: "",
    qty: "",
    unit_value: "",
    description: "",
    oldQty: 0, // Diperlukan oleh controller updateInventory kamu
  });

  const [loading, setLoading] = useState(false);

  // Ambil Data saat page atau kolom pencarian berubah
  useEffect(() => {
    fetchInventory();
  }, [currentPage, search]);

  // --- FETCH DATA INVENTORY ---
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); 
      const headers = { Authorization: `Bearer ${token}` };
      
      // Hit endpoint sesuai route get dengan query params page, limit, dan search
      const response = await axios.get(
        `http://localhost:5000/api/inventory?page=${currentPage}&limit=${limit}&search=${search}`,
        { headers }
      );
      
      if (response.data && response.data.success) {
        // Ambil array hasil paginatedItems dari backend
        setInventoryData(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);

        // Pasangkan metrik global langsung dari response controller
        setGlobalSummary({
          lowStock: response.data.globalLowStock || 0,
          totalValue: response.data.globalTotalValue || 0,
          totalZones: response.data.globalTotalZones || 1
        });
      }
    } catch (error) {
      console.error("Gagal memuat data inventory:", error);
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER SUBMIT (FORM ADD / EDIT) ---
  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = { 
        ...formData, 
        qty: Number(formData.qty || 0),
        unit_value: Number(formData.unit_value || 0) 
      };

      // Cek apakah ada oldQty, jika ada berarti proses UPDATE_ITEM
      if (formData.oldQty !== undefined && formData.isEditMode) {
        // Panggil exports.updateInventory
        await axios.put("http://localhost:5000/api/inventory", payload, config);
        alert("Data item berhasil diperbarui");
      } else {
        // Panggil exports.createInventory
        await axios.post("http://localhost:5000/api/inventory", payload, config);
        alert("Item berhasil ditambahkan ke tata letak berkas");
      }

      setShowModal(false);
      resetForm();
      setCurrentPage(1);
      fetchInventory(); // Refresh data
    } catch (error) {
      console.error("Gagal menyimpan data barang:", error);
      alert(error.response?.data?.message || "Gagal memproses item.");
    }
  };

  const resetForm = () => {
    setFormData({ 
      item_code: "", 
      name: "", 
      category: "", 
      location: "", 
      qty: "", 
      unit_value: "", 
      description: "",
      oldQty: 0,
      isEditMode: false
    });
  };

  const getStatusColor = (status) => {
    if (status === "In Stock" || status === "In-Stock") return "bg-green-50 text-green-700 border-green-200";
    if (status === "Low Stock" || status === "Low-Stock") return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-gray-50/50 space-y-4 p-1">
      
      {/* 1. HEADER PANEL */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory List</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gudang Utama Workspace &bull; Data Ter-parsing dari File Markdown Akun Anda
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS CARDS (Sinkron dengan Variabel Global Controller) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100"><Box size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Items</p>
            <span className="text-2xl font-bold text-gray-800">{totalItems}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full border border-orange-100"><ClipboardList size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock</p>
            <span className="text-2xl font-bold text-gray-800">{globalSummary.lowStock}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100"><DollarSign size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value</p>
            <span className="text-2xl font-bold text-gray-800">Rp {globalSummary.totalValue.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100"><LayoutGrid size={24} /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Zones</p>
            <span className="text-2xl font-bold text-gray-800">{globalSummary.totalZones} Zones</span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH CONTROLLER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center shrink-0 gap-4 mt-2">
        <div className="w-full sm:flex-1 relative sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari item code atau nama barang..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Balik ke page 1 setiap kali mengetik kata kunci baru
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* 4. MAIN INVENTORY TABLE */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px] lg:h-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-600 min-w-[700px]">
            <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Item Code / SKU</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location (Zone)</th>
                <th className="px-6 py-4 text-center">Stock Qty</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Unit Value</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-400 text-sm animate-pulse">
                    Sinkronisasi daftar barang...
                  </td>
                </tr>
              ) : inventoryData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada item terdaftar di berkas layout Anda.
                  </td>
                </tr>
              ) : (
                inventoryData.map((item, index) => (
                  <tr key={item.item_code || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700 bg-gray-50/40">
                      {item.item_code}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {item.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-blue-700">{item.location}</td>
                    <td className="px-6 py-4 text-center font-bold">{item.qty}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 border text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status || "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      Rp {(item.unit_value || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setFormData({
                              item_code: item.item_code || "",
                              name: item.name || "",
                              category: item.category || "",
                              location: item.location || "",
                              qty: item.qty || 0,
                              unit_value: item.unit_value || 0,
                              description: item.description || "",
                              oldQty: item.qty || 0, // Sangat penting untuk controller updateInventory kamu
                              isEditMode: true
                            });
                            setShowModal(true);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Edit size={16} />
                        </button>
                        <button className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION CONTROLS */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-gray-100 shrink-0 text-sm mt-auto">
          <div className="text-gray-500">
            Halaman <span className="font-semibold text-gray-700">{currentPage}</span> dari <span className="font-semibold text-gray-700">{totalPages}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-9 h-9 border rounded-lg font-medium text-xs transition-colors ${
                  currentPage === index + 1
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. MODAL INTERFACE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {formData.isEditMode ? "Edit Item Markdown" : "Tambah Item Baru"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Item Code / SKU *</label>
                <input
                  type="text"
                  name="item_code"
                  placeholder="Contoh: A1, B2, C3"
                  value={formData.item_code}
                  onChange={(e) => setFormData({...formData, item_code: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-600 disabled:bg-gray-100"
                  required
                  disabled={formData.isEditMode} // Item code biasanya jadi ID kunci di markdown, kunci agar tidak diubah saat edit
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Contoh: Kursi Ergonomis"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  placeholder="Contoh: Furniture"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Location Zone *</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Contoh: Zone A, Zone B"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
                  <input
                    type="number"
                    name="qty"
                    placeholder="0"
                    value={formData.qty}
                    onChange={(e) => setFormData({...formData, qty: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Value (Rp)</label>
                  <input
                    type="number"
                    name="unit_value"
                    placeholder="0"
                    value={formData.unit_value}
                    onChange={(e) => setFormData({...formData, unit_value: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  name="description"
                  placeholder="Catatan tambahan..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="2"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-600 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                {formData.isEditMode ? "Simpan Perubahan" : "Simpan Item Baru"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}