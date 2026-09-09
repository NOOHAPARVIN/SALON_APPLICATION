"use client";

import { useEffect, useState, useRef } from "react";
import {
  FaCalendarWeek,
  FaSyncAlt,
  FaSpinner
} from "react-icons/fa";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { services as womensServices } from "@/components/serviceData";
import { services as mensServices } from "@/components/mensServiceData";
import { supabase } from "@/lib/supabaseClient";
import BookingModal from "@/components/Bookingmodal";
import { services } from "@/components/serviceData";

const servicePrices: Record<string, number> = {
  "Haircut": 80,
  "Coloring": 300,
  "Protein": 299,
  "Full Body Relaxing Massage": 90,
  "Thai Massage": 100,
  "Hot Oil Massage": 100,
  "Deep Tissue Massage": 120,
  "Any Facial": 99,
  "Anti-aging Hydra Facial": 150,
  "Premium Hydra Facial": 249,
  "Kanpeki Korean Facial": 399,
  "Hairspa": 100,
  "Footspa": 60,
  "Pedicure and Manicure": 100,
  "Pedicure": 60,
  "Manicure": 70,
  "Gel polish": 60,
  "Gel polish Removal": 60,
  "Gel extentions": 60,
};

function getPriceForService(serviceName: string): number {
  return servicePrices[serviceName] || 0;
}

export default function DashboardCalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar States
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"appointment" | "busy" | "leave" | "break">("appointment");
  
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rescheduleModeData, setRescheduleModeData] = useState<any>(null);

  const calendarRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Supabase Realtime Sync
  useEffect(() => {
    const channel = supabase
      .channel('public:bookings:admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateDutyBackgroundEvents = (staffList: any[]) => {
    if (!staffList || staffList.length === 0) return [];
    
    const dutyEvents: any[] = [];
    const now = new Date();
    // Generate for next 14 days
    for (let i = -2; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const resBookings = await fetch("/api/bookings", { cache: 'no-store' });
      const bookingsData = await resBookings.json();
      const loadedBookings = bookingsData.bookings || [];
      setBookings(loadedBookings);

      const resStaff = await fetch("/api/bookings/staff", { cache: 'no-store' });
      const staffData = await resStaff.json();
      const loadedStaff = staffData || [];
      setStaff(loadedStaff);

      setResources(
        loadedStaff.map((s: any) => ({
          id: String(s.id),
          title: s.name,
          businessHours: {
            startTime: s.working_start || "09:00",
            endTime: s.working_end || "21:00",
            daysOfWeek: Array.isArray(s.working_days) ? s.working_days : [0, 1, 2, 3, 4, 5, 6],
          }
        }))
      );

      const colorMap: Record<string, string> = {
        Busy: "#94a3b8",
        Hair: "#ff6b35",
        Facial: "#00d284",
        Massage: "#f472b6",
        Nails: "#8b5cf6",
        Spa: "#06b6d4",
      };

      const mappedEvents = loadedBookings
        .filter((b: any) => b.appointment_date && b.start_time && b.end_time && b.status !== "cancelled")
        .map((b: any) => {
          const isBusy = b.category === "Busy" || b.booking_source === "busy";
          const color = colorMap[b.category] || "#2972ff";
          
          let bgColor = "white";
          let textColor = color;
          let bdColor = color;
          
          if (b.payment_status === "paid") {
            if (b.booking_source === "website" || b.booking_source === "online") {
              bgColor = "#a7f3d0";
              textColor = "#065f46";
              bdColor = "#059669";
            } else {
              bgColor = "#d1fae5";
              textColor = "#065f46";
              bdColor = "#10b981";
            }
          } else if (b.status === "completed") {
            bgColor = "#bbf7d0";
            textColor = "#14532d";
            bdColor = "#166534";
          }
          
          return {
            id: String(b.id),
            resourceId: b.staff_id ? String(b.staff_id) : "",
            title: isBusy ? `Busy: ${b.notes || "Not Available"}` : `${b.name} — ${b.service_name || ""}`,
            start: `${b.appointment_date}T${b.start_time}`,
            end: `${b.appointment_date}T${b.end_time}`,
            backgroundColor: bgColor,
            borderColor: bdColor,
            textColor: textColor,
            extendedProps: { booking: b, customColor: textColor },
          };
        });
      
      const dutyBgEvents = generateDutyBackgroundEvents(loadedStaff);
      setEvents([...dutyBgEvents, ...mappedEvents]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SAVE BOOKING (CREATION)
  // =========================
  const handleSaveBooking = async (formData: any, keepOpen?: boolean) => {
    try {
      const isBusy = formData.category === "Busy";
      const payload = {
        customer: {
          name: formData.name || "Busy Time",
          phone: formData.phone || "",
        },
        date: formData.appointment_date,
        time: formData.start_time,
        services: formData.services || [
          {
            category: formData.category,
            service: formData.service_name,
            staff: staff.find((s: any) => String(s.id) === String(formData.staff_id))?.name || "",
            price: isBusy ? 0 : getPriceForService(formData.service_name),
            duration_minutes: formData.duration_minutes || 30
          },
        ],
        payment: formData.payment_method,
        payment_status: formData.payment_status || "unpaid",
        note: formData.notes,
        total: isBusy ? 0 : (formData.total || getPriceForService(formData.service_name)),
        userId: null,
        status: formData.status || "confirmed",
        booking_source: formData.booking_source || "admin",
        created_by: formData.created_by || "admin",
        service_id: formData.service_id || null,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to save booking" };
      }

      if (!keepOpen) {
        setOpenModal(false);
        setSelectedSlot(null);
      }
      fetchData();
      return { success: true };
    } catch (err: any) {
      alert("❌ Request failed");
      return { success: false, error: err.message || "Request failed" };
    }
  };

  // =========================
  // UPDATE BOOKING DETAILS
  // =========================
  const handleUpdateBooking = async (formData: any) => {
    try {
      const isBusy = formData.category === "Busy";
      const payload = {
        name: formData.name || "Busy Time",
        phone: formData.phone || "",
        category: formData.category,
        service_name: formData.service_name,
        staff_id: formData.staff_id ? Number(formData.staff_id) : null,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time + (formData.start_time.length === 5 ? ":00" : ""),
        end_time: formData.end_time + (formData.end_time.length === 5 ? ":00" : ""),
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        notes: formData.notes,
        total: isBusy ? 0 : (formData.total ? Number(formData.total) : null),
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
        status: formData.status,
        booking_source: formData.booking_source,
        created_by: formData.created_by,
        service_id: formData.service_id || null,
      };

      const res = await fetch(`/api/bookings?id=${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert("❌ Error: " + (data.error || "Failed to update booking"));
        return { success: false, error: data.error || "Failed to update booking" };
      }

      setOpenModal(false);
      setIsEditMode(false);
      setSelectedEvent(null);
      fetchData();
      return { success: true };
    } catch (err: any) {
      alert("❌ Request failed");
      return { success: false, error: err.message || "Request failed" };
    }
  };

  // =========================
  // DRAG & DROP OR RESIZE UPDATE
  // =========================
  const handleCalendarChange = async (info: any) => {
    const start = info.event.start!;
    const end = info.event.end!;
    const resourceId = info.event.getResources?.()?.[0]?.id;
    const isPaid = info.event.extendedProps.booking?.payment_status === "paid" || info.event.extendedProps.booking?.status === "completed";
    
    const oldStaffId = info.event.extendedProps.booking?.staff_id;
    const newStaffId = resourceId ? Number(resourceId) : undefined;
    const isStaffChanged = oldStaffId !== undefined && newStaffId !== undefined && String(oldStaffId) !== String(newStaffId);

    if (isPaid && isStaffChanged) {
      alert("❌ Cannot change stylist for a checked-out booking.");
      info.revert();
      return;
    }

    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const formatTime = (d: Date) => d.toTimeString().split(" ")[0];

    try {
      const payload = {
        appointment_date: formatDate(start),
        start_time: formatTime(start),
        end_time: formatTime(end),
        staff_id: resourceId ? Number(resourceId) : undefined,
      };

      const res = await fetch(`/api/bookings?id=${info.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert("❌ " + (data.error || "Could not move booking"));
        info.revert();
        return;
      }

      setBookings((prev) =>
        prev.map((b) =>
          String(b.id) === String(info.event.id)
            ? {
                ...b,
                appointment_date: payload.appointment_date,
                start_time: payload.start_time,
                end_time: payload.end_time,
                staff_id: payload.staff_id,
              }
            : b
        )
      );
    } catch (err) {
      alert("❌ Connection error");
      info.revert();
    }
  };

  // =========================
  // DELETE BOOKING
  // =========================
  const handleDeleteBooking = async (id: string | number) => {
    if (!window.confirm("⚠️ Delete this booking permanently?")) return;
    try {
      const res = await fetch(`/api/bookings?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setOpenModal(false);
        setIsEditMode(false);
        setSelectedEvent(null);
        fetchData();
      } else {
        alert("⚠️ Failed to delete booking: " + data.error);
      }
    } catch (err) {
      alert("❌ Error deleting booking");
    }
  };

  return (
    <div
      style={{
        padding: "40px 20px",
        background: "var(--color-dark-bg)",
        minHeight: "100vh",
        color: "white",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {rescheduleModeData && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "#5b5fc7", color: "white", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1000, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <div style={{ width: "80px" }}></div>
          <span style={{ fontWeight: "600", fontSize: "16px", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>Choose new appointment time</span>
          <button 
            onClick={() => {
              setRescheduleModeData(null);
            }} 
            style={{ width: "80px", textAlign: "right", background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
          >
            Cancel
          </button>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#071f17", border: "1px solid #d4af37", borderRadius: "8px", padding: "6px 12px" }}>
          <span style={{ fontSize: "14px", color: "#d4af37", marginRight: "10px", fontWeight: "500" }}>Go to date:</span>
          <input 
            type="date"
            onChange={(e) => {
              const dateStr = e.target.value;
              if (dateStr && calendarRef.current) calendarRef.current.getApi().gotoDate(dateStr);
            }}
            style={{ background: "transparent", border: "none", color: "#d4af37", fontSize: "14px", fontWeight: "600", outline: "none", cursor: "pointer" }}
          />
        </div>
      </div>
      <style>{`
        /* FullCalendar dark theme overrides */
        .fc {
          background-color: #071f17 !important;
          color: #DDD3C4 !important;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(223, 177, 91, 0.2) !important;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border: 1px solid rgba(223, 177, 91, 0.15) !important;
        }
        .fc-col-header-cell {
          background-color: #0b2b20 !important;
          color: #d4af37 !important;
          font-weight: bold;
          padding: 12px 0 !important;
          border-bottom: 2px solid rgba(223, 177, 91, 0.3) !important;
        }
        .fc-timegrid-axis-frame, .fc-timegrid-slot-label-frame {
          color: #DDD3C4 !important;
          font-size: 13px;
        }
        .fc-timegrid-slot {
          height: 60px !important;
          background-color: #071f17;
        }
        .fc-timegrid-slot:hover {
          background-color: rgba(223, 177, 91, 0.05) !important;
        }
        .fc-event {
          cursor: pointer;
          border-radius: 6px !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .fc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 15px rgba(223, 177, 91, 0.3) !important;
        }
        .fc-event-main {
          padding: 4px 8px !important;
        }
        .fc-timegrid-now-indicator-line {
          border-color: #d4af37 !important;
          border-width: 2px !important;
        }
        .fc-timegrid-now-indicator-arrow {
          border-color: #d4af37 !important;
          border-top-color: transparent !important;
          border-bottom-color: transparent !important;
        }
        .fc-header-toolbar {
          padding: 15px 20px !important;
          background: #0b2b20 !important;
          margin-bottom: 0 !important;
          border-bottom: 1px solid rgba(223, 177, 91, 0.2) !important;
        }
        .fc-toolbar-title {
          color: #d4af37 !important;
          font-size: 1.5rem !important;
          font-weight: bold !important;
        }
        .fc-button-primary {
          background-color: #071f17 !important;
          border-color: rgba(223, 177, 91, 0.3) !important;
          color: #DDD3C4 !important;
          transition: all 0.2s ease !important;
        }
        .fc-button-primary:hover {
          background-color: #d4af37 !important;
          color: #071f17 !important;
          border-color: #d4af37 !important;
        }
        .fc-button-active {
          background-color: #d4af37 !important;
          color: #071f17 !important;
          border-color: #d4af37 !important;
        }
        .fc .fc-toolbar-title { font-size: 0 !important; }
        .fc .fc-toolbar-title::after { content: attr(data-custom-title); font-size: 16px !important; font-weight: 700 !important; color: #1e293b !important; }
        .fc .fc-header-toolbar { padding: 4px 16px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .fc .fc-resource-area-header { background: #f8fafc !important; }
        .fc .fc-datagrid-cell-main { font-size: 12px !important; font-weight: 700 !important; color: #475569 !important; padding: 8px 12px !important; }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto 30px auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          borderBottom: "2px solid rgba(223, 177, 91, 0.3)",
          paddingBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "36px",
              color: "#d4af37",
              margin: 0,
              fontWeight: "bold",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            Luxury Salon Stylist Schedule
          </h1>
        </div>

        <div>
          <button
            onClick={fetchData}
            style={{
              background: "transparent",
              color: "#d4af37",
              border: "1px solid #d4af37",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#d4af37";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#d4af37";
            }}
          >
            <FaSyncAlt /> Sync Schedule
          </button>
        </div>
      </div>

      {loading && bookings.length === 0 ? (
        <div style={{ padding: "100px 0", textAlign: "center", color: "#d4af37" }}>
          <FaSpinner className="fa-spin" style={{ fontSize: "50px", marginBottom: "20px" }} />
          <p style={{ fontSize: "20px" }}>Loading stylist calendar schedule...</p>
        </div>
      ) : (
        <div 
          style={{ 
            maxWidth: "1400px", 
            margin: "0 auto", 
            display: "flex", 
            gap: "24px", 
            alignItems: "flex-start" 
          }}
          className="flex-col lg:flex-row"
        >
          
          {/* =========================
              CALENDAR ONLY VIEW
          ========================= */}
          <div 
            style={{ 
              flex: "1 1 63%", 
              minWidth: "300px", 
              boxShadow: rescheduleModeData ? "0 0 0 9999px rgba(0,0,0,0.6), 0 0 20px #d4af37" : "0 15px 40px rgba(0,0,0,0.6)", 
              position: "relative",
              zIndex: rescheduleModeData ? 50 : 1,
              borderRadius: "12px",
              transition: "all 0.3s ease"
            }}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[resourceTimeGridPlugin, interactionPlugin]}
              initialView="resourceTimeGridDay"
              resources={resources}
              events={events}
              selectable={true}
              editable={true}
              height="80vh"
              nowIndicator={false}
              allDaySlot={false}
              slotMinTime="09:00:00"
              slotMaxTime="33:00:00"
              scrollTime="09:00:00"
              slotDuration="00:15:00"
              slotLabelInterval="01:00:00"
              resourceAreaHeaderContent="Stylists"
              resourceAreaWidth="130px"
              datesSet={(arg) => {
                setTimeout(() => {
                  const titleEl = document.querySelector('.fc-toolbar-title');
                  if (titleEl) {
                    titleEl.setAttribute('data-custom-title', arg.view.currentStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
                  }
                }, 0);
              }}
              
              // Open booking form directly when slot is selected
              select={(info) => {
                  if (rescheduleModeData) {
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
                    return;
                  }

                setIsEditMode(false);
                setModalMode("appointment");
                setSelectedSlot(info);
                setOpenModal(true);
              }}

              // Click event to Edit / Delete
              eventClick={(info) => {
                if (rescheduleModeData || info.event.display === "background" || info.event.extendedProps?.isDuty) return;

                const b = info.event.extendedProps?.booking;
                if (!b) return;

                setIsEditMode(true);
                const currentMode = b.booking_source === "busy" || b.category === "Busy" ? "busy" : "appointment";
                setModalMode(currentMode);
                
                const relatedBookings = bookings.filter((other: any) => 
                  other.id !== b.id &&
                  b.group_id && other.group_id === b.group_id
                );

                setSelectedEvent({
                  id: String(b.id),
                  name: b.name || "",
                  phone: b.phone ? String(b.phone) : "",
                  category: b.category || "",
                  service_name: b.service_name || "",
                  staff_id: b.staff_id ? String(b.staff_id) : "",
                  payment_method: b.payment_method || "cash",
                  notes: b.notes || b.note || "",
                  appointment_date: b.appointment_date || "",
                  start_time: b.start_time || "",
                  end_time: b.end_time || "",
                  status: b.status || "confirmed",
                  booking_source: b.booking_source || "admin",
                  duration_minutes: b.duration_minutes || "",
                  total: b.total || 0,
                  payment_status: b.payment_status || "unpaid",
                  created_by: b.created_by || "admin",
                  service_id: b.service_id || "",
                  relatedBookings: relatedBookings,
                });
                setOpenModal(true);
              }}

              // Drag & Drop
              eventDrop={handleCalendarChange}

              // Resize
              eventResize={handleCalendarChange}

              // Custom render to show notes
              eventContent={(eventInfo) => {
                if (eventInfo.event.display === "background" || eventInfo.event.extendedProps?.isDuty) {
                  return null;
                }
                const b = eventInfo.event.extendedProps?.booking;
                const isBusy = b?.category === "Busy" || b?.booking_source === "busy";
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {eventInfo.event.title}
                    </div>
                    {!isBusy && (b?.notes || b?.note) && (
                      <div style={{ 
                        fontSize: '10px', 
                        marginTop: '2px', 
                        fontStyle: 'italic',
                        whiteSpace: 'normal',
                        lineHeight: 1.2,
                        opacity: 0.9,
                        borderTop: '1px dashed currentColor',
                        paddingTop: '2px'
                      }}>
                        📝 {b.notes || b.note}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>

          {/* =========================
              BOOKING SIDE PANEL
          ========================= */}
          <div 
            style={{ 
              flex: "1 1 35%", 
              minWidth: "350px", 
              height: "80vh" 
            }}
          >
            {openModal ? (
              <BookingModal
                open={openModal}
                onClose={() => {
                  setOpenModal(false);
                  setIsEditMode(false);
                  setSelectedEvent(null);
                  setSelectedSlot(null);
                }}
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
                services={services}
                editData={selectedEvent}
                isEditMode={isEditMode}
                mode={modalMode}
              />
            ) : (
              <div 
                style={{
                  background: "#071f17",
                  border: "1px solid rgba(223, 177, 91, 0.2)",
                  borderRadius: "12px",
                  padding: "40px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "#DDD3C4",
                  height: "80vh"
                }}
              >
                <FaCalendarWeek style={{ fontSize: "40px", color: "#d4af37", marginBottom: "15px" }} />
                <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#d4af37", marginBottom: "10px" }}>Scheduling Panel</h3>
                <p style={{ fontSize: "13px", color: "#9ca3af", maxWidth: "250px" }}>
                  Select an open time slot on the calendar or click an existing appointment to view, schedule, or update details in this panel.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}