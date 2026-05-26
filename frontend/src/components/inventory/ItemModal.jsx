import React from "react";
import axios from "axios";
import { X } from "lucide-react";

export default function ItemModal({ formData, setFormData, zones, onClose, onRefresh }) {
  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = { 
        ...formData, 
        qty: Number(formData.qty || 0),
        unit_value: Number(formData.unit_value || 0),
        pos: formData.isEditMode ? formData.pos : ""
      };

      if (formData.isEditMode) {
        await axios.put(`http://localhost:5000/api/inventory/${formData.item_code}`, payload, config);
      } else {
        await axios.post("http://localhost:5000/api/inventory", payload, config);
      }

      alert("Data barang berhasil disimpan!");
      onRefresh();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memproses item.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">{formData.isEditMode ? "Edit Item Markdown" : "Tambah Item Baru"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={22} /></button>
        </div>
        
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Item Code / SKU *</label>
            <input type="text" value={formData.item_code} onChange={(e) => setFormData({...formData, item_code: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm font-mono focus:border-green-600 outline-none" required disabled={formData.isEditMode} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-green-600 outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
            <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-green-600 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Location Zone *</label>
            <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-green-600 outline-none" required>
              <option value="">-- Pilih Zona --</option>
              {zones.map((zone, index) => (
                <option key={index} value={zone.name}>{zone.name} {zone.w && zone.h ? `(${zone.w}x${zone.h})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
              <input type="number" value={formData.qty} onChange={(e) => setFormData({...formData, qty: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-green-600 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Value (Rp)</label>
              <input type="number" value={formData.unit_value} onChange={(e) => setFormData({...formData, unit_value: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-green-600 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="2" className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-green-600 outline-none resize-none" />
          </div>
          <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg font-semibold text-sm">
            {formData.isEditMode ? "Simpan Perubahan" : "Simpan Item Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}