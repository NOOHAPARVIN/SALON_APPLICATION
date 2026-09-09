"use client";

import { useEffect, useState } from "react";
import { FaBox, FaPlus, FaExclamationTriangle, FaEdit, FaTrash, FaCheck, FaTimes, FaSpinner, FaSearch } from "react-icons/fa";
import { useModal } from "@/components/ModalContext";
import { useBranch } from "@/lib/BranchContext";

export default function InventoryPage() {
  const { showAlert, showConfirm } = useModal();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Inline edit state
  const [editingId, setEditingId] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    variant: "",
    category: "Haircare",
    stock: 0,
    unit: "bottles",
    threshold: 5,
    price: 0,
  });

  const { currentBranch } = useBranch();

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory?branch=${currentBranch}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.inventory || []);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentBranch]);

  const getStatus = (stock: number, threshold: number) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= threshold) return "Low Stock";
    return "In Stock";
  };

  const statusStyles: Record<string, { bg: string; text: string }> = {
    "In Stock":     { bg: "#d1fae5", text: "#059669" },
    "Low Stock":    { bg: "#fef3c7", text: "#d97706" },
    "Out of Stock": { bg: "#fee2e2", text: "#dc2626" },
  };

  // Stats calculation
  const inStock     = items.filter((i) => getStatus(i.stock, i.threshold) === "In Stock").length;
  const lowStock    = items.filter((i) => getStatus(i.stock, i.threshold) === "Low Stock").length;
  const outOfStock  = items.filter((i) => getStatus(i.stock, i.threshold) === "Out of Stock").length;

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      variant: item.variant || "",
      category: item.category || "",
      stock: item.stock,
      unit: item.unit || "pcs",
      threshold: item.threshold,
      price: item.price,
    });
  };

  const handleSaveEdit = async (id: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.map((item) => (item.id === id ? data.item : item)));
        setEditingId(null);
      } else {
        showAlert("Error", "Failed to update item: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = (id: any) => {
    showConfirm("Delete Item", "Remove this item permanently from inventory?", async () => {
      try {
        const res = await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setItems(items.filter((item) => item.id !== id));
        } else {
          showAlert("Error", "Failed to delete item: " + (data.error || "Unknown error"), "error");
        }
      } catch {
        showAlert("Connection Error", "Server connection error", "error");
      }
    }, "error");
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, branch: currentBranch }),
      });
      const data = await res.json();
      if (data.success) {
        setItems([...items, data.item]);
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          variant: "",
          category: "Haircare",
          stock: 0,
          unit: "bottles",
          threshold: 5,
          price: 0,
        });
      } else {
        showAlert("Error", "Failed to add item: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(q) ||
      (item.variant || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#2972ff]/10 p-3 rounded-xl">
              <FaBox className="text-[#2972ff] text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
              <p className="text-gray-400 text-sm">Track salon products and supplies</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#ff6b35] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e85b24] transition-colors shadow-md shadow-[#ff6b35]/20"
          >
            <FaPlus className="text-xs" /> Add Item
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "In Stock",     value: loading ? "…" : inStock,    color: "#00d284" },
            { label: "Low Stock",    value: loading ? "…" : lowStock,   color: "#ffc107" },
            { label: "Out of Stock", value: loading ? "…" : outOfStock, color: "#ff4757" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                {s.label === "Low Stock" || s.label === "Out of Stock"
                  ? <FaExclamationTriangle style={{ color: s.color }} />
                  : <FaBox style={{ color: s.color }} />}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">All Items</h2>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-600 focus:outline-none focus:border-[#ff6b35] transition-colors w-full"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center gap-3">
                <FaSpinner className="animate-spin text-2xl text-[#ff6b35]" />
                <p className="text-sm">Loading inventory items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center gap-2">
                <FaBox className="text-4xl text-gray-200" />
                <p className="font-semibold text-slate-600">No inventory items found</p>
                <p className="text-xs text-gray-400">Click &quot;Add Item&quot; to populate your inventory.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3 border-b border-gray-100">Item</th>
                    <th className="px-6 py-3 border-b border-gray-100">Variant</th>
                    <th className="px-6 py-3 border-b border-gray-100">Category</th>
                    <th className="px-6 py-3 border-b border-gray-100">Stock</th>
                    <th className="px-6 py-3 border-b border-gray-100">Unit Price</th>
                    <th className="px-6 py-3 border-b border-gray-100">Status</th>
                    <th className="px-6 py-3 border-b border-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.map((item) => {
                    const isEditing = editingId === item.id;
                    const status = getStatus(item.stock, item.threshold);
                    const s = statusStyles[status] || { bg: "#f1f5f9", text: "#64748b" };

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-slate-700 text-sm">
                        {/* Name Column */}
                        <td className="px-6 py-3.5 font-medium">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-[#ff6b35]"
                            />
                          ) : (
                            item.name
                          )}
                        </td>

                        {/* Variant Column */}
                        <td className="px-6 py-3.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.variant}
                              onChange={(e) => setEditForm({ ...editForm, variant: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-[#ff6b35]"
                              placeholder="e.g. Keratin"
                            />
                          ) : (
                            item.variant || <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Category Column */}
                        <td className="px-6 py-3.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-[#ff6b35]"
                            />
                          ) : (
                            item.category
                          )}
                        </td>

                        {/* Stock Column */}
                        <td className="px-6 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 w-32">
                              <input
                                type="number"
                                value={editForm.stock}
                                onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-16 focus:outline-none focus:border-[#ff6b35]"
                              />
                              <input
                                type="text"
                                value={editForm.unit}
                                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                className="border border-gray-300 rounded px-1.5 py-1 text-xs w-12 focus:outline-none focus:border-[#ff6b35]"
                                placeholder="unit"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{item.stock}</span>
                              <span className="text-xs text-gray-400">{item.unit || "pcs"}</span>
                              {item.stock <= item.threshold && item.stock > 0 && (
                                <FaExclamationTriangle className="text-yellow-400 text-xs" title="Low Stock Warning" />
                              )}
                            </div>
                          )}
                        </td>

                        {/* Unit Price Column */}
                        <td className="px-6 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">QR</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:border-[#ff6b35]"
                              />
                            </div>
                          ) : (
                            <span>QR {item.price}</span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors duration-200" style={{ backgroundColor: s.bg, color: s.text }}>
                            {status}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                disabled={saving}
                                className="bg-[#00d284] text-white p-1.5 rounded hover:bg-[#059669] transition-colors"
                                title="Save"
                              >
                                <FaCheck className="text-xs" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-200 text-slate-600 p-1.5 rounded hover:bg-gray-300 transition-colors"
                                title="Cancel"
                              >
                                <FaTimes className="text-xs" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="text-slate-400 hover:text-[#ff6b35] transition-colors"
                                title="Edit inline"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Remove"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-[#f8fafc] px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FaBox className="text-[#ff6b35]" /> Add New Inventory Item
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Shampoo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Variant
                  </label>
                  <input
                    type="text"
                    value={addForm.variant}
                    onChange={(e) => setAddForm({ ...addForm, variant: e.target.value })}
                    placeholder="e.g. Keratin"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    placeholder="e.g. Haircare"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={addForm.stock}
                    onChange={(e) => setAddForm({ ...addForm, stock: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    placeholder="bottles"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Threshold
                  </label>
                  <input
                    type="number"
                    value={addForm.threshold}
                    onChange={(e) => setAddForm({ ...addForm, threshold: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Unit Price (QR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={addForm.price}
                  onChange={(e) => setAddForm({ ...addForm, price: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#ff6b35] text-white text-sm font-semibold hover:bg-[#e85b24] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <FaSpinner className="animate-spin text-xs" />}
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
