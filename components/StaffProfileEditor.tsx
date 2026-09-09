"use client";

import { useState } from "react";
import { FaSave, FaSpinner, FaEdit, FaTimes } from "react-icons/fa";
import AvatarUpload from "@/components/AvatarUpload";
import { useModal } from "@/components/ModalContext";

interface StaffProfileEditorProps {
  staff: any;
  name: string;
  color: string;
  role: string;
  dbServices?: any[];
}

export default function StaffProfileEditor({ staff, name: initialName, color, role: initialRole, dbServices = [] }: StaffProfileEditorProps) {
  const { showAlert } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(initialName);
  const [editEmail, setEditEmail] = useState(staff.email || "");
  const [editPhone, setEditPhone] = useState(staff.phone || "");
  const [editRole, setEditRole] = useState(initialRole);
  const [editServices, setEditServices] = useState<string[]>(
    Array.isArray(staff.services) 
      ? staff.services.filter((s: string) => dbServices.some(dbs => dbs.name === s))
      : []
  );

  const servicesByCategory = dbServices.reduce((acc: any, service: any) => {
    const cat = service.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: staff.id,
          name: editName,
          email: editEmail || null,
          phone: editPhone || null,
          role: editRole,
          services: editServices, // It's already an array now
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        showAlert("Error", "Failed to save: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const roleColors: Record<string, string> = {
    stylist: "#ff6b35",
    receptionist: "#2972ff",
    manager: "#00d284",
  };

  const currentColor = roleColors[editRole] || color;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      <div className="h-32 w-full" style={{ backgroundColor: `${currentColor}15` }}></div>
      <div className="px-8 pb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-16 relative">
          
          {/* Interactive Avatar Upload Component */}
          <AvatarUpload 
            staffId={staff.id} 
            initialAvatarUrl={staff.avatar_url} 
            name={editName} 
            color={currentColor} 
          />

          <div className="flex-1 text-center md:text-left mt-4 md:mt-16">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+974 5555 1234"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors bg-white"
                  >
                    <option value="stylist">Stylist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2 mt-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Services Offered</label>
                  <div className="flex-1 overflow-y-auto max-h-[300px] border border-gray-200 rounded-xl p-4 bg-white/50 space-y-4">
                    {Object.keys(servicesByCategory).length > 0 ? (
                      Object.entries(servicesByCategory).map(([category, svcs]: [string, any]) => (
                        <div key={category}>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {svcs.map((svc: any) => (
                              <label key={svc.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <input
                                  type="checkbox"
                                  checked={editServices.includes(svc.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditServices([...editServices, svc.name]);
                                    } else {
                                      setEditServices(editServices.filter((s: string) => s !== svc.name));
                                    }
                                  }}
                                  className="accent-[#ff6b35] w-4 h-4 rounded-sm"
                                />
                                <span className="text-sm text-slate-700 truncate" title={svc.name}>{svc.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-4">No services available.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-800">{editName}</h1>
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    ID: {staff.id}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide" style={{ backgroundColor: `${currentColor}15`, color: currentColor }}>
                    {editRole}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500 mt-3">
                  {editEmail && <div className="flex items-center gap-2">✉️ {editEmail}</div>}
                  {editPhone && <div className="flex items-center gap-2">📞 {editPhone}</div>}
                  <div className="flex items-center gap-1 text-yellow-400 font-semibold">⭐ 4.8 Rating</div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 md:mt-16 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#ff6b35] text-white font-semibold text-sm hover:bg-[#e85b24] transition-colors shadow-md shadow-[#ff6b35]/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin text-xs" /> : <FaSave className="text-xs" />}
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(initialName);
                    setEditEmail(staff.email || "");
                    setEditPhone(staff.phone || "");
                    setEditRole(initialRole);
                    setEditServices(Array.isArray(staff.services) ? staff.services : []);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm flex items-center gap-2"
                >
                  <FaTimes className="text-xs" /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm flex items-center gap-2"
              >
                <FaEdit className="text-xs" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Services Tags */}
        {staff.services && Array.isArray(staff.services) && staff.services.length > 0 && !isEditing && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assigned Services</h3>
            <div className="flex flex-wrap gap-2">
              {staff.services
                .filter((svc: string) => dbServices.some((dbs: any) => dbs.name === svc))
                .map((svc: string) => (
                <span key={svc} className="text-sm font-medium bg-[#f8fafc] border border-gray-200 text-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                  {svc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
