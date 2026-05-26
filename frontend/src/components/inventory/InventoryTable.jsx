import React from "react";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function InventoryTable({ 
  inventoryData, loading, search, setSearch, setCurrentPage, currentPage, totalPages, handleDeleteItem, setFormData, setShowModal 
}) {
  const getStatusColor = (status) => {
    const cleanStatus = String(status || "").toLowerCase();
    if (cleanStatus.includes("in")) return "bg-green-50 text-green-700 border-green-200";
    if (cleanStatus.includes("low")) return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <>
      <div className="w-full sm:flex-1 relative sm:max-w-md shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Cari item code atau nama barang..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[300px]">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-600 min-w-[700px]">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
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
                <tr><td colSpan="8" className="text-center py-12 text-gray-400">Sinkronisasi daftar barang...</td></tr>
              ) : inventoryData.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-gray-400">Tidak ada item terdaftar.</td></tr>
              ) : (
                inventoryData.map((item, index) => {
                  const itemCode = item.item_code || item.id;
                  return (
                    <tr key={itemCode || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">{itemCode}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                      <td className="px-6 py-4"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.category || "General"}</span></td>
                      <td className="px-6 py-4 font-medium text-blue-700">{item.location}</td>
                      <td className="px-6 py-4 text-center font-bold">{item.qty}</td>
                      
                      {/* PERBAIKAN PADA KOLOM STATUS */}
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 border text-xs font-semibold rounded-full whitespace-nowrap inline-block ${getStatusColor(item.status)}`}>
                          {item.status || "In Stock"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium">Rp {(item.unit_value || 0).toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setFormData({
                                item_code: itemCode || "", name: item.name || "", category: item.category || "General", location: item.location || "",
                                qty: item.qty || 0, unit_value: item.unit_value || 0, description: item.description || "", oldQty: item.qty || 0,
                                pos: Array.isArray(item.pos) ? item.pos.join(", ") : (item.pos || "30, 30"), isEditMode: true
                              });
                              setShowModal(true);
                            }}
                            className="p-2 text-blue-600 bg-blue-50 rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteItem(itemCode)} className="p-2 text-red-600 bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-gray-100">
          <div className="text-gray-500">Halaman {currentPage} dari {totalPages}</div>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-40"><ChevronLeft size={16} /></button>
            {[...Array(totalPages)].map((_, idx) => (
              <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`w-9 h-9 border rounded-lg text-xs ${currentPage === idx + 1 ? "bg-green-700 text-white" : "bg-white"}`}>{idx + 1}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border rounded-lg disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </>
  );
}