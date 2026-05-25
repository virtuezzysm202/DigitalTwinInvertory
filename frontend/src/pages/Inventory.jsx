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
  const [inventoryData, setInventoryData] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10); 

  const [globalSummary, setGlobalSummary] = useState({
    lowStock: 0,
    totalValue: 0,
    totalZones: 0
  });

  const [formData, setFormData] = useState({
    id: null,
    item_code: "",
    name: "",
    category: "",
    location: "",
    qty: "",
    unit_value: "",
    description: "",
  });

  useEffect(() => {
    fetchInventory();
  }, [currentPage, search]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token"); 
      const response = await axios.get(
        `http://localhost:5000/api/inventory?page=${currentPage}&limit=${limit}&search=${search}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setInventoryData(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || 0);

      setGlobalSummary({
        lowStock: response.data.globalLowStock || 0,
        totalValue: response.data.globalTotalValue || 0,
        totalZones: response.data.globalTotalZones || 0
      });
    } catch (error) {
      console.log("Gagal memuat data inventory", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // FIX 1: Nilai kosong diubah ke 0 (Bukan dipaksa ke 100)
      const payload = { 
        ...formData, 
        qty: Number(formData.qty || 0),
        unit_value: Number(formData.unit_value || 0) 
      };

      if (formData.id) {
        await axios.put(`http://localhost:5000/api/inventory/${formData.id}`, payload, config);
      } else {
        await axios.post("http://localhost:5000/api/inventory", payload, config);
      }

      setShowModal(false);
      setFormData({ id: null, item_code: "", name: "", category: "", location: "", qty: "", unit_value: "", description: "" });
      setCurrentPage(1);
      fetchInventory();
    } catch (error) {
      console.log("Gagal menyimpan data barang:", error);
    }
  };

  const getStatusColor = (status) => {
    if (status === "In Stock") return "bg-green-50 text-green-700 border-green-200";
    if (status === "Low Stock") return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-gray-50/50 space-y-4 p-1">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage, search, and track all your items via Markdown-First System
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setFormData({ id: null, item_code: "", name: "", category: "", location: "", qty: "", unit_value: "", description: "" });
              setShowModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
          >
            + Add Item
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100">
            <Box size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Items</p>
            <span className="text-2xl font-bold text-gray-800">{totalItems}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock</p>
            <span className="text-2xl font-bold text-gray-800">{globalSummary.lowStock}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value</p>
            <span className="text-2xl font-bold text-gray-800">${globalSummary.totalValue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            <LayoutGrid size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zones</p>
            <span className="text-2xl font-bold text-gray-800">{globalSummary.totalZones}</span>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center shrink-0 gap-4 mt-2">
        <div className="w-full sm:flex-1 relative sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px] lg:h-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-600 min-w-[600px]">
            <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Stock (Qty)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventoryData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400 text-sm">
                    Tidak ada data barang ditemukan.
                  </td>
                </tr>
              ) : (
                inventoryData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-6 py-4">{item.category || "General"}</td>
                    <td className="px-6 py-4">{item.location}</td>
                    <td className="px-6 py-4 text-center">{item.qty ?? 0}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 border text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    {/* FIX 2: Tampilkan nilai asli dari objek item, fallback ke 0 */}
                    <td className="px-6 py-4">${item.unit_value || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setFormData({
                              id: item.id,
                              item_code: item.item_code || "",
                              name: item.name,
                              category: item.category || "",
                              location: item.location,
                              qty: item.qty || 0,
                              unit_value: item.unit_value || 0, // FIX 3: Sesuai data asli saat edit modal terbuka
                              description: item.description || "",
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

        {/* Pagination Controls */}
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
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-9 h-9 border rounded-lg font-medium text-xs transition-colors ${
                    currentPage === pageNumber
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {formData.id ? "Edit Inventory Item" : "Add Inventory Item"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input
                type="text"
                name="item_code"
                placeholder="Item Code"
                value={formData.item_code}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
                required
              />
              <input
                type="text"
                name="name"
                placeholder="Item Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
                required
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
              />
              <input
                type="text"
                name="location"
                placeholder="Location (Zone)"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
                required
              />
              <input
                type="number"
                name="qty"
                placeholder="Quantity"
                value={formData.qty}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
                required
              />
              <input
                type="number"
                name="unit_value"
                placeholder="Unit Value"
                value={formData.unit_value}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
              >
                {formData.id ? "Update Item" : "Save Item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}