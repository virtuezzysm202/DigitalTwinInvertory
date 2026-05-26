import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, ClipboardList, DollarSign, LayoutGrid, Layers, Package } from "lucide-react";

// Import komponen anak yang sudah dipecah
import InventoryTable from "../components/inventory/InventoryTable";
import ItemModal from "../components/inventory/ItemModal";
import ZoneModal from "../components/inventory/ZoneModal";

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("items");
  const [inventoryData, setInventoryData] = useState([]);
  const [zones, setZones] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);

  // Pagination & Summary State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);
  const [globalSummary, setGlobalSummary] = useState({ lowStock: 0, totalValue: 0, totalZones: 0 });
  const [loading, setLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    item_code: "", name: "", category: "", location: "", qty: "", unit_value: "", description: "", oldQty: 0, pos: "", isEditMode: false
  });
  const [zoneFormData, setZoneFormData] = useState({
    oldName: "", name: "", w: 200, h: 150, color: "#22c55e", x: 30, y: 30, isEditMode: false
  });

  useEffect(() => {
    fetchInventory();
    fetchZones();
  }, [currentPage, search]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/inventory?page=${currentPage}&limit=${limit}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setInventoryData(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
        setGlobalSummary({
          lowStock: response.data.globalLowStock || 0,
          totalValue: response.data.globalTotalValue || 0,
          totalZones: response.data.globalTotalZones || 1
        });
      }
    } catch (error) {
      console.error("Gagal memuat data inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/inventory/zones", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) setZones(response.data.data || []);
    } catch (error) {
      console.error("Gagal memuat daftar zona:", error);
    }
  };

  const handleDeleteItem = async (itemCode) => {
    if (!window.confirm(`Hapus item ${itemCode}?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${itemCode}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchInventory();
    } catch (error) {
      alert("Gagal menghapus item.");
    }
  };

  const handleDeleteZone = async (zoneName) => {
    if (!window.confirm(`Hapus zona [${zoneName}] beserta seluruh item di dalamnya?`)) return;
    try {
      await axios.delete("http://localhost:5000/api/inventory/zones", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        data: { zoneName }
      });
      fetchZones();
      fetchInventory();
    } catch (error) {
      alert("Gagal menghapus zona.");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50/50 space-y-6 p-4">
      {/* HEADER PANEL */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory & Workspace</h1>
          <p className="text-sm text-gray-500 mt-1">Gudang Utama Workspace</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => { setZoneFormData({ oldName: "", name: "", w: 200, h: 150, color: "#22c55e", x: 30, y: 30, isEditMode: false }); setShowZoneModal(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Zone</button>
          <button onClick={() => { setFormData({ item_code: "", name: "", category: "", location: "", qty: "", unit_value: "", description: "", oldQty: 0, pos: "", isEditMode: false }); setShowModal(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800">+ Add Item</button>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full"><Box size={24} /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Total Items</p><span className="text-2xl font-bold">{totalItems}</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><ClipboardList size={24} /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Low Stock</p><span className="text-2xl font-bold">{globalSummary.lowStock}</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full"><DollarSign size={24} /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Total Value</p><span className="text-2xl font-bold">Rp {globalSummary.totalValue.toLocaleString("id-ID")}</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><LayoutGrid size={24} /></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Active Zones</p><span className="text-2xl font-bold">{zones.length} Zones</span></div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-gray-200/60 p-1 rounded-xl w-fit shrink-0 border border-gray-200">
        <button onClick={() => setActiveTab("items")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold ${activeTab === "items" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}><Package size={16} /> Items ({totalItems})</button>
        <button onClick={() => setActiveTab("zones")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold ${activeTab === "zones" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}><Layers size={16} /> Zones ({zones.length})</button>
      </div>

      {/* RENDER SUB-COMPONENTS */}
      {activeTab === "items" ? (
        <InventoryTable 
          inventoryData={inventoryData} loading={loading} search={search} setSearch={setSearch} setCurrentPage={setCurrentPage} currentPage={currentPage} totalPages={totalPages} handleDeleteItem={handleDeleteItem} setFormData={setFormData} setShowModal={setShowModal}
        />
      ) : (
        /* ZONE PANEL */
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {zones.map((zone, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: zone.color }} />
                    <h3 className="font-bold text-sm text-gray-800">{zone.name}</h3>
                  </div>
                  <p className="text-xs font-mono text-gray-400 mt-1">{zone.w}px × {zone.h}px</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setZoneFormData({ oldName: zone.name, name: zone.name, w: Number(zone.w), h: Number(zone.h), color: zone.color, x: Number(zone.x), y: Number(zone.y), isEditMode: true }); setShowZoneModal(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-md text-xs">Edit</button>
                  <button onClick={() => handleDeleteZone(zone.name)} className="p-1.5 bg-red-50 text-red-600 rounded-md text-xs">Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showModal && <ItemModal formData={formData} setFormData={setFormData} zones={zones} onClose={() => setShowModal(false)} onRefresh={() => { fetchInventory(); fetchZones(); }} />}
      {showZoneModal && <ZoneModal zoneFormData={zoneFormData} setZoneFormData={setZoneFormData} onClose={() => setShowZoneModal(false)} onRefresh={() => { fetchZones(); fetchInventory(); }} />}
    </div>
  );
}