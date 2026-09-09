"use client";

import { useEffect, useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaSpa, FaCut, FaSpinner, FaCheck, FaTimes } from "react-icons/fa";
import { useModal } from "@/components/ModalContext";
import { useBranch } from "@/lib/BranchContext";

export default function ServicesPage() {
  const { showAlert, showConfirm } = useModal();
  const { currentBranch } = useBranch();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    category: "Hair Care",
    customCategory: "",
    price: 0,
    duration_minutes: 30,
    is_active: true,
  });

  const [saving, setSaving] = useState(false);



  useEffect(() => {
    if (!currentBranch) return;
    const controller = new AbortController();

    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/services?branch=${currentBranch}`, { 
          signal: controller.signal,
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.success && !controller.signal.aborted) {
          setServices(data.services || []);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Error fetching services:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchServices();

    return () => controller.abort();
  }, [currentBranch]);

  const handleStartEdit = (service: any) => {
    setEditingId(service.id);
    setEditForm({
      name: service.name,
      name_ar: service.name_ar || "",
      description: service.description || "",
      description_ar: service.description_ar || "",
      category: service.category || "",
      price: service.price,
      duration_minutes: service.duration_minutes,
      is_active: service.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (id: any) => {
    setSaving(true);
    const finalCategory = editForm.category === '___CUSTOM___' ? (editForm.customCategory || "Uncategorized") : editForm.category;
    try {
      const res = await fetch(`/api/services?id=${id}&branch=${currentBranch}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, category: finalCategory }),
      });
      const data = await res.json();
      if (data.success) {
        setServices(services.map((service) => (service.id === id ? data.service : service)));
        setEditingId(null);
        setIsEditModalOpen(false);
      } else {
        showAlert("Error", "Failed to update service: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = (id: any) => {
    showConfirm("Delete Service", "Remove this service permanently?", async () => {
      try {
        const res = await fetch(`/api/services?id=${id}&branch=${currentBranch}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setServices(services.filter((service) => service.id !== id));
        } else {
          showAlert("Error", "Failed to delete service: " + (data.error || "Unknown error"), "error");
        }
      } catch {
        showAlert("Connection Error", "Server connection error", "error");
      }
    }, "error");
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;

    setSaving(true);
    const finalCategory = addForm.category === '___CUSTOM___' ? (addForm.customCategory || "Uncategorized") : addForm.category;
    try {
      const res = await fetch(`/api/services?branch=${currentBranch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, category: finalCategory, branch: currentBranch }),
      });
      const data = await res.json();
      if (data.success) {
        setServices([...services, data.service]);
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          name_ar: "",
          description: "",
          description_ar: "",
          category: "Hair Care",
          customCategory: "",
          price: 0,
          duration_minutes: 30,
          is_active: true,
        } as any);
      } else {
        showAlert("Error", "Failed to add service: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const q = searchQuery.toLowerCase();
    return (
      (service.name || "").toLowerCase().includes(q) ||
      (service.category || "").toLowerCase().includes(q)
    );
  });

  // Calculate distinct categories
  const categoriesCount = new Set(services.map(s => s.category)).size;

  return (
    <div className="p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#8b5cf6]/10 p-3 rounded-xl">
              <FaCut className="text-[#8b5cf6] text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Services & Pricing</h1>
              <p className="text-gray-400 text-sm">Manage salon services, pricing, and duration</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#ff6b35] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e85b24] transition-colors shadow-md shadow-[#ff6b35]/20"
          >
            <FaPlus className="text-xs" /> Add Service
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Services", value: loading ? "…" : services.length, color: "#8b5cf6" },
            { label: "Active Categories", value: loading ? "…" : categoriesCount, color: "#2972ff" },
            { label: "Active Offerings", value: loading ? "…" : services.filter(s => s.is_active).length, color: "#00d284" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <FaCut style={{ color: s.color }} />
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
            <h2 className="font-bold text-slate-800">All Services</h2>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search services..."
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
                <p className="text-sm">Loading services...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center gap-2">
                <FaCut className="text-4xl text-gray-200" />
                <p className="font-semibold text-slate-600">No services found</p>
                <p className="text-xs text-gray-400">Click &quot;Add Service&quot; to define your offerings.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3 border-b border-gray-100">Service Name</th>
                    <th className="px-6 py-3 border-b border-gray-100">Category</th>
                    <th className="px-6 py-3 border-b border-gray-100">Price (QR)</th>
                    <th className="px-6 py-3 border-b border-gray-100">Duration (Mins)</th>
                    <th className="px-6 py-3 border-b border-gray-100">Status</th>
                    <th className="px-6 py-3 border-b border-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredServices.map((service) => {
                    return (
                      <tr key={service.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Service Name */}
                        <td className="px-6 py-3.5">
                          <div>
                            <span className="font-semibold text-slate-700 text-sm">{service.name}</span>
                            {service.name_ar && (
                              <span className="block text-xs text-gray-400 mt-0.5" dir="rtl">{service.name_ar}</span>
                            )}
                          </div>
                        </td>
                        {/* Category */}
                        <td className="px-6 py-3.5">
                          <span className="inline-block bg-[#8b5cf6]/10 text-[#8b5cf6] text-xs font-medium px-2.5 py-1 rounded-lg">
                            {service.category || "Uncategorized"}
                          </span>
                        </td>
                        {/* Price */}
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-700">
                          QR {service.price}
                        </td>
                        {/* Duration */}
                        <td className="px-6 py-3.5 text-sm text-slate-600">
                          {service.duration_minutes} mins
                        </td>
                        {/* Status */}
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${service.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                            {service.is_active ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
                            {service.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {/* Actions Column */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleStartEdit(service)}
                              className="text-slate-400 hover:text-[#ff6b35] transition-colors"
                              title="Edit Service"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                              title="Remove Service"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
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

      {/* Unified Add/Edit Service Modal */}
      {(isAddModalOpen || isEditModalOpen) && (() => {
        const isEdit = isEditModalOpen;
        const formState = isEdit ? editForm : addForm;
        const setFormState = isEdit ? setEditForm : setAddForm;
        const onSubmit = isEdit ? (e: any) => { e.preventDefault(); handleSaveEdit(editingId); } : handleCreateService;
        const onClose = () => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingId(null);
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all">
              <div className="bg-[#f8fafc] px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xl flex items-center gap-3">
                  <FaCut className="text-[#ff6b35]" /> {isEdit ? "Edit Service" : "Add New Service"}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={onSubmit} className="p-8 space-y-6">
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Balayage"
                      className="w-full border border-gray-300 rounded-xl px-5 py-3 text-base text-slate-800 focus:outline-none focus:border-[#ff6b35] focus:ring-4 focus:ring-[#ff6b35]/10 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                    Category
                  </label>
                  {formState.category === '___CUSTOM___' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={formState.customCategory || ""}
                        onChange={(e) => setFormState({ ...formState, customCategory: e.target.value })}
                        placeholder="Type new category name..."
                        className="w-full border border-gray-300 rounded-xl px-5 py-3 text-base text-slate-800 focus:outline-none focus:border-[#ff6b35] focus:ring-4 focus:ring-[#ff6b35]/10 transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, category: "Massage", customCategory: "" })}
                        className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={Array.from(new Set(["Massage", "Hair Care", "Nails & Spa", "Waxing", "Facial & Skincare", ...services.map(s => s.category).filter(Boolean)])).includes(formState.category) ? formState.category : '___CUSTOM___'}
                      onChange={(e) => {
                        if (e.target.value === '___CUSTOM___') {
                          setFormState({ ...formState, category: '___CUSTOM___', customCategory: "" });
                        } else {
                          setFormState({ ...formState, category: e.target.value, customCategory: "" });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-xl px-5 py-3 text-base text-slate-800 focus:outline-none focus:border-[#ff6b35] focus:ring-4 focus:ring-[#ff6b35]/10 transition-all shadow-sm bg-white"
                    >
                      <option value="" disabled>Select a category</option>
                      {Array.from(new Set(["Massage", "Hair Care", "Nails & Spa", "Waxing", "Facial & Skincare", ...services.map(s => s.category).filter(Boolean)])).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="___CUSTOM___" className="font-bold text-[#ff6b35]">+ Add New Category...</option>
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Price (QR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formState.price}
                      onChange={(e) => setFormState({ ...formState, price: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-5 py-3 text-base text-slate-800 focus:outline-none focus:border-[#ff6b35] focus:ring-4 focus:ring-[#ff6b35]/10 transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      value={formState.duration_minutes}
                      onChange={(e) => setFormState({ ...formState, duration_minutes: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-5 py-3 text-base text-slate-800 focus:outline-none focus:border-[#ff6b35] focus:ring-4 focus:ring-[#ff6b35]/10 transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                      Status
                    </label>
                    <select
                      value={formState.is_active ? "true" : "false"}
                      onChange={(e) => setFormState({ ...formState, is_active: e.target.value === "true" })}
                      className="w-full border border-gray-300 rounded-xl px-5 py-3 text-base text-slate-800 focus:outline-none focus:border-[#ff6b35] focus:ring-4 focus:ring-[#ff6b35]/10 transition-all shadow-sm bg-white"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-base font-semibold text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-[#ff6b35] text-white text-base font-bold hover:bg-[#e85b24] hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <FaSpinner className="animate-spin text-sm" />}
                    {isEdit ? "Save Changes" : "Add Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
