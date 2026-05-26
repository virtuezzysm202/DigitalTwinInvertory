import React from "react";
import axios from "axios";
import { X } from "lucide-react";

export default function ZoneModal({ zoneFormData, setZoneFormData, onClose, onRefresh }) {
  const handleSaveZone = async (e) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Pastikan data koordinat lama dan warna lama tetap ikut dikirim, jika kosong baru gunakan default
    const payload = {
      oldName: zoneFormData.oldName || zoneFormData.name,
      name: zoneFormData.name,
      w: zoneFormData.w === "" ? 200 : Number(zoneFormData.w),
      h: zoneFormData.h === "" ? 150 : Number(zoneFormData.h),
      color: zoneFormData.color || '#22c55e', // Ambil warna bawaan dari state agar tidak hilang
      x: zoneFormData.x !== undefined && zoneFormData.x !== null ? Number(zoneFormData.x) : 30, // Ambil koordinat X asli dari state
      y: zoneFormData.y !== undefined && zoneFormData.y !== null ? Number(zoneFormData.y) : 30  // Ambil koordinat Y asli dari state
    };

    if (zoneFormData.isEditMode) {
      await axios.put("http://localhost:5000/api/inventory/zones", payload, config);
    } else {
      await axios.post("http://localhost:5000/api/inventory/zones", payload, config);
    }

    alert("Zona berhasil disimpan!");
    onRefresh();
    onClose();
  } catch (error) {
    alert(error.response?.data?.message || "Gagal memproses zona.");
  }
};

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">{zoneFormData.isEditMode ? "Modifikasi Zona Workspace" : "Buat Zona Baru"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={22} /></button>
        </div>
        
        <form onSubmit={handleSaveZone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Zona / Area Layout *</label>
            <input type="text" placeholder="Contoh: Rak Inbound A1" value={zoneFormData.name} onChange={(e) => setZoneFormData({...zoneFormData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-blue-600 outline-none" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Lebar Canvas (Width px)</label>
              <input type="number" value={zoneFormData.w} onChange={(e) => setZoneFormData({...zoneFormData, w: e.target.value === "" ? "" : Number(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-blue-600 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tinggi Canvas (Height px)</label>
              <input type="number" value={zoneFormData.h} onChange={(e) => setZoneFormData({...zoneFormData, h: e.target.value === "" ? "" : Number(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-blue-600 outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm">
            {zoneFormData.isEditMode ? "Simpan Perubahan Zona" : "Simpan Zona Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}