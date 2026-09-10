"use client";

import { useEffect, useState } from "react";
import { 
  FaUserTie, 
  FaPlus, 
  FaPhone, 
  FaEnvelope, 
  FaStar, 
  FaTimes, 
  FaSpinner, 
  FaTrash, 
  FaCalendarMinus,
  FaClock,
  FaCalendarCheck,
  FaSun,
  FaMoon
} from "react-icons/fa";
import Link from "next/link";
import { useModal } from "@/components/ModalContext";
import { useBranch } from "@/lib/BranchContext";

export default function StaffPage() {
  const { showAlert, showConfirm } = useModal();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "stylist",
    services: [] as string[],
    is_active: true,
    working_start: "09:00",
    working_end: "21:00",
    color: "#22c55e",
    working_days: [0, 1, 2, 3, 4, 5, 6] as number[],
  });

  const [dutyForm, setDutyForm] = useState({
    staff_id: "",
    staff_name: "",
    working_start: "09:00",
    working_end: "21:00",
    color: "#22c55e", // default light green (#22c55e) or yellow (#eab308)
    working_days: [0, 1, 2, 3, 4, 5, 6] as number[],
  });

  const [leaveForm, setLeaveForm] = useState({
    staff_id: "",
    leave_date: new Date().toISOString().split("T")[0],
    leave_type: "full_day",
    start_time: "00:00",
    end_time: "23:59",
    notes: "Off Day",
  });

  const [dbServices, setDbServices] = useState<any[]>([]);
  const { currentBranch } = useBranch();

  const daysList = [
    { label: "Sun", val: 0 },
    { label: "Mon", val: 1 },
    { label: "Tue", val: 2 },
    { label: "Wed", val: 3 },
    { label: "Thu", val: 4 },
    { label: "Fri", val: 5 },
    { label: "Sat", val: 6 },
  ];

  useEffect(() => {
    // Check if addStaff parameter is present in the URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("addStaff") === "true") {
        setIsAddModalOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete("addStaff");
        window.history.replaceState({}, "", url.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentBranch) return;
    const controller = new AbortController();

    const fetchStaff = () => {
      setLoading(true);
      fetch(`/api/staff?branch=${currentBranch}`, { 
        signal: controller.signal,
        cache: 'no-store'
      })
        .then((r) => r.json())
        .then((d) => {
          if (!controller.signal.aborted) {
            setStaff(d.staff || []);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError' && !controller.signal.aborted) {
            setLoading(false);
          }
        });
    };

    const fetchDbServices = () => {
      fetch(`/api/services?branch=${currentBranch}`, { 
        signal: controller.signal,
        cache: 'no-store'
      })
        .then((r) => r.json())
        .then((d) => {
          if (!controller.signal.aborted) {
            setDbServices(d.services || []);
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') console.error("Error fetching services:", err);
        });
    };

    fetchStaff();
    fetchDbServices();

    return () => controller.abort();
  }, [currentBranch]);

  const handleOpenDutyModal = (member: any) => {
    const name = member.name
      || (member.first_name ? `${member.first_name || ""} ${member.last_name || ""}`.trim() : null)
      || member.email?.split("@")[0]
      || "Staff Member";

    setDutyForm({
      staff_id: String(member.id),
      staff_name: name,
      working_start: member.working_start || "09:00",
      working_end: member.working_end || "21:00",
      color: (member.color === "#eab308" || member.color === "#facc15" || member.color === "yellow") ? "#eab308" : "#22c55e",
      working_days: Array.isArray(member.working_days) && member.working_days.length > 0 ? member.working_days : [0, 1, 2, 3, 4, 5, 6],
    });
    setIsDutyModalOpen(true);
  };

  const handleSaveDutySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyForm.staff_id) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/staff/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(dutyForm.staff_id),
          working_start: dutyForm.working_start,
          working_end: dutyForm.working_end,
          color: dutyForm.color,
          working_days: dutyForm.working_days,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStaff((prev) =>
          prev.map((s) =>
            String(s.id) === String(dutyForm.staff_id)
              ? { 
                  ...s, 
                  working_start: dutyForm.working_start, 
                  working_end: dutyForm.working_end, 
                  color: dutyForm.color, 
                  working_days: dutyForm.working_days 
                }
              : s
          )
        );
        setIsDutyModalOpen(false);
        showAlert("Success", `Duty hours for ${dutyForm.staff_name} updated successfully!`, "success");
      } else {
        showAlert("Error", "Failed to update duty schedule: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/staff?branch=${currentBranch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, branch: currentBranch }),
      });
      const data = await res.json();
      if (data.success) {
        setStaff((prev) => [...prev, data.staff]);
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          email: "",
          phone: "",
          role: "stylist",
          services: [] as string[],
          is_active: true,
          working_start: "09:00",
          working_end: "21:00",
          color: "#22c55e",
          working_days: [0, 1, 2, 3, 4, 5, 6],
        });
        showAlert("Success", "Staff member created successfully!", "success");
      } else {
        showAlert("Error", "Failed to create staff member: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = (id: number, name: string) => {
    showConfirm("Delete Staff", `Are you sure you want to delete ${name}?`, async () => {
      try {
        const res = await fetch(`/api/staff?id=${id}&branch=${currentBranch}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          setStaff((prev) => prev.filter((s) => s.id !== id));
        } else {
          showAlert("Error", "Failed to delete staff member: " + (data.error || "Unknown error"), "error");
        }
      } catch {
        showAlert("Connection Error", "Server connection error", "error");
      }
    }, "error");
  };

  const submitLeave = async (ignoreAvailability = false) => {
    if (!leaveForm.staff_id) {
      showAlert("Select Staff", "Please select a staff member.", "warning");
      return;
    }

    setSaving(true);
    try {
      const selectedStaff = staff.find((s) => String(s.id) === String(leaveForm.staff_id));
      const staffName = selectedStaff ? (selectedStaff.name || `${selectedStaff.first_name || ""} ${selectedStaff.last_name || ""}`.trim() || selectedStaff.email) : "Staff";
      
      const payload = {
        customer: {
          name: `Leave: ${staffName}`,
          phone: "00000000",
        },
        date: leaveForm.leave_date,
        time: leaveForm.start_time || "00:00",
        services: [
          {
            category: "Leave",
            service: "Staff Leave",
            staff: staffName,
            staff_id: Number(leaveForm.staff_id),
            price: 0,
            duration_minutes: 1440,
            start_time: leaveForm.start_time || "00:00",
            end_time: leaveForm.end_time || "23:59",
          },
        ],
        payment: "cash",
        payment_status: "paid",
        notes: leaveForm.notes || "Off Day",
        status: "confirmed",
        booking_source: "busy",
        branch: currentBranch,
        ignore_availability: ignoreAvailability,
      };

      const res = await fetch(`/api/bookings?branch=${currentBranch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success || res.ok) {
        showAlert("Success", "Staff leave recorded successfully!", "success");
        setIsLeaveModalOpen(false);
        setLeaveForm({
          staff_id: "",
          leave_date: new Date().toISOString().split("T")[0],
          leave_type: "full_day",
          start_time: "00:00",
          end_time: "23:59",
          notes: "Off Day",
        });
      } else if (data.error && (data.error.includes("not available") || data.error.includes("conflict"))) {
        showConfirm(
          "Scheduled Appointments Conflict",
          `${staffName} has scheduled appointments on this date/time.\n\nDo you want to proceed and mark leave anyway?`,
          () => {
            submitLeave(true);
          },
          "warning"
        );
      } else {
        showAlert("Error", "Failed to record leave: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitLeave(false);
  };

  const roleColors: Record<string, string> = {
    stylist: "#ff6b35",
    receptionist: "#2972ff",
    manager: "#00d284",
  };

  const servicesByCategory = dbServices.reduce((acc: any, service: any) => {
    const cat = service.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  return (
    <div className="p-6 xl:p-8 bg-[#f4f7f6] min-h-full font-['Inter']">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#ff6b35]/10 p-3 rounded-xl">
              <FaUserTie className="text-[#ff6b35] text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
              <p className="text-gray-400 text-sm">Manage staff shifts, duty time slots & calendar colors</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors shadow-md shadow-red-500/20 cursor-pointer"
            >
              <FaCalendarMinus className="text-xs" /> Mark Staff Leave
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-[#ff6b35] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e85b24] transition-colors shadow-md shadow-[#ff6b35]/20 cursor-pointer"
            >
              <FaPlus className="text-xs" /> Add Staff
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Staff", value: loading ? "…" : staff.length, color: "#ff6b35" },
            { label: "Active Today", value: loading ? "…" : staff.filter((s) => s.is_active !== false).length, color: "#00d284" },
            { label: "Stylists", value: loading ? "…" : staff.filter((s) => s.role === "stylist" || !s.role).length, color: "#2972ff" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <FaUserTie style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Staff Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <FaSpinner className="animate-spin text-2xl text-[#ff6b35]" />
            <p className="text-sm">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <FaUserTie className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No staff members found</p>
            <p className="text-gray-300 text-sm mt-1">Add staff members to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {staff.map((member: any) => {
              const role = member.role || "stylist";
              const color = roleColors[role] || "#ff6b35";
              const name = member.name
                || (member.first_name ? `${member.first_name || ""} ${member.last_name || ""}`.trim() : null)
                || member.email?.split("@")[0]
                || "Staff Member";

              const isYellowColor = member.color === "#eab308" || member.color === "#facc15" || member.color === "yellow";
              const dutyStart = member.working_start || "09:00";
              const dutyEnd = member.working_end || "21:00";

              return (
                <div key={member.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-cover bg-center shadow-inner"
                          style={{
                            backgroundColor: member.avatar_url ? "transparent" : color,
                            backgroundImage: member.avatar_url ? `url(${member.avatar_url})` : "none",
                          }}
                        >
                          {!member.avatar_url && name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-sm">{name}</p>
                            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shadow-xs">
                              ID: {member.id}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block" style={{ backgroundColor: `${color}15`, color }}>
                            {role}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-yellow-400 text-xs">
                          <FaStar />
                          <span className="text-slate-600 font-semibold">4.8</span>
                        </div>
                        <button
                          onClick={() => handleDeleteStaff(member.id, name)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="Delete Staff"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Duty Time Slot Card Highlight */}
                    <div 
                      onClick={() => handleOpenDutyModal(member)}
                      className={`mb-3.5 p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:shadow-sm ${
                        isYellowColor 
                          ? "bg-[#fefce8] border-[#fef08a] hover:border-[#fde047]" 
                          : "bg-[#ecfdf5] border-[#a7f3d0] hover:border-[#6ee7b7]"
                      }`}
                      title="Click to assign or change duty time"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isYellowColor ? "bg-amber-500 text-white" : "bg-[#059669] text-white"
                        }`}>
                          <FaClock className="text-sm" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">DUTY TIME</span>
                            <span className={`w-2 h-2 rounded-full ${isYellowColor ? "bg-amber-500" : "bg-[#059669]"}`} />
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                            {dutyStart.split(':').length === 2 ? `${dutyStart}:00` : dutyStart} – {dutyEnd.split(':').length === 2 ? `${dutyEnd}:00` : dutyEnd}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                          isYellowColor 
                            ? "bg-[#fef08a] text-amber-900 border-amber-300" 
                            : "bg-[#a7f3d0] text-emerald-950 border-emerald-300"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isYellowColor ? "bg-amber-600" : "bg-[#059669]"}`} />
                          {isYellowColor ? "Yellow Shift" : "Light Green"}
                        </span>
                      </div>
                    </div>

                    {member.email && (
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1.5">
                        <FaEnvelope className="text-[10px]" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                        <FaPhone className="text-[10px]" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.services && Array.isArray(member.services) && member.services.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {member.services.map((svc: string) => (
                          <span key={svc} className="text-[10px] font-medium bg-slate-100/80 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100">
                    <Link
                      href={`/dashboard/owner/staff/${member.id}`}
                      className="flex-1 text-center text-xs font-bold text-[#ff6b35] bg-[#ff6b35]/10 hover:bg-[#ff6b35]/20 py-2.5 rounded-xl transition-colors"
                    >
                      View Profile
                    </Link>
                    <button 
                      onClick={() => handleOpenDutyModal(member)}
                      className="flex-1 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FaClock className="text-xs text-slate-600" />
                      Assign Duty Time
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Duty Time Slot Modal */}
      {isDutyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100">
            <div className="bg-[#f8fafc] px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FaClock className="text-[#ff6b35]" /> Assign Duty Time for {dutyForm.staff_name}
              </h3>
              <button
                onClick={() => setIsDutyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveDutySubmit} className="p-6 space-y-4">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Shift Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDutyForm({ ...dutyForm, working_start: "09:00", working_end: "17:00", color: "#22c55e" })}
                    className={`p-2 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                      dutyForm.working_start === "09:00" && dutyForm.working_end === "17:00"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <FaSun className="mx-auto mb-1 text-xs" />
                    Morning (09-17)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDutyForm({ ...dutyForm, working_start: "09:00", working_end: "21:00", color: "#22c55e" })}
                    className={`p-2 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                      dutyForm.working_start === "09:00" && dutyForm.working_end === "21:00"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <FaCalendarCheck className="mx-auto mb-1 text-xs" />
                    Full Day (09-21)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDutyForm({ ...dutyForm, working_start: "13:00", working_end: "22:00", color: "#eab308" })}
                    className={`p-2 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                      dutyForm.working_start === "13:00" && dutyForm.working_end === "22:00"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <FaMoon className="mx-auto mb-1 text-xs" />
                    Evening (13-22)
                  </button>
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Duty Start Time *
                  </label>
                  <select
                    value={dutyForm.working_start}
                    onChange={(e) => setDutyForm({ ...dutyForm, working_start: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-[#ff6b35]"
                    required
                  >
                    {Array.from({ length: 32 }, (_, i) => {
                      const h = Math.floor(i / 2) + 7;
                      const m = (i % 2) * 30;
                      if (h > 23) return null;
                      const val = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Duty End Time *
                  </label>
                  <select
                    value={dutyForm.working_end}
                    onChange={(e) => setDutyForm({ ...dutyForm, working_end: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-[#ff6b35]"
                    required
                  >
                    {Array.from({ length: 32 }, (_, i) => {
                      const h = Math.floor(i / 2) + 8;
                      const m = (i % 2) * 30;
                      if (h > 23) return null;
                      const val = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                      return <option key={val} value={val}>{val}</option>;
                    })}
                    <option value="23:59">23:59 (Midnight)</option>
                  </select>
                </div>
              </div>

              {/* Calendar Highlight Color */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Calendar Slot Highlight Color *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    onClick={() => setDutyForm({ ...dutyForm, color: "#22c55e" })}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      dutyForm.color === "#22c55e"
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-white border-gray-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dutyColor"
                      checked={dutyForm.color === "#22c55e"}
                      onChange={() => setDutyForm({ ...dutyForm, color: "#22c55e" })}
                      className="accent-emerald-600"
                    />
                    <div>
                      <span className="block text-xs font-bold text-emerald-900">🟢 Light Green</span>
                      <span className="text-[10px] text-emerald-600">Standard / Regular Shift</span>
                    </div>
                  </label>

                  <label 
                    onClick={() => setDutyForm({ ...dutyForm, color: "#eab308" })}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      dutyForm.color === "#eab308"
                        ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
                        : "bg-white border-gray-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dutyColor"
                      checked={dutyForm.color === "#eab308"}
                      onChange={() => setDutyForm({ ...dutyForm, color: "#eab308" })}
                      className="accent-amber-600"
                    />
                    <div>
                      <span className="block text-xs font-bold text-amber-900">🟡 Light Yellow</span>
                      <span className="text-[10px] text-amber-600">Special / Split Shift</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Working Days
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {daysList.map((day) => {
                    const isSelected = dutyForm.working_days.includes(day.val);
                    return (
                      <button
                        key={day.val}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (dutyForm.working_days.length > 1) {
                              setDutyForm({
                                ...dutyForm,
                                working_days: dutyForm.working_days.filter((d) => d !== day.val),
                              });
                            }
                          } else {
                            setDutyForm({
                              ...dutyForm,
                              working_days: [...dutyForm.working_days, day.val].sort(),
                            });
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#ff6b35] text-white shadow-xs"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDutyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#ff6b35] text-white text-sm font-semibold hover:bg-[#e85b24] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[#ff6b35]/20 cursor-pointer"
                >
                  {saving && <FaSpinner className="animate-spin text-xs" />}
                  Save Duty Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-[#f8fafc] px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FaUserTie className="text-[#ff6b35]" /> Add New Staff Member
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="sarah@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+974 5555 1234"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Role
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors bg-white"
                  >
                    <option value="stylist">Stylist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Status
                  </label>
                  <select
                    value={addForm.is_active ? "true" : "false"}
                    onChange={(e) => setAddForm({ ...addForm, is_active: e.target.value === "true" })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors bg-white"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Duty Hours & Calendar Color in Add Staff */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Duty Start Time
                  </label>
                  <select
                    value={addForm.working_start}
                    onChange={(e) => setAddForm({ ...addForm, working_start: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#ff6b35]"
                  >
                    {Array.from({ length: 32 }, (_, i) => {
                      const h = Math.floor(i / 2) + 7;
                      const m = (i % 2) * 30;
                      if (h > 23) return null;
                      const val = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Duty End Time
                  </label>
                  <select
                    value={addForm.working_end}
                    onChange={(e) => setAddForm({ ...addForm, working_end: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#ff6b35]"
                  >
                    {Array.from({ length: 32 }, (_, i) => {
                      const h = Math.floor(i / 2) + 8;
                      const m = (i % 2) * 30;
                      if (h > 23) return null;
                      const val = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                      return <option key={val} value={val}>{val}</option>;
                    })}
                    <option value="23:59">23:59 (Midnight)</option>
                  </select>
                </div>

                <div className="col-span-2 pt-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Calendar Duty Slot Color
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddForm({ ...addForm, color: "#22c55e" })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        addForm.color === "#22c55e" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-700 border-gray-200"
                      }`}
                    >
                      🟢 Light Green
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddForm({ ...addForm, color: "#eab308" })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        addForm.color === "#eab308" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-700 border-gray-200"
                      }`}
                    >
                      🟡 Light Yellow
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col h-full max-h-[220px]">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Services Offered
                </label>
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-white/50 space-y-4">
                  {Object.keys(servicesByCategory).length > 0 ? (
                    Object.entries(servicesByCategory).map(([category, svcs]: [string, any]) => (
                      <div key={category}>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">
                          {category}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {svcs.map((svc: any) => (
                            <label key={svc.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                              <input
                                type="checkbox"
                                checked={addForm.services.includes(svc.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAddForm({ ...addForm, services: [...addForm.services, svc.name] });
                                  } else {
                                    setAddForm({ ...addForm, services: addForm.services.filter((s) => s !== svc.name) });
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
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6 space-y-4 mb-16">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FaCalendarMinus className="text-red-500" /> Mark Staff Leave
              </h2>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={leaveForm.staff_id}
                  onChange={(e) => setLeaveForm({ ...leaveForm, staff_id: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-500 font-medium"
                  required
                >
                  <option value="">Choose Staff...</option>
                  {staff.map((member: any) => (
                    <option key={member.id} value={member.id}>
                      {member.name || `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Leave Date *
                </label>
                <input
                  type="date"
                  value={leaveForm.leave_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_date: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Leave Duration & Hours *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setLeaveForm({ ...leaveForm, leave_type: "full_day", start_time: "00:00", end_time: "23:59" })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      leaveForm.leave_type === "full_day"
                        ? "bg-red-500 text-white border-red-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-gray-200 hover:bg-slate-100"
                    }`}
                  >
                    Full Day (All Day)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveForm({ ...leaveForm, leave_type: "half_morning", start_time: "09:00", end_time: "14:00" })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      leaveForm.leave_type === "half_morning"
                        ? "bg-red-500 text-white border-red-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-gray-200 hover:bg-slate-100"
                    }`}
                  >
                    Morning Half-Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveForm({ ...leaveForm, leave_type: "half_afternoon", start_time: "14:00", end_time: "20:00" })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      leaveForm.leave_type === "half_afternoon"
                        ? "bg-red-500 text-white border-red-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-gray-200 hover:bg-slate-100"
                    }`}
                  >
                    Afternoon Half-Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveForm({ ...leaveForm, leave_type: "custom" })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      leaveForm.leave_type === "custom"
                        ? "bg-red-500 text-white border-red-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-gray-200 hover:bg-slate-100"
                    }`}
                  >
                    Custom Hours
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Start Time</label>
                    <select
                      value={leaveForm.start_time}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: "custom", start_time: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-500 font-semibold"
                      required
                    >
                      <option value="00:00">00:00 (Midnight)</option>
                      {Array.from({ length: 64 }, (_, i) => {
                        const h = Math.floor(i / 4) + 8;
                        const m = (i % 4) * 15;
                        if (h > 23) return null;
                        const val = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                        return <option key={val} value={val}>{val}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">End Time</label>
                    <select
                      value={leaveForm.end_time}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: "custom", end_time: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-500 font-semibold"
                      required
                    >
                      {Array.from({ length: 64 }, (_, i) => {
                        const h = Math.floor(i / 4) + 8;
                        const m = (i % 4) * 15;
                        if (h > 23) return null;
                        const val = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                        return <option key={val} value={val}>{val}</option>;
                      })}
                      <option value="23:59">23:59 (End of Day)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sick leave, Annual vacation, Off Day..."
                  value={leaveForm.notes}
                  onChange={(e) => setLeaveForm({ ...leaveForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors shadow-md shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? <FaSpinner className="animate-spin text-sm" /> : "Save Leave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
