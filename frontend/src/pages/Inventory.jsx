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
  ArrowRightLeft,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Inventory() {
  // =========================
  // STATE
  // =========================

  const [inventoryData, setInventoryData] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [search, setSearch] = useState("");

  // MODAL
  const [showModal, setShowModal] = useState(false);

  // FORM
  const [formData, setFormData] = useState({
    item_code: "",
    name: "",
    category: "",
    location: "",
    stock: "",
    unit_value: "",
    description: "",
  });

  // =========================
  // FETCH INVENTORY
  // =========================

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/inventory");

      setInventoryData(response.data);

      if (response.data.length > 0) {
        setActiveItem(response.data[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // HANDLE FORM
  // =========================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    try {
      // UPDATE
      if (formData.id) {
        await axios.put(
          `http://localhost:5000/api/inventory/${formData.id}`,
          formData
        );
      }

      // CREATE
      else {
        await axios.post("http://localhost:5000/api/inventory", formData);
      }

      setShowModal(false);

      setFormData({
        item_code: "",
        name: "",
        category: "",
        location: "",
        stock: "",
        unit_value: "",
        description: "",
      });

      fetchInventory();
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // STATUS COLOR
  // =========================

  const getStatusColor = (status) => {
    if (status === "In Stock") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "Low Stock") {
      return "bg-orange-50 text-orange-700 border-orange-200";
    }

    return "bg-red-50 text-red-700 border-red-200";
  };

  // =========================
  // SEARCH FILTER
  // =========================

  const filteredInventory = inventoryData.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  // =========================
  // STATS
  // =========================

  const totalItems = inventoryData.length;

  const lowStockItems = inventoryData.filter(
    (item) => item.status === "Low Stock"
  ).length;

  const totalValue = inventoryData.reduce(
    (acc, item) => acc + Number(item.unit_value || 0),
    0
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50 space-y-4">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage, search, and track all your items
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
          >
            + Add Item
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100">
            <Box size={24} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Items
            </p>

            <span className="text-2xl font-bold text-gray-800">
              {totalItems}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
            <ClipboardList size={24} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Low Stock
            </p>

            <span className="text-2xl font-bold text-gray-800">
              {lowStockItems}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100">
            <DollarSign size={24} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Value
            </p>

            <span className="text-2xl font-bold text-gray-800">
              ${totalValue}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            <LayoutGrid size={24} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Zones
            </p>

            <span className="text-2xl font-bold text-gray-800">3</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="flex flex-col lg:flex-row justify-between lg:items-center shrink-0 gap-4 mt-2">
        <div className="w-full lg:flex-1 relative lg:max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {item.name}
                  </td>

                  <td className="px-6 py-4">{item.category}</td>

                  <td className="px-6 py-4">{item.location}</td>

                  <td className="px-6 py-4 text-center">{item.stock}</td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 border text-xs font-medium rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">${item.unit_value}</td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => {
                          setFormData({
                            id: item.id,
                            item_code: item.item_code,
                            name: item.name,
                            category: item.category,
                            location: item.location,
                            stock: item.stock,
                            unit_value: item.unit_value,
                            description: item.description,
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[95%] sm:w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {" "}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
              {formData.id ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2"
                required
              />

              <input
                type="text"
                name="name"
                placeholder="Item Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2"
                required
              />

              <input
                type="text"
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2"
                required
              />

              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2"
                required
              />

              <input
                type="number"
                name="stock"
                placeholder="Stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2"
                required
              />

              <input
                type="number"
                name="unit_value"
                placeholder="Unit Value"
                value={formData.unit_value}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2"
                required
              />

              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-200 rounded-lg px-4 py-2"
              />

              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-semibold"
              >
                {formData.id ? 'Update Item' : 'Save Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
