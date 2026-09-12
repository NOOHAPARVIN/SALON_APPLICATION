"use client";

import { useEffect, useState, useRef } from "react";
import { FaSyncAlt, FaSpinner, FaCalendarAlt, FaPlus, FaExclamationTriangle } from "react-icons/fa";
import { useModal } from "@/components/ModalContext";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import BookingModal from "@/components/Bookingmodal";
import { services as womensServices } from "@/components/serviceData";
import { services as mensServices } from "@/components/mensServiceData";
import { useBranch } from "@/lib/BranchContext";
import { supabase } from "@/lib/supabaseClient";

export default function OwnerCalendarPage() {
  const { showAlert, showConfirm } = useModal();
  const [bookings, setBookings] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"appointment" | "busy" | "leave" | "break">("appointment");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [outOfHoursWarning, setOutOfHoursWarning] = useState<{show: boolean, info: any, isReschedule?: boolean}>({ show: false, info: null });
  const [staffConflictWarning, setStaffConflictWarning] = useState<{show: boolean, payload: any, info: any}>({ show: false, payload: null, info: null });
  const [currentDateRange, setCurrentDateRange] = useState({ start: "", end: "" });
  const dateRangeRef = useRef({ start: "", end: "" });
  const [rescheduleModeData, setRescheduleModeData] = useState<any>(null);
  const [pickerDate, setPickerDate] = useState("");
  const calendarRef = useRef<any>(null);
  const { currentBranch, isLoadingBranches } = useBranch();
  const activeServices = currentBranch === 'elan' ? mensServices : womensServices;

  const fetchStaffRef = useRef<AbortController | null>(null);
  const fetchBookingsRef = useRef<AbortController | null>(null);

  useEffect(() => { 
    if (fetchStaffRef.current) fetchStaffRef.current.abort();
    if (fetchBookingsRef.current) fetchBookingsRef.current.abort();

    fetchStaff(); 
    if (dateRangeRef.current.start) {
      fetchBookings(dateRangeRef.current.start, dateRangeRef.current.end);
    }
    
    return () => {
      if (fetchStaffRef.current) fetchStaffRef.current.abort();
      if (fetchBookingsRef.current) fetchBookingsRef.current.abort();
    };
  }, [currentBranch]);

  // Supabase Realtime Sync
  useEffect(() => {
    const channel = supabase
      .channel('public:bookings:owner')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (dateRangeRef.current.start) {
            fetchBookings(dateRangeRef.current.start, dateRangeRef.current.end);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBranch]);

  // Smart Reminder Heartbeat
  useEffect(() => {
    const triggerReminders = () => {
      fetch("/api/send-reminders", { method: "POST" }).catch(e => console.error("Reminder error:", e));
    };
    triggerReminders(); // Run on mount
    const interval = setInterval(triggerReminders, 15 * 60 * 1000); // Run every 15 minutes
    return () => clearInterval(interval);
  }, []);

  const generateDutyBackgroundEvents = (staffList: any[], startStr?: string, endStr?: string) => {
    if (!staffList || staffList.length === 0) return [];
    
    const dutyEvents: any[] = [];
    const sDate = startStr ? new Date(startStr) : new Date();
    const eDate = endStr ? new Date(endStr) : new Date(Date.now() + 86400000);
    
    const maxDays = 14;
    let count = 0;
    for (let d = new Date(sDate); d <= eDate && count < maxDays; d.setDate(d.getDate() + 1), count++) {
      const dayOfWeek = d.getDay();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      staffList.forEach((s: any) => {
        const workingDays = Array.isArray(s.working_days) ? s.working_days : [0, 1, 2, 3, 4, 5, 6];
        if (!workingDays.includes(dayOfWeek)) return;
        
        const wStart = s.working_start || "09:00";
        const wEnd = s.working_end || "21:00";
        const color = (s.color || "#22c55e").toLowerCase();
        const isYellow = color.includes("eab308") || color.includes("yellow") || color.includes("facc15");
        
        dutyEvents.push({
          id: `duty-${s.id}-${dateStr}`,
          resourceId: String(s.id),
          title: "",
          start: `${dateStr}T${wStart}:00`,
          end: `${dateStr}T${wEnd}:00`,
          display: "background",
          backgroundColor: isYellow ? "rgba(254, 240, 138, 0.45)" : "rgba(187, 247, 208, 0.40)",
          className: isYellow ? "fc-duty-yellow" : "fc-duty-green",
          extendedProps: { isDuty: true, staffId: s.id }
        });
      });
    }
    
    return dutyEvents;
  };

  const fetchStaff = async () => {
    if (fetchStaffRef.current) fetchStaffRef.current.abort();
    const controller = new AbortController();
    fetchStaffRef.current = controller;

    try {
      const resStaff = await fetch(`/api/bookings/staff?branch=${currentBranch}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      const staffData = await resStaff.json();
      const loadedStaff = staffData || [];
      if (!controller.signal.aborted) {
        setStaff(loadedStaff);
        
        const mappedResources = loadedStaff.length > 0 
          ? loadedStaff.map((s: any) => ({ 
              id: String(s.id), 
              title: s.name, 
              sortOrder: s.id,
              businessHours: {
                startTime: s.working_start || "09:00",
                endTime: s.working_end || "21:00",
                daysOfWeek: Array.isArray(s.working_days) ? s.working_days : [0, 1, 2, 3, 4, 5, 6],
              }
            }))
          : [{ id: "none", title: "No Staff Available" }];
          
        setResources(mappedResources);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching staff:", err);
      }
    }
  };

  const fetchBookings = async (start?: string, end?: string) => {
    if (fetchBookingsRef.current) fetchBookingsRef.current.abort();
    const controller = new AbortController();
    fetchBookingsRef.current = controller;

    setLoading(true);
    try {
      let url = `/api/bookings?branch=${currentBranch}`;
      if (start && end) {
        url += `&start=${start}&end=${end}`;
      }
      const resBookings = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store'
      });
      const bookingsData = await resBookings.json();
      
      if (controller.signal.aborted) return;
      
      const loadedBookings = bookingsData.bookings || [];

      setBookings(loadedBookings);

      const colorMap: Record<string, string> = {
        Busy: "#94a3b8",
        Leave: "#ef4444",
        Hair: "#ff6b35",
        Facial: "#00d284",
        Massage: "#f472b6",
        Nails: "#8b5cf6",
        Spa: "#06b6d4",
      };

      const mappedEvents = loadedBookings
        .filter((b: any) => b.appointment_date && b.start_time && b.end_time && b.status !== "cancelled")
        .map((b: any) => {
          const isLeave = b.category === "Leave";
          const isBusy = b.category === "Busy" || b.booking_source === "busy";
          const color = colorMap[b.category] || "#2972ff";
          
          let bgColor = "white";
          let textColor = color;
          let bdColor = color;
          
          if (isLeave) {
            bgColor = "#fef2f2"; // red-50
            textColor = "#b91c1c"; // red-700
            bdColor = "#ef4444"; // red-500
          } else if (b.payment_status === "paid") {
            if (b.booking_source === "website" || b.booking_source === "online") {
              bgColor = "#a7f3d0"; // very light green
              textColor = "#065f46"; // dark green text
              bdColor = "#059669"; // border green
            } else {
              bgColor = "#d1fae5"; // pale green
              textColor = "#065f46";
              bdColor = "#10b981";
            }
          } else if (b.status === "completed") {
            bgColor = "#bbf7d0"; // light dark green
            textColor = "#14532d";
            bdColor = "#166534";
          }
          
          return {
            id: String(b.id),
            resourceId: b.staff_id ? String(b.staff_id) : "",
            title: isLeave ? `LEAVE: ${b.notes || "Off Time"}` : (isBusy ? `Busy: ${b.notes || "Not Available"}` : `${b.name} — ${b.service_name || ""}`),
            start: `${b.appointment_date}T${b.start_time}`,
            end: `${b.appointment_date}T${b.end_time}`,
            backgroundColor: isLeave ? "#ef4444" : bgColor, // Red for leave
            borderColor: isLeave ? "#b91c1c" : bdColor,
            textColor: isLeave ? "white" : textColor,
            display: "auto", // Removed "background" so it shows as a regular block
            extendedProps: { booking: b, customColor: isLeave ? "white" : textColor },
          };
        });
      
      const dutyBgEvents = generateDutyBackgroundEvents(staff, start || dateRangeRef.current.start, end || dateRangeRef.current.end);
      setEvents([...dutyBgEvents, ...mappedEvents]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching calendar data:", err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleSaveBooking = async (formData: any, keepOpen?: boolean) => {
    try {
      const isLeave = formData.category === "Leave";
      const isBusy = formData.category === "Busy" || formData.booking_source === "busy" || isLeave;
      let payload: any;
      
      if (isBusy) {
        payload = {
          customer: { name: formData.name || (isLeave ? "Staff Leave" : "Busy Time"), phone: formData.phone || "" },
          date: formData.appointment_date || formData.date,
          time: formData.start_time || formData.time,
          services: [{
            category: formData.category || "Busy",
            service: isLeave ? "Leave" : "Busy Block",
            staff: staff.find((s: any) => String(s.id) === String(formData.staff_id))?.name || "",
            price: 0,
            duration_minutes: (() => {
              const s = formData.start_time || formData.time;
              const e = formData.end_time;
              if (s && e) {
                const [sh, sm] = s.split(':').map(Number);
                const [eh, em] = e.split(':').map(Number);
                return (eh * 60 + em) - (sh * 60 + sm);
              }
              return isLeave ? 1440 : 30; // Default fallback
            })(),
          }],
          payment: "cash",
          payment_status: "unpaid",
          note: formData.notes || formData.note,
          total: 0,
          userId: null,
          status: "confirmed",
          booking_source: isLeave ? "leave" : "busy",
          created_by: formData.created_by || "admin",
          service_id: formData.service_id || null,
        };
      } else if (formData.services && formData.customer) {
        payload = {
          customer: formData.customer,
          date: formData.date || formData.appointment_date,
          time: formData.time || formData.start_time,
          services: formData.services,
          payment: formData.payment_method || formData.payment || "cash",
          payment_status: formData.payment_status || "unpaid",
          note: formData.notes || formData.note,
          total: formData.total,
          userId: formData.userId || null,
          status: formData.status || "confirmed",
          booking_source: formData.booking_source || "admin",
          created_by: formData.created_by || "admin",
          service_id: formData.service_id || null,
          tips: formData.tips !== undefined ? Number(formData.tips) : undefined,
          tipped_staff_id: formData.tipped_staff_id || null,
          branch: currentBranch,
        };
      } else {
        payload = {
          customer: { name: formData.name || "Customer", phone: formData.phone || "" },
          date: formData.appointment_date || formData.date,
          time: formData.start_time || formData.time,
          services: [{
            category: formData.category,
            service: formData.service_name,
            staff: staff.find((s: any) => String(s.id) === String(formData.staff_id))?.name || "",
            price: formData.total || 0,
            duration_minutes: formData.duration_minutes || 30,
          }],
          payment: formData.payment_method || formData.payment || "cash",
          payment_status: formData.payment_status || "unpaid",
          note: formData.notes || formData.note,
          total: formData.total || 0,
          userId: null,
          status: formData.status || "confirmed",
          booking_source: formData.booking_source || "admin",
          created_by: formData.created_by || "admin",
          service_id: formData.service_id || null,
          tips: formData.tips !== undefined ? Number(formData.tips) : undefined,
          tipped_staff_id: formData.tipped_staff_id || null,
          branch: currentBranch,
        };
      }
      
      const res = await fetch(`/api/bookings?branch=${currentBranch}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) { return { success: false, error: data.error || "Failed to save booking" }; }
      if (!keepOpen) {
        setOpenModal(false); setSelectedSlot(null); 
      }
      if (currentDateRange.start) fetchBookings(currentDateRange.start, currentDateRange.end);
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message || "Request failed" }; }
  };

  const handleUpdateBooking = async (formData: any, keepOpen?: boolean) => {
    try {
      const isLeave = formData.category === "Leave";
      const isBusy = formData.category === "Busy" || isLeave;
      const payload = {
        name: formData.name || (isLeave ? "Staff Leave" : "Busy Time"), phone: formData.phone || "",
        category: formData.category, service_name: formData.service_name,
        staff_id: formData.staff_id ? Number(formData.staff_id) : null,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time + (formData.start_time.length === 5 ? ":00" : ""),
        end_time: formData.end_time + (formData.end_time.length === 5 ? ":00" : ""),
        payment_method: formData.payment_method, payment_status: formData.payment_status,
        notes: formData.notes, total: isBusy ? 0 : (formData.total ? Number(formData.total) : null),
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null, status: formData.status,
        booking_source: formData.booking_source, created_by: formData.created_by,
        service_id: formData.service_id || null,
        tips: formData.tips !== undefined ? Number(formData.tips) : undefined,
      };
      const res = await fetch(`/api/bookings?id=${formData.id}&branch=${currentBranch}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) { return { success: false, error: data.error || "Failed to update" }; }
      if (!keepOpen) {
        setOpenModal(false); setIsEditMode(false); setSelectedEvent(null);
      }
      if (currentDateRange.start) fetchBookings(currentDateRange.start, currentDateRange.end);
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message || "Request failed" }; }
  };

  const handleCalendarChange = async (info: any) => {
    const start = info.event.start!;
    const end = info.event.end!;
    const resourceId = info.event.getResources?.()?.[0]?.id;
    const oldStaffId = info.event.extendedProps.booking?.staff_id;
    const newStaffId = resourceId ? Number(resourceId) : undefined;
    const isStaffChanged = oldStaffId !== undefined && newStaffId !== undefined && String(oldStaffId) !== String(newStaffId);

    const isPaid = info.event.extendedProps.booking?.payment_status === "paid" || info.event.extendedProps.booking?.status === "completed";

    if (isPaid && isStaffChanged) {
      showAlert("Error", "Cannot change stylist for a checked-out booking.", "error");
      info.revert();
      return;
    }

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const formatTime = (d: Date) => {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}:00`;
    };
    try {
      const payload: any = { 
        appointment_date: formatDate(start), 
        start_time: formatTime(start), 
        end_time: formatTime(end), 
        staff_id: newStaffId 
      };


      const res = await fetch(`/api/bookings?id=${info.event.id}&branch=${currentBranch}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) { 
        if (data.error && data.error.includes("is not available for this time")) {
          setStaffConflictWarning({ show: true, payload, info });
          return;
        } else {
          showAlert("Error", "Could not move booking: " + (data.error || "Unknown error"), "error"); 
          info.revert(); 
          return; 
        }
      }
      
      if (currentDateRange.start) fetchBookings(currentDateRange.start, currentDateRange.end);
    } catch { showAlert("Connection Error", "Connection error", "error"); info.revert(); }
  };

  const handleDeleteBooking = async (id: string | number) => {
    showConfirm("Delete Booking", "Delete this booking permanently?", async () => {
      try {
        const res = await fetch(`/api/bookings?id=${id}&branch=${currentBranch}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) { setOpenModal(false); setIsEditMode(false); setSelectedEvent(null); if (currentDateRange.start) fetchBookings(currentDateRange.start, currentDateRange.end); }
        else showAlert("Error", "Failed to delete: " + data.error, "error");
      } catch { showAlert("Error", "Error deleting booking", "error"); }
    }, "error");
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f7f6] overflow-hidden">
      {rescheduleModeData && (
        <div className="w-full bg-[#5b5fc7] text-white py-2.5 px-6 flex justify-between items-center shadow-md relative z-50">
          <div className="w-20"></div>
          <span className="font-semibold text-base absolute left-1/2 transform -translate-x-1/2">Choose new appointment time</span>
          <button 
            onClick={() => {
              setRescheduleModeData(null);
            }} 
            className="w-20 text-right text-sm hover:text-gray-200 font-medium"
          >
            Cancel
          </button>
        </div>
      )}
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-2 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff6b35]/10 p-2.5 rounded-xl">
            <FaCalendarAlt className="text-[#ff6b35] text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Appointment Calendar</h1>
            <p className="text-xs text-gray-400 mt-0.5">Click any time slot to book • Drag events to reschedule</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm mr-2">
            <span className="text-sm text-gray-500 mr-2 font-medium">Go to date:</span>
            <input 
              type="date"
              value={pickerDate}
              onChange={(e) => {
                const dateStr = e.target.value;
                setPickerDate(dateStr);
                if (dateStr && calendarRef.current) calendarRef.current.getApi().gotoDate(dateStr);
              }}
              className="text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => { setIsEditMode(false); setModalMode("appointment"); setSelectedSlot(null); setOpenModal(true); }}
            className="flex items-center gap-2 bg-[#10b981] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#059669] transition-colors shadow-md shadow-[#10b981]/20"
          >
            <FaPlus className="text-xs" /> New Booking
          </button>
          <button
            onClick={() => { if (currentDateRange.start) fetchBookings(currentDateRange.start, currentDateRange.end); }}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-b border-gray-100 px-8 py-1.5 flex items-center gap-6 flex-shrink-0">
        <span className="text-xs text-gray-400 font-medium">Legend:</span>
        {[
          { label: "Hair", color: "#ff6b35" },
          { label: "Facial", color: "#00d284" },
          { label: "Massage", color: "#f472b6" },
          { label: "Nails", color: "#8b5cf6" },
          { label: "Spa", color: "#06b6d4" },
          { label: "Other", color: "#2972ff" },
          { label: "Busy", color: "#94a3b8" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border-2" style={{ borderColor: color, backgroundColor: "white" }} />
            <span className="text-xs text-gray-500 font-medium">{label}</span>
          </div>
        ))}
        <div className="h-3.5 w-[1px] bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-emerald-100 border border-emerald-400" />
          <span className="text-xs text-emerald-800 font-medium">Duty (Green)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-yellow-100 border border-yellow-400" />
          <span className="text-xs text-yellow-800 font-medium">Duty (Yellow)</span>
        </div>
      </div>

      {/* Calendar — full width always; slide-in panel only when slot/event clicked */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/50 backdrop-blur-sm text-gray-400">
            <FaSpinner className="animate-spin text-4xl text-[#ff6b35]" />
            <p className="text-sm font-medium">Loading schedule...</p>
          </div>
        )}
        
        <>
          {/* Calendar always fills 100% width */}
          <div className="flex-1 overflow-hidden p-1 sm:p-2 relative" style={{ transition: "padding-right 0.3s ease" }}>
            <div 
                className="bg-white rounded-2xl border border-gray-100 h-full overflow-hidden relative"
                style={{ 
                  boxShadow: rescheduleModeData ? "0 0 0 9999px rgba(0,0,0,0.4), 0 0 20px #10b981" : "var(--tw-shadow)",
                zIndex: rescheduleModeData ? 50 : 1,
                position: "relative"
              }}
            >
              <style>{`
                .fc-theme-standard td, .fc-theme-standard th { border-color: #cbd5e1 !important; }
                .fc-theme-standard .fc-scrollgrid { border-color: #cbd5e1 !important; }
                .fc .fc-col-header-cell { background: #f8fafc !important; color: #475569 !important; font-size: 12px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.04em !important; }
                .fc .fc-timegrid-slot-label { color: #94a3b8 !important; font-size: 11px !important; font-weight: 500 !important; }
                .fc .fc-timegrid-slot { height: 50px !important; }
                .fc .fc-timegrid-slot:hover { background: #ecfdf5 !important; cursor: pointer; }
                .fc .fc-event { border-radius: 6px !important; border-width: 2px !important; cursor: pointer; box-shadow: none !important; transition: box-shadow 0.15s ease; }
                  .fc .fc-event:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important; }
                  .fc .fc-event-main { padding: 3px 6px !important; font-size: 11px !important; font-weight: 600 !important; }
                  .fc .fc-timegrid-now-indicator-line { border-color: #ef4444 !important; border-width: 2px !important; z-index: 30 !important; }
                  .fc .fc-timegrid-now-indicator-arrow { border-color: #ef4444 !important; border-width: 6px !important; z-index: 30 !important; }
                  .fc .fc-button-primary { background-color: #10b981 !important; border-color: #10b981 !important; color: white !important; border-radius: 8px !important; font-size: 12px !important; padding: 6px 12px !important; }
                  .fc .fc-button-primary:hover { background-color: #059669 !important; border-color: #059669 !important; }
                  .fc .fc-toolbar-title { font-size: 0 !important; }
                  .fc .fc-toolbar-title::after { content: attr(data-custom-title); font-size: 16px !important; font-weight: 700 !important; color: #1e293b !important; }
                  .fc .fc-header-toolbar { padding: 4px 16px !important; border-bottom: 1px solid #f1f5f9 !important; }
                  .fc .fc-resource-area-header { background: #f8fafc !important; }
                  .fc .fc-datagrid-cell-main { font-size: 12px !important; font-weight: 700 !important; color: #475569 !important; padding: 8px 12px !important; }
                `}</style>
                <FullCalendar
                  ref={calendarRef}
                  plugins={[resourceTimeGridPlugin, interactionPlugin]}
                  initialView="resourceTimeGridDay"
                  resources={resources}
                  resourceOrder="sortOrder"
                  events={events}
                  selectable={true}
                  editable={true}
                  eventResizableFromStart={true}
                  height="100%"
                  nowIndicator={true}
                  allDaySlot={false}
                  slotMinTime="09:00:00"
                  slotMaxTime="33:00:00"
                  scrollTime="09:00:00"
                  slotDuration="00:15:00"
                  slotLabelInterval="01:00:00"
                  resourceAreaHeaderContent="Stylists"
                  resourceAreaWidth="130px"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "resourceTimeGridDay,timeGridWeek",
                  }}
                  buttonText={{ today: "Today", day: "Day", week: "Week" }}
                  datesSet={(dateInfo) => {
                    setTimeout(() => {
                      const titleEl = document.querySelector('.fc-toolbar-title');
                      if (titleEl) {
                        titleEl.setAttribute('data-custom-title', dateInfo.view.currentStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
                      }
                    }, 0);
                    try {
                      const y = dateInfo.view.currentStart.getFullYear();
                      const m = String(dateInfo.view.currentStart.getMonth() + 1).padStart(2, '0');
                      const d = String(dateInfo.view.currentStart.getDate()).padStart(2, '0');
                      setPickerDate(`${y}-${m}-${d}`);
                    } catch (e) {
                      console.error(e);
                    }
                    const startStr = dateInfo.startStr.split('T')[0];
                    const endStr = dateInfo.endStr.split('T')[0];
                    
                    if (dateRangeRef.current.start !== startStr || dateRangeRef.current.end !== endStr) {
                      dateRangeRef.current = { start: startStr, end: endStr };
                      setCurrentDateRange({ start: startStr, end: endStr });
                      fetchBookings(startStr, endStr);
                    }
                  }}
                  eventContent={(eventInfo) => {
                    if (eventInfo.event.display === "background" || eventInfo.event.extendedProps?.isDuty) {
                      return null;
                    }
                    const b = eventInfo.event.extendedProps.booking;
                    const isPaid = b?.payment_status === "paid";
                    const isCompleted = b?.status === "completed";
                    const isArrived = b?.status === "arrived";
                    const isBusy = b?.category === "Busy" || b?.category === "Leave" || b?.booking_source === "busy";
                    const color = eventInfo.event.extendedProps.customColor || "#2972ff";
                    return (
                      <div style={{ 
                        color, 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        padding: "2px", 
                        lineHeight: 1.3, 
                        position: "relative", 
                        height: "100%",
                        borderLeft: "none",
                        backgroundColor: isArrived ? "rgba(16, 185, 129, 0.12)" : "transparent",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "3px"
                      }}>
                        {isArrived && (
                          <div style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: "5px",
                            background: "linear-gradient(180deg, #34d399 0%, #059669 100%)",
                            boxShadow: "2px 0 8px rgba(16, 185, 129, 0.6)",
                            borderRadius: "3px 0 0 3px",
                            zIndex: 1
                          }} />
                        )}
                        <div style={{ position: "absolute", top: "0", right: "0", display: "flex", gap: "3px", color: color, opacity: 0.8 }}>
                          {(b?.notes?.includes("Gift Card") || b?.note?.includes("Gift Card")) && (
                            <span style={{ fontSize: "10px" }} title="Purchased as Gift">🎁</span>
                          )}
                          {isCompleted && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="16 8 12 16 8 12"></polyline>
                            </svg>
                          )}
                          {isPaid && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="12" y1="18" x2="12" y2="12"></line>
                              <path d="M9 14.5h3a1.5 1.5 0 0 1 1.5 1.5v0a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 0-1.5 1.5v0A1.5 1.5 0 0 0 9 20h3"></path>
                            </svg>
                          )}
                        </div>
                        <div style={{ paddingRight: (isPaid || isCompleted) ? "28px" : "0", paddingTop: "2px", paddingLeft: isArrived ? "8px" : "2px", position: "relative", zIndex: 2 }}>
                          <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {eventInfo.event.title}
                          </div>
                          {!isBusy && (b?.notes || b?.note) && (
                            <div style={{ 
                              fontSize: '10px', 
                              marginTop: '2px', 
                              fontStyle: 'italic',
                              whiteSpace: 'pre-line',
                              lineHeight: 1.2,
                              opacity: 0.95,
                              borderTop: '1px dashed currentColor',
                              paddingTop: '2px'
                            }}>
                              📝 {b.notes || b.note}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                  select={(info) => {
                    // Check if staff is on leave for this date
                    const dateStr = info.startStr.split("T")[0];
                    const staffId = info.resource?.id;
                    const overlappingLeave = bookings.find(
                      (b) => b.appointment_date === dateStr && String(b.staff_id) === String(staffId) && b.category === "Leave"
                    );
                    
                    if (overlappingLeave) {
                      showConfirm(
                        "Staff on Leave",
                        "Staff is not available. They are on leave.\n\nDo you want to CANCEL this leave block and reopen bookings for this day?",
                        () => handleDeleteBooking(overlappingLeave.id)
                      );
                      return;
                    }

                    // Check working hours (9 AM - 10 PM)
                    const hour = info.start.getHours();
                    if (hour < 9 || hour >= 22) {
                      setOutOfHoursWarning({ show: true, info, isReschedule: !!rescheduleModeData });
                      return;
                    }

                    if (rescheduleModeData) {
                      const startStr = info.startStr.split("T")[1]?.slice(0, 5) || "09:00";
                      const resourceId = info.resource?.id;
                      
                      // Calculate end time based on original duration
                      const duration = Number(rescheduleModeData.duration_minutes) || 30;
                      const [hours, minutes] = startStr.split(":").map(Number);
                      const totalMinutes = hours * 60 + minutes + duration;
                      const endH = Math.floor(totalMinutes / 60);
                      const endM = totalMinutes % 60;
                      const endStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

                      const payload = {
                        ...rescheduleModeData,
                        appointment_date: dateStr,
                        start_time: startStr + ":00",
                        end_time: endStr + ":00",
                        staff_id: resourceId ? Number(resourceId) : rescheduleModeData.staff_id,
                      };
                      handleUpdateBooking(payload).then((res) => {
                        if (!res?.success) {
                          alert("Failed to reschedule: " + (res?.error || "Unknown error"));
                        }
                      });
                      setRescheduleModeData(null);
                      return;
                    }

                    setIsEditMode(false);
                    setModalMode("appointment");
                    setSelectedSlot(info);
                    setOpenModal(true);
                  }}
                  eventClick={(info) => {
                    if (rescheduleModeData || info.event.display === "background" || info.event.extendedProps?.isDuty) return;
                    const b = info.event.extendedProps?.booking;
                    if (!b) return;
                    if (b.category === "Leave") {
                      showConfirm(
                        "Staff on Leave",
                        "Staff is not available. They are on leave.\n\nDo you want to CANCEL this leave block and reopen bookings for this day?",
                        () => handleDeleteBooking(b.id)
                      );
                      return;
                    }
                    
                    setIsEditMode(true);
                    const isBusy = b.booking_source === "busy" || b.category === "Busy";
                    setModalMode(isBusy ? "busy" : "appointment");
                    const relatedBookings = bookings.filter((other: any) => 
                      other.id !== b.id &&
                      b.group_id && other.group_id === b.group_id
                    );

                    setSelectedEvent({
                      id: String(b.id), name: b.name || "", phone: b.phone ? String(b.phone) : "",
                      category: b.category || "", service_name: b.service_name || "",
                      staff_id: b.staff_id ? String(b.staff_id) : "",
                      payment_method: b.payment_method || "cash", notes: b.notes || b.note || "",
                      appointment_date: b.appointment_date || "", start_time: b.start_time || "",
                      end_time: b.end_time || "", status: b.status || "confirmed",
                      booking_source: b.booking_source || "admin",
                      duration_minutes: b.duration_minutes || "",
                      total: b.total || 0, payment_status: b.payment_status || "unpaid",
                      created_by: b.created_by || "admin", service_id: b.service_id || "",
                      relatedBookings: relatedBookings,
                    });
                    setOpenModal(true);
                  }}
                  eventDrop={handleCalendarChange}
                  eventResize={handleCalendarChange}
                />
              </div>
            </div>

            {/* Floating booking modal overlay */}
            {openModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="w-[680px] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl relative my-auto">
                  <BookingModal
                    open={openModal}
                    onClose={() => { setOpenModal(false); setIsEditMode(false); setSelectedEvent(null); setSelectedSlot(null); }}
                    onSave={isEditMode ? handleUpdateBooking : handleSaveBooking}
                    onCreate={handleSaveBooking}
                    onDelete={handleDeleteBooking}
                    onReschedule={(data: any) => {
                      setRescheduleModeData(data);
                      setOpenModal(false);
                      setIsEditMode(false);
                      setSelectedEvent(null);
                      setSelectedSlot(null);
                    }}
                    selectedSlot={selectedSlot}
                    staff={staff}
                    services={activeServices}
                    editData={selectedEvent}
                    isEditMode={isEditMode}
                    mode={modalMode}
                  />
                </div>
              </div>
            )}

            {/* Staff Conflict Warning Modal */}
            {staffConflictWarning.show && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="bg-red-100 p-3 rounded-full mb-3 text-red-500">
                      <FaExclamationTriangle size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 text-center">Staff Unavailable</h2>
                    <p className="text-sm text-slate-600 text-center mt-2 leading-relaxed">
                      The selected staff member is already booked at this time. Do you want to double-book them and update anyway?
                    </p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        staffConflictWarning.info.revert();
                        setStaffConflictWarning({ show: false, payload: null, info: null });
                      }}
                      className="px-5 py-2.5 flex-1 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        const payload = { ...staffConflictWarning.payload, ignore_availability: true };
                        const info = staffConflictWarning.info;
                        setStaffConflictWarning({ show: false, payload: null, info: null });
                        
                        try {
                          const res = await fetch(`/api/bookings?id=${info.event.id}&branch=${currentBranch}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                          const data = await res.json();
                          if (!res.ok || !data.success) {
                            showAlert("Error", "Could not move booking: " + (data.error || "Unknown error"), "error");
                            info.revert();
                            return;
                          }
                          if (currentDateRange.start) fetchBookings(currentDateRange.start, currentDateRange.end);
                        } catch {
                          showAlert("Connection Error", "Connection error", "error");
                          info.revert();
                        }
                      }}
                      className="px-5 py-2.5 flex-1 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all text-sm"
                    >
                      Update Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Out of hours warning overlay */}
            {outOfHoursWarning.show && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Outside Working Hours</h2>
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    You selected a time outside the salon's working hours (9 AM - 10 PM). Would you want to book anyway?
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setOutOfHoursWarning({ show: false, info: null })}
                      className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-sm"
                    >
                      Ok
                    </button>
                    <button
                      onClick={() => {
                        const info = outOfHoursWarning.info;
                        const isResch = outOfHoursWarning.isReschedule;
                        setOutOfHoursWarning({ show: false, info: null });
                        
                        if (isResch && rescheduleModeData) {
                          const startStr = info.startStr.split("T")[1]?.slice(0, 5) || "09:00";
                          const dateStr = info.startStr.split("T")[0];
                          const resourceId = info.resource?.id;
                          
                          // Calculate end time based on original duration
                          const duration = Number(rescheduleModeData.duration_minutes) || 30;
                          const [hours, minutes] = startStr.split(":").map(Number);
                          const totalMinutes = hours * 60 + minutes + duration;
                          const endH = Math.floor(totalMinutes / 60);
                          const endM = totalMinutes % 60;
                          const endStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

                          const payload = {
                            ...rescheduleModeData,
                            appointment_date: dateStr,
                            start_time: startStr + ":00",
                            end_time: endStr + ":00",
                            staff_id: resourceId ? Number(resourceId) : rescheduleModeData.staff_id,
                          };
                          handleUpdateBooking(payload).then((res) => {
                            if (!res?.success) {
                              alert("Failed to reschedule: " + (res?.error || "Unknown error"));
                            }
                          });
                          setRescheduleModeData(null);
                        } else {
                          setIsEditMode(false);
                          setModalMode("appointment");
                          setSelectedSlot(info);
                          setOpenModal(true);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#ff6b35] hover:bg-[#e85a25] transition-all text-sm"
                    >
                      Book Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
      </div>
    </div>
  );
}
