"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { services as defaultCategories } from "@/components/serviceData";
import { Booking, Staff, Service } from "@/types";
import { FaTrash, FaPlus, FaClock, FaDollarSign, FaUser, FaPhone, FaCalendarAlt, FaBan, FaCheck, FaSpinner } from "react-icons/fa";
import { useModal } from "@/components/ModalContext";
import { useBranch } from "@/lib/BranchContext";

// Detailed duration mappings for all services (in minutes)
const serviceDurations: Record<string, number> = {
  // Hair
  "Haircut": 45,
  "Coloring": 120,
  "Protein": 180,
  "Hairspa": 60,
  
  // Massage
  "Full Body Relaxing Massage": 90,
  "Thai Massage": 60,
  "Hot Oil Massage": 60,
  "Deep Tissue Massage": 90,
  
  // Facial
  "Any Facial": 60,
  "Anti-aging Hydra Facial": 75,
  "Anti-ageing Hydra Facial": 75,
  "Premium Hydra Facial": 90,
  "Kanpeki Korean Facial": 90,
  
  // Spa
  "Footspa": 45,
  "Detox Mud Bath & Polish": 90,
  "Aromatherapy Wellness Spa": 75,
  "Organic Honey Body Scrub": 60,
  
  // Nails
  "Pedicure and Manicure": 90,
  "Pedicure": 45,
  "Manicure": 45,
  "Gel polish": 45,
  "Gel polish Removal": 30,
  "Gel extentions": 90,
  
  // Lashes
  "Classic Eyelash Extensions": 90,
  "Luxe Lash Lift & Tint": 60,
  "Volume Lash Extensions": 120,
};

function getDurationForService(serviceName: string): number {
  return serviceDurations[serviceName] || 30;
}

const TIME_OPTIONS: string[] = [];
// Standard hours (09:00 - 22:45)
for (let h = 9; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}
// Late night hours (23:00 - 23:45)
for (let h = 23; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}
// Early morning hours (00:00 - 08:45)
for (let h = 0; h < 9; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

const CustomTimePicker = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const getCurrentTimeString = () => {
    const now = new Date();
    const h = now.getHours();
    const m = Math.floor(now.getMinutes() / 15) * 15;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen && listRef.current) {
      const targetTime = value || getCurrentTimeString();
      const targetEl = listRef.current.querySelector(`[data-time="${targetTime}"]`) as HTMLElement;
      if (targetEl) {
        targetEl.scrollIntoView({ block: "center" });
      }
    }
  }, [isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        listRef.current && !listRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: rect.left });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const displayTime = value || getCurrentTimeString();

  return (
    <div className={`relative inline-block ${className || ""}`} ref={triggerRef}>
      <div 
        onClick={handleToggle}
        className="w-full h-full flex items-center justify-between cursor-pointer gap-1"
      >
        <span>{displayTime}</span>
        <svg width="14" height="14" className="w-3.5 h-3.5 text-[#3a4a35] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      {isOpen && coords && typeof document !== "undefined" && createPortal(
        <div 
          ref={listRef}
          className="fixed w-36 max-h-56 overflow-y-auto bg-white border border-[#e6dccb] rounded-xl shadow-2xl z-[9999] py-1 divide-y divide-gray-50 text-slate-800"
          style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
        >
          {TIME_OPTIONS.map(t => {
            const nowStr = getCurrentTimeString();
            const isNow = t === nowStr;
            const isSelected = value === t;
            return (
              <div 
                key={t}
                data-time={t}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(t);
                  setIsOpen(false);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(t);
                  setIsOpen(false);
                }}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between ${isSelected ? "bg-[#3a4a35] text-white" : isNow ? "bg-amber-50 text-[#c29957] font-bold" : "text-slate-700 hover:bg-[#f9f4ec]"}`}
              >
                <span>{t}</span>
                {isNow && <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#c29957]">NOW</span>}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

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
  "Anti-ageing Hydra Facial": 150,
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
  "Classic Eyelash Extensions": 200,
  "Luxe Lash Lift & Tint": 120,
  "Volume Lash Extensions": 240,
  "Detox Mud Bath & Polish": 320,
  "Aromatherapy Wellness Spa": 300,
  "Organic Honey Body Scrub": 220,
  "Any haircut": 25,
  "Beard setting": 25,
  "Kids haircut": 20,
  "Anyhaircut + beard setting + facescrub + facemask": 50,
  "Deep tissue massage": 120,
  "Relaxing massage": 90,
  "Thai massage": 100,
  "Signature massage": 150,
  "Foot massage": 60,
  "Men's Haircut": 25,
  "Beard Trim": 25,
  "Men's Massage": 120,
};

function getPriceForService(serviceName: string): number {
  if (!serviceName) return 0;
  if (servicePrices[serviceName] !== undefined) return servicePrices[serviceName];
  // Case insensitive lookup fallback
  const lowerName = serviceName.trim().toLowerCase();
  const foundKey = Object.keys(servicePrices).find(k => k.toLowerCase() === lowerName);
  return foundKey ? servicePrices[foundKey] : 0;
}

// Helper to calculate end time string HH:MM from start time and minutes
function calculateEndTimeStr(startTime: string, durationMinutes: number): string {
  if (!startTime) return "";
  const parts = startTime.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  
  const totalMinutes = h * 60 + m + durationMinutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export default function BookingModal({
  open,
  onClose,
  onSave,
  onCreate,
  onDelete,
  onReschedule,
  staff = [],
  services: initialServices = defaultCategories,
  selectedSlot,
  editData,
  isEditMode: initialIsEditMode,
  mode: initialMode = "appointment",
}: { open: boolean; onClose: () => void; onSave?: (data?: any, isEdit?: boolean) => any; onCreate?: (data?: any, keepOpen?: boolean) => any; onDelete?: (id: string | number) => void; onReschedule?: (id: string | number) => void; staff?: Staff[]; services?: any; selectedSlot?: any; editData?: Booking | null; isEditMode?: boolean; mode?: "appointment" | "busy" | "leave" | "break"; }) {
  const { showAlert, showConfirm } = useModal();
  const { currentBranch, currentCompanyId, companies, availableBranches } = useBranch();
  
  const activeCompanyObj = companies.find(c => String(c.id) === String(currentCompanyId));
  const companyName = activeCompanyObj?.name || (currentBranch === 'elan' ? 'Elan Salon' : 'Rospa Salon');
  const activeBranchObj = availableBranches.find(b => b.slug === currentBranch || String(b.company_id) === String(currentCompanyId));
  const branchDisplayName = activeBranchObj?.name || `${companyName} - Main Branch`;

  const [dbServices, setDbServices] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetch(`/api/services?branch=${currentBranch}`)
        .then(res => res.json())
        .then(data => {
           if (data.services) {
              const byCategory = data.services.reduce((acc: Record<string, any>, s: Service) => {
                 if (s.is_active === false) return acc;
                 const cat = s.category || "Uncategorized";
                 if (!acc[cat]) acc[cat] = [];
                 acc[cat].push({ name: s.name, price: s.price, duration_minutes: s.duration_minutes });
                 return acc;
              }, {});
              const mapped = Object.keys(byCategory).map(cat => ({
                 name: cat,
                 items: byCategory[cat]
              }));
              setDbServices(mapped);
           }
        })
        .catch(err => console.error("Error fetching services for modal:", err));
    }
  }, [currentBranch, open]);

  const services = dbServices.length > 0 ? dbServices : initialServices;
  const [isEditMode, setIsEditMode] = useState(initialIsEditMode);
  const [currentView, setCurrentView] = useState<"form" | "checkout" | "paid" | "invoice">("form");
  const [bookingType, setBookingType] = useState<"appointment" | "busy" | "leave" | "break">("appointment");
  const [customerName, setCustomerName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameArabic, setNameArabic] = useState("");
  const [phone, setPhone] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [bookingSource, setBookingSource] = useState("admin");
  const [createdBy, setCreatedBy] = useState("admin");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [tips, setTips] = useState<number>(0);
  const [tippedStaffId, setTippedStaffId] = useState<string>("");
  const [tipEntries, setTipEntries] = useState<Array<{ id: string; amount: number; staff_id: string }>>([
    { id: "tip-1", amount: 0, staff_id: "" }
  ]);
  const [sessionNumber, setSessionNumber] = useState<string>("");
  const [showArabicName, setShowArabicName] = useState(false);
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [openArabicDesc, setOpenArabicDesc] = useState<Record<string, boolean>>({});
  const serviceScrollRef = useRef<HTMLDivElement>(null);

  const scrollServices = (direction: 'left' | 'right') => {
    if (serviceScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      serviceScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Email Invoice State
  const [isEmailInvoiceModalOpen, setIsEmailInvoiceModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendInvoiceEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      showAlert("Invalid Email", "Please enter a valid email address.", "warning");
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recipientEmail,
          customerName: customerName || "Valued Customer",
          invoiceId: editData?.id ? `#INV-${editData.id}` : `#INV-${Date.now().toString().slice(-4)}`,
          appointmentDate: appointmentDate,
          services: selectedServices.map((s) => ({
            service_name: s.service_name || s.category || "Service",
            category: s.category || "Service",
            staff_name: staff.find((st) => String(st.id) === String(s.staff_id))?.name || "",
            price: Number(s.price) || 0,
          })),
          tips: totalTips,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          branch: currentBranch,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("Success", `Invoice sent successfully to ${recipientEmail}!`, "success");
        setIsEmailInvoiceModalOpen(false);
      } else {
        showAlert("Error", "Failed to send invoice email: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showAlert("Connection Error", "Server connection error while sending email", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const renderEmailInvoiceModal = () => {
    if (!isEmailInvoiceModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4 relative">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              ✉️ Send Invoice via Email
            </h3>
            <button
              type="button"
              onClick={() => setIsEmailInvoiceModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-lg font-bold"
            >
              ✕
            </button>
          </div>

          <div className="bg-[#fcfaf7] p-3 rounded-xl border border-[#e6dccb] space-y-1 text-xs">
            <p className="text-[#3a4a35] font-bold">
              Customer: <span className="text-slate-700 font-semibold">{customerName || "Valued Customer"}</span>
            </p>
            <p className="text-[#3a4a35] font-bold">
              Total Amount: <span className="text-[#c29957] font-bold">QR {Number(totalAmount).toFixed(2)}</span>
            </p>
            <p className="text-[#6b7f5e]">Date: {appointmentDate}</p>
          </div>

          <form onSubmit={handleSendInvoiceEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. customer@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#3a4a35] focus:bg-white font-medium transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmailInvoiceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingEmail}
                className="px-5 py-2 rounded-xl bg-[#3a4a35] hover:bg-[#2d3a29] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingEmail ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" /> Sending...
                  </>
                ) : (
                  "Send Invoice"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Issue Refund State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("Customer Dissatisfaction");
  const [refundNotes, setRefundNotes] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundAmount || refundAmount <= 0) {
      showAlert("Invalid Amount", "Please enter a valid refund amount.", "warning");
      return;
    }

    if (refundAmount > totalAmount) {
      showAlert("Amount Exceeded", `Refund amount cannot exceed total invoice amount (QR ${totalAmount}).`, "warning");
      return;
    }

    setIsProcessingRefund(true);
    try {
      const isFullRefund = refundAmount >= totalAmount;
      const finalPaymentStatus = isFullRefund ? "refunded" : "partially_refunded";
      const finalStatus = isFullRefund ? "cancelled" : (status || "confirmed");
      const fullReasonText = `${refundReason}${refundNotes ? ` - ${refundNotes}` : ""}`;
      const newTotal = Math.max(0, Number(totalAmount) - refundAmount);

      const refundPayload = {
        ...editData,
        payment_status: finalPaymentStatus,
        status: finalStatus,
        refund_amount: refundAmount,
        refund_reason: fullReasonText,
        total: newTotal,
        notes: `${notes || ""}\n[REFUNDED QR ${refundAmount}: ${fullReasonText}]`.trim(),
      };

      if (onSave) {
        await onSave(refundPayload);
      } else if (editData?.id) {
        const res = await fetch(`/api/bookings?id=${editData.id}&branch=${currentBranch}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_status: finalPaymentStatus,
            status: finalStatus,
            refund_amount: refundAmount,
            refund_reason: fullReasonText,
            total: newTotal,
            notes: `${notes || ""}\n[REFUNDED QR ${refundAmount}: ${fullReasonText}]`.trim(),
          }),
        });
        const data = await res.json();
        if (!data.success) {
          showAlert("Error", "Failed to update refund in database: " + (data.error || "Unknown error"), "error");
          return;
        }
      }

      showAlert("Refund Processed", `Successfully recorded refund of QR ${refundAmount.toFixed(2)} in database!`, "success");
      setIsRefundModalOpen(false);
      onClose();
    } catch {
      showAlert("Connection Error", "Server connection error processing refund", "error");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const renderRefundModal = () => {
    if (!isRefundModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4 relative">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              💰 Issue Refund & Deduct Revenue
            </h3>
            <button
              type="button"
              onClick={() => setIsRefundModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-lg font-bold"
            >
              ✕
            </button>
          </div>

          <div className="bg-red-50 p-3 rounded-xl border border-red-100 space-y-1 text-xs text-red-800">
            <p className="font-bold">
              Invoice Total: <span className="font-extrabold">QR {Number(totalAmount).toFixed(2)}</span>
            </p>
            <p className="text-[11px] text-red-700">
              Processing this refund will update database records and deduct QR {Number(refundAmount || 0).toFixed(2)} from total revenue calculations.
            </p>
          </div>

          <form onSubmit={handleConfirmRefund} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Refund Amount (QR) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={totalAmount}
                  step="0.01"
                  required
                  value={refundAmount || ""}
                  onChange={(e) => setRefundAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-500 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setRefundAmount(Number(totalAmount) || 0)}
                  className="px-3 py-2 bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-red-200 transition-colors cursor-pointer"
                >
                  Full (QR {Number(totalAmount).toFixed(2)})
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Refund *
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-500 font-medium mb-2"
              >
                <option value="Customer Dissatisfaction">Customer Dissatisfaction / Quality Complaint</option>
                <option value="Service Cancelled by Customer">Service Cancelled by Customer</option>
                <option value="Appointment Cancelled by Salon">Appointment Cancelled by Salon</option>
                <option value="Accidental Overcharge">Accidental Overcharge / Pricing Correction</option>
                <option value="Duplicate Payment">Duplicate Payment</option>
                <option value="Other">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Stylist ran 45 mins late, partial refund issued..."
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessingRefund}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingRefund ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" /> Processing...
                  </>
                ) : (
                  "Confirm & Deduct Refund"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Sync firstName/lastName with customerName
  useEffect(() => {
    setCustomerName(`${firstName} ${lastName}`.trim());
  }, [firstName, lastName]);
  
  // CRM Customer suggestions state
  const [crmSuggestions, setCrmSuggestions] = useState<{ name: string; phone: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFromCrm, setSelectedFromCrm] = useState(false);
  const [activeFocusedField, setActiveFocusedField] = useState<"name" | "phone" | null>(null);
  const crmSectionRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside CRM fields
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (crmSectionRef.current && !crmSectionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveFocusedField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-lookup existing customers from CRM by name or phone query
  useEffect(() => {
    if (isEditMode || currentView !== "form" || selectedFromCrm) return;
    
    const nameVal = `${firstName} ${lastName}`.trim();
    const query = activeFocusedField === "phone" ? (phone || nameVal) : (nameVal || phone);
    
    if (!query || query.length < 2 || !activeFocusedField) {
      setCrmSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/lookup?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.customers) && data.customers.length > 0) {
          setCrmSuggestions(data.customers);
          setShowSuggestions(true);
        } else {
          setCrmSuggestions([]);
          setShowSuggestions(false);
        }
      } catch(e) {
        console.error("Failed to lookup customer", e);
      }
    }, 250);
    return () => clearTimeout(delayFn);
  }, [firstName, lastName, phone, isEditMode, currentView, selectedFromCrm, activeFocusedField]);

  const handleSelectCustomer = (cust: { name: string; phone: string }) => {
    const parts = cust.name.trim().split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setPhone(cust.phone || "");
    setSelectedFromCrm(true);
    setShowSuggestions(false);
    setCrmSuggestions([]);
    setActiveFocusedField(null);
  };
  
  // Array of services for multi-service support
  const [selectedServices, setSelectedServices] = useState<any[]>([
    { id: 1, category: "", service_name: "", staff_id: "", price: 0, duration_minutes: 30 }
  ]);

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle opening and initializing modal data
  useEffect(() => {
    if (!open) return;
    setIsEditMode(initialIsEditMode);
    setErrorMsg("");
    setCurrentView("form");

    if (initialIsEditMode && editData) {
      if (editData.payment_status === "paid") {
        setCurrentView("paid");
      }
      
      const isLeave = editData.category === "Leave";
      const isBusy = editData.booking_source === "busy" || editData.category === "Busy";
      setBookingType(isLeave ? "leave" : (isBusy ? "busy" : "appointment"));
      setCustomerName(editData.name || "");
      const parts = (editData.name || "").trim().split(/\s+/);
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setPhone(editData.phone || "");
      setAppointmentDate(editData.appointment_date || "");
      setStartTime(editData.start_time ? editData.start_time.substring(0, 5) : "");
      setEndTime(editData.end_time ? editData.end_time.substring(0, 5) : "");
      setPaymentMethod(editData.payment_method || "cash");
      setPaymentStatus(editData.payment_status || "unpaid");
      setBookingSource(editData.booking_source || "admin");
      setCreatedBy(editData.created_by || "admin");
      setServiceId(editData.service_id ? String(editData.service_id) : "");
      
      const rawNotes = editData.notes || "";
      const sessionMatch = rawNotes.match(/\[Session (\d+)\]/);
      if (sessionMatch) {
        setSessionNumber(sessionMatch[1]);
        setNotes(rawNotes.replace(/\[Session \d+\]\s*/, ""));
      } else {
        setSessionNumber("");
        setNotes(rawNotes);
      }
      
      setStatus(editData.status || "confirmed");
      setTips(Number(editData.tips) || 0);
      setTippedStaffId(editData.tipped_staff_id ? String(editData.tipped_staff_id) : (editData.staff_id ? String(editData.staff_id) : ""));

      const primaryService = {
        id: editData.id,
        category: editData.category || "",
        service_name: editData.service_name || "",
        staff_id: editData.staff_id || "",
        price: editData.total || getPriceForService(editData.service_name || ""),
        duration_minutes: editData.duration_minutes || getDurationForService(editData.service_name || ""),
        start_time: editData.start_time ? editData.start_time.substring(0, 5) : "",
        notes: editData.notes || "",
      };

      const otherServices = (editData.relatedBookings || []).map((rb: Booking) => ({
        id: rb.id,
        category: rb.category || "",
        service_name: rb.service_name || "",
        staff_id: rb.staff_id || "",
        price: rb.total || getPriceForService(rb.service_name || ""),
        duration_minutes: rb.duration_minutes || getDurationForService(rb.service_name || ""),
        start_time: rb.start_time ? rb.start_time.substring(0, 5) : "",
        notes: rb.notes || "",
      }));

      setSelectedServices([primaryService, ...otherServices].sort((a: any, b: any) => {
        if (!a.start_time) return -1;
        if (!b.start_time) return 1;
        return a.start_time.localeCompare(b.start_time);
      }));
    } else {
      // Create mode
      setBookingType(initialMode || "appointment");
      setCustomerName("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setPaymentMethod("cash");
      setPaymentStatus("unpaid");
      setBookingSource("admin");
      setCreatedBy("admin");
      setServiceId("");
      setNotes("");
      setSessionNumber("");
      setStatus("confirmed");
      setTips(0);
      setTippedStaffId("");

      const dateStr = (selectedSlot as any)?.startStr?.split("T")[0] || new Date().toISOString().split("T")[0];
      const startStr = (selectedSlot as any)?.startStr?.split("T")[1]?.slice(0, 5) || "09:00";
      const endStr = (selectedSlot as any)?.endStr?.split("T")[1]?.slice(0, 5) || calculateEndTimeStr(startStr, 30);
      
      setAppointmentDate(dateStr);
      setStartTime(startStr);
      setEndTime(endStr);

      const prefilledStaffId = (selectedSlot as any)?.resource?.id ? String((selectedSlot as any).resource.id) : "";
      
      setSelectedServices([
        {
          id: Date.now(),
          category: "",
          service_name: "",
          staff_id: prefilledStaffId,
          price: 0,
          duration_minutes: 30
        }
      ]);
    }
  }, [open, selectedSlot, editData, initialMode]);

  // Recalculate end time when start time or services duration changes (only for appointments)
  useEffect(() => {
    if (bookingType === "busy" || bookingType === "leave") return;
    const totalDuration = selectedServices.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0);
    if (startTime && totalDuration > 0) {
      setEndTime(calculateEndTimeStr(startTime, totalDuration));
    }
  }, [startTime, selectedServices, bookingType]);

  if (!open) return null;

  const handleAddServiceRow = () => {
    // Try to copy stylist from previous row to make scheduling faster
    const lastStaffId = selectedServices.length > 0 ? selectedServices[selectedServices.length - 1].staff_id : "";
    setSelectedServices([
      ...selectedServices,
      {
        id: Date.now() + Math.random(),
        isNew: true,
        category: "",
        service_name: "",
        staff_id: lastStaffId,
        price: 0,
        duration_minutes: 30
      }
    ]);
  };

  const handleRemoveServiceRow = (id: number) => {
    if (selectedServices.length === 1) return;
    setSelectedServices(selectedServices.filter(s => s.id !== id));
  };

  const handleServiceFieldChange = (id: number, field: string, value: any) => {
    setSelectedServices(
      selectedServices.map((row) => {
        if (row.id !== id) return row;
        
        const updatedRow = { ...row, [field]: value };

        // If category changed, reset service selection
        if (field === "category") {
          updatedRow.service_name = "";
          updatedRow.price = 0;
          updatedRow.duration_minutes = 30;
        }

        // If service changed, update price and duration
        if (field === "service_name") {
          const catObj = services.find((c: any) => c.name === updatedRow.category);
          const itemObj = catObj?.items?.find((i: any) => i.name === value || i.bookingName === value);
          
          if (itemObj && itemObj.price !== undefined && itemObj.price !== null) {
            updatedRow.price = Number(itemObj.price);
            if (itemObj.duration_minutes) {
              updatedRow.duration_minutes = Number(itemObj.duration_minutes);
            }
          } else {
            updatedRow.price = getPriceForService(value);
            if (getDurationForService(value)) {
              updatedRow.duration_minutes = getDurationForService(value);
            }
          }
        }

        return updatedRow;
      })
    );
  };

  const totalTips = tipEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAmount = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0) + totalTips;
  const totalDuration = selectedServices.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0);

  const validateBooking = (skipTimeCheck: boolean = false) => {
    if (!customerName.trim()) {
      showAlert("Missing Information", "Customer Name is required.", "warning");
      return false;
    }
    const invalidService = selectedServices.some(s => !s.category || !s.service_name || !s.staff_id);
    if (invalidService) {
      showAlert("Missing Information", "Please select Category, Service, and Stylist for all service rows.", "warning");
      return false;
    }

    if (!skipTimeCheck) {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const todayStr = localToday.toISOString().split("T")[0];

      if (appointmentDate < todayStr) {
        showAlert("Invalid Date", "You cannot book an appointment for a past date.", "error");
        return false;
      }

      if (appointmentDate === todayStr) {
        const nowStr = today.toTimeString().slice(0, 5); // HH:MM in 24hr format
        if (startTime < nowStr) {
          showAlert("Invalid Time", `The start time (${startTime}) cannot be in the past for today. Current time is ${today.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`, "error");
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg("");

    if (bookingType === "busy" || bookingType === "leave") {
      const selectedStaffId = selectedServices[0]?.staff_id;
      if (!selectedStaffId) {
        showAlert("Missing Information", "Please select a Stylist.", "warning");
        return;
      }
      const isLeave = bookingType === "leave";
      setIsSubmitting(true);
      let res = null;
      if (onSave) res = await onSave({
        id: editData?.id,
        category: isLeave ? "Leave" : "Busy",
        name: isLeave ? "Staff Leave" : "Busy Block",
        phone: "",
        staff_id: selectedStaffId,
        appointment_date: appointmentDate,
        start_time: isLeave ? "00:00" : startTime,
        end_time: isLeave ? "23:59" : endTime,
        payment_method: "cash",
        notes: notes || (isLeave ? "Off Day" : "Busy Time"),
        status: "confirmed",
        booking_source: "busy",
        created_by: createdBy || "admin"
      });
      setIsSubmitting(false);
      if (res && !res.success) setErrorMsg(res.error);
      return;
    }

    if (!validateBooking(isEditMode)) return;

    const finalNotes = sessionNumber ? `[Session ${sessionNumber}] ${notes}`.trim() : notes;
    
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        // PATCH updates each booking row in the group
        for (let i = 0; i < selectedServices.length; i++) {
          const s = selectedServices[i];
          const previousDuration = selectedServices.slice(0, i).reduce((sum, prev) => sum + (Number(prev.duration_minutes) || 0), 0);
          const serviceStartTime = calculateEndTimeStr(startTime, previousDuration);

          if (s.isNew || !s.id || String(s.id).includes('.')) {
            if (onCreate) {
              const isLast = i === selectedServices.length - 1;
              const res = await onCreate({
                customer: { name: customerName, phone: phone },
                date: appointmentDate,
                time: serviceStartTime,
                end_time: calculateEndTimeStr(serviceStartTime, s.duration_minutes || 30),
                staff_id: s.staff_id,
                group_id: (editData as any)?.group_id || undefined,
                services: [{
                  category: s.category,
                  service: s.service_name,
                  staff: staff.find((st: Staff) => String(st.id) === String(s.staff_id))?.name || "",
                  price: Number(s.price) || 0,
                  duration_minutes: Number(s.duration_minutes) || 30,
                  start_time: serviceStartTime,
                  notes: s.notes || finalNotes,
                }],
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                notes: finalNotes,
                status: status,
                booking_source: bookingSource,
                created_by: createdBy,
                service_id: serviceId,
                tips: tips,
                tipped_staff_id: tippedStaffId,
              }, !isLast);
              if (res && !res.success) {
                setErrorMsg(res.error);
                break;
              }
            }
            continue;
          }
          let res = null;
          if (onSave) {
            const isLast = i === selectedServices.length - 1;
            res = await onSave({
              id: s.id,
              name: customerName,
              phone: phone,
              category: s.category,
              service_name: s.service_name,
              staff_id: s.staff_id,
              group_id: editData?.group_id || undefined, // undefined will not override existing
              appointment_date: appointmentDate,
              start_time: serviceStartTime,
              end_time: calculateEndTimeStr(serviceStartTime, s.duration_minutes || 30),
              payment_method: paymentMethod,
              payment_status: paymentStatus,
              notes: s.notes || finalNotes,
              total: Number(s.price) || 0,
              duration_minutes: Number(s.duration_minutes) || 30,
              status: status,
              booking_source: bookingSource,
              created_by: createdBy,
              service_id: serviceId,
              tips: tips,
              tipped_staff_id: tippedStaffId,
            }, !isLast);
          }
          if (res && !res.success) {
            setErrorMsg(res.error);
            break; // Stop if one fails
          }
        }
      } else {
        // POST supports inserting multiple service rows
        let res = null;
      if (onSave) res = await onSave({
          customer: {
            name: customerName,
            phone: phone,
          },
          date: appointmentDate,
          time: startTime,
          end_time: endTime,
          category: undefined,
          staff_id: selectedServices[0]?.staff_id,
          services: selectedServices.map((s, index) => {
            const previousDuration = selectedServices.slice(0, index).reduce((sum, prev) => sum + (Number(prev.duration_minutes) || 0), 0);
            const serviceStartTime = calculateEndTimeStr(startTime, previousDuration);
            return {
              category: s.category,
              service: s.service_name,
              staff: staff.find((st: Staff) => String(st.id) === String(s.staff_id))?.name || "",
              price: Number(s.price) || 0,
              duration_minutes: Number(s.duration_minutes) || 30,
              start_time: serviceStartTime,
              notes: s.notes,
            };
          }),
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          notes: finalNotes,
          status: status,
          booking_source: bookingSource,
          created_by: createdBy,
          service_id: serviceId,
          tips: tips,
          tipped_staff_id: tippedStaffId,
        });
        if (res && !res.success) setErrorMsg(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    if (!validateBooking(true)) return;
    const finalNotes = sessionNumber ? `[Session ${sessionNumber}] ${notes}`.trim() : notes;
    if (isEditMode) {
      setIsSubmitting(true);
      try {
        let finalSuccess = true;
        for (let i = 0; i < selectedServices.length; i++) {
          const s = selectedServices[i];
          const previousDuration = selectedServices.slice(0, i).reduce((sum, prev) => sum + (Number(prev.duration_minutes) || 0), 0);
          const serviceStartTime = calculateEndTimeStr(startTime, previousDuration);

          if (!s.id) {
            if (onCreate) {
              const res = await onCreate({
                customer: { name: customerName, phone: phone },
                date: appointmentDate,
                time: serviceStartTime,
                end_time: calculateEndTimeStr(serviceStartTime, s.duration_minutes || 30),
                staff_id: s.staff_id,
                group_id: editData?.group_id || undefined,
                services: [{
                  category: s.category,
                  service: s.service_name,
                  staff: staff.find((st: Staff) => String(st.id) === String(s.staff_id))?.name || "",
                  price: Number(s.price) || 0,
                  duration_minutes: Number(s.duration_minutes) || 30,
                  start_time: serviceStartTime,
                  notes: s.notes || finalNotes,
                }],
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                notes: finalNotes,
                status: "completed",
                booking_source: bookingSource,
                created_by: createdBy,
                service_id: serviceId,
                tips: tips,
                tipped_staff_id: tippedStaffId,
              });
              if (res && !res.success) {
                setErrorMsg(res.error);
                finalSuccess = false;
                break;
              }
            }
            continue;
          }
          
          let res = null;
      if (onSave) res = await onSave({
            id: s.id,
            name: customerName,
            phone: phone,
            category: s.category,
            service_name: s.service_name,
            staff_id: s.staff_id,
            group_id: editData?.group_id || undefined,
            appointment_date: appointmentDate,
            start_time: serviceStartTime,
            end_time: calculateEndTimeStr(serviceStartTime, s.duration_minutes || 30),
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            notes: s.notes || finalNotes,
            total: s.price,
            duration_minutes: s.duration_minutes,
            status: "completed",
            booking_source: bookingSource,
            created_by: createdBy,
            service_id: serviceId,
            tips: tips,
            tipped_staff_id: tippedStaffId,
          }, true); // true = keepOpen
          
          if (!res || !res.success) {
            setErrorMsg(res?.error || "Error saving");
            finalSuccess = false;
            break;
          }
        }
        
        if (finalSuccess) {
          setStatus("completed");
          setCurrentView("checkout"); // Auto-switch to checkout or just show checkout button
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleArrivedAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    if (!validateBooking(true)) return;
    const finalNotes = sessionNumber ? `[Session ${sessionNumber}] ${notes}`.trim() : notes;
    if (isEditMode) {
      setIsSubmitting(true);
      try {
        let finalSuccess = true;
        for (let i = 0; i < selectedServices.length; i++) {
          const s = selectedServices[i];
          if (!s.id) continue;
          
          const previousDuration = selectedServices.slice(0, i).reduce((sum, prev) => sum + (Number(prev.duration_minutes) || 0), 0);
          const serviceStartTime = calculateEndTimeStr(startTime, previousDuration);
          
          let res = null;
      if (onSave) res = await onSave({
            id: s.id,
            name: customerName,
            phone: phone,
            category: s.category,
            service_name: s.service_name,
            staff_id: s.staff_id,
            appointment_date: appointmentDate,
            start_time: serviceStartTime,
            end_time: calculateEndTimeStr(serviceStartTime, s.duration_minutes || 30),
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            notes: s.notes || finalNotes,
            total: Number(s.price) || 0,
            duration_minutes: Number(s.duration_minutes) || 30,
            status: "arrived",
            booking_source: bookingSource,
            created_by: createdBy,
            service_id: serviceId,
            tips: tips,
            tipped_staff_id: tippedStaffId,
          }, true); // true = keepOpen
          
          if (!res || !res.success) {
            setErrorMsg(res?.error || "Error saving");
            finalSuccess = false;
            break;
          }
        }
        
        if (finalSuccess) {
          setStatus("arrived");
          if (onClose) onClose();
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCheckoutAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    if (!validateBooking(true)) return;
    const finalNotes = sessionNumber ? `[Session ${sessionNumber}] ${notes}`.trim() : notes;
    if (isEditMode) {
      setIsSubmitting(true);
      try {
        let finalSuccess = true;
        for (let i = 0; i < selectedServices.length; i++) {
          const s = selectedServices[i];
          if (!s.id) continue;
          
          const previousDuration = selectedServices.slice(0, i).reduce((sum, prev) => sum + (Number(prev.duration_minutes) || 0), 0);
          const serviceStartTime = calculateEndTimeStr(startTime, previousDuration);
          
          let res = null;
      if (onSave) res = await onSave({
            id: s.id,
            name: customerName,
            phone: phone,
            category: s.category,
            service_name: s.service_name,
            staff_id: s.staff_id,
            appointment_date: appointmentDate,
            start_time: serviceStartTime,
            end_time: calculateEndTimeStr(serviceStartTime, s.duration_minutes || 30),
            payment_method: paymentMethod,
            payment_status: "paid", // Force to paid
            notes: finalNotes,
            total: s.price,
            duration_minutes: s.duration_minutes,
            status: "completed", // Force to completed
            booking_source: bookingSource,
            created_by: createdBy,
            service_id: serviceId,
            tips: tips,
            tipped_staff_id: tippedStaffId,
          }, true); // true = keepOpen
          
          if (!res || !res.success) {
            setErrorMsg(res?.error || "Error saving");
            finalSuccess = false;
            break;
          }
        }
        
        if (finalSuccess) {
          setPaymentStatus("paid");
          setStatus("completed");
          setCurrentView("paid");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };


  // ==========================================
  // VIEW: CHECKOUT
  // ==========================================
  if (currentView === "checkout") {
    const totalAmount = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0) + tips;
    return (
      <div className="w-full h-full flex flex-col bg-transparent font-sans shadow-2xl rounded-2xl overflow-hidden" style={{ background: "white", color: "#1e293b" }}>
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{customerName}</h2>
            <p className="text-sm text-gray-500">{phone}</p>
            <p className="text-xs text-gray-400 mt-2">Appointment - {appointmentDate}, {startTime}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
            {selectedServices.map((row, i) => (
              <div key={i} className="p-4 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span className="w-2 h-4 bg-teal-500 rounded-sm block"></span>
                    {row.service_name || row.category}
                  </div>
                  <div className="text-xs text-gray-500 ml-4 mt-1">
                    {staff.find((s: Staff) => String(s.id) === String(row.staff_id))?.name || "No Staff"}
                  </div>
                </div>
                <div className="font-medium text-sm text-slate-700">QR{row.price}</div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-100 rounded-xl p-4 flex justify-between items-center text-sm font-medium">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked readOnly className="accent-teal-600 rounded" />
              Appointment complete
            </label>
            <button className="text-teal-600 hover:underline">Add promo code</button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <button className="underline">Add note or discount</button>
            <span>Tax QR0</span>
          </div>

          {/* Tip / Gratuity Section */}
          <div className="mb-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Add Tip / Gratuity</label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500">QR</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={tips || ""}
                  onChange={(e) => setTips(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#5b51d8] transition-colors"
                />
              </div>
            </div>
            {tips > 0 && (
              <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-200/60">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Staff:</span>
                <select
                  value={tippedStaffId}
                  onChange={(e) => setTippedStaffId(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 rounded-lg p-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#5b51d8]"
                >
                  <option value="">Select staff receiving tip</option>
                  {staff.map((st: Staff) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Method</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold border ${
                  paymentMethod === "cash" 
                    ? "border-[#5b51d8] bg-[#5b51d8]/10 text-[#5b51d8]" 
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold border ${
                  paymentMethod === "card" 
                    ? "border-[#5b51d8] bg-[#5b51d8]/10 text-[#5b51d8]" 
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                💳 Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("fawran")}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold border ${
                  paymentMethod === "fawran" 
                    ? "border-[#5b51d8] bg-[#5b51d8]/10 text-[#5b51d8]" 
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                📱 Fawran
              </button>
            </div>
          </div>
          <button
            onClick={handleCheckoutAndSave}
            style={{ backgroundColor: "#eab308", color: "#0a1f12" }}
            className="w-full hover:bg-yellow-600 text-[#0a1f12] font-bold py-4 rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 text-base tracking-wide uppercase cursor-pointer"
          >
            Checkout QR {totalAmount}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: PAID APPOINTMENT
  // ==========================================
  if (currentView === "paid") {
    const totalAmount = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0) + tips;
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent font-sans">
        <div className="flex flex-col bg-white text-slate-800 rounded-2xl w-[400px] max-w-full shadow-2xl relative border border-gray-100">
          <div className="flex justify-between items-start p-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-[#5b51d8]">{customerName}</h2>
              <p className="text-sm text-[#5b51d8]/80">{phone}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="font-semibold text-slate-700 text-sm">
              {selectedServices.map(s => `${s.service_name || s.category} (${s.duration_minutes} mins)`).join(", ")} <br/>
              <span className="text-gray-500">(QAR {totalAmount})</span>
            </div>
            
            <div className="mt-2">
              <button 
                onClick={() => {
                  setAppointmentDate("");
                  setStartTime("");
                  setEndTime("");
                  setIsEditMode(false);
                  setPaymentStatus("unpaid");
                  setStatus("confirmed");
                  setSelectedServices([{ id: Date.now(), category: "", service_name: "", staff_id: "", price: 0, duration_minutes: 30 }]);
                  setTips(0);
                  setCurrentView("form");
                }} 
                className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-[#5b51d8] flex justify-center items-center gap-2"
              >
                📅 Book next
              </button>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="w-4 flex justify-center">📝</span> Add note
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="w-4 flex justify-center">👤</span> {staff.find((s: Staff) => String(s.id) === String(selectedServices[0]?.staff_id))?.name || "No Staff"}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="w-4 flex justify-center">🕒</span> {startTime} - {endTime}, {appointmentDate}
              </div>
            </div>
            
            <div className="flex mt-4">
              <div className="w-full py-2.5 text-sm font-bold text-green-700 bg-green-100/80 rounded-md text-center flex items-center justify-center gap-2">
                <span className="text-lg leading-none">✓</span> Completed
              </div>
            </div>
            
            <button onClick={() => setCurrentView("invoice")} className="w-full py-3 bg-[#f0f0fa] text-[#5b51d8] font-bold rounded-lg hover:bg-[#e4e4f5] transition-colors mt-2">
              View Invoice
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: INVOICE / RECEIPT
  // ==========================================
  if (currentView === "invoice") {
    const totalAmount = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0) + tips;
    return (
      <div className="w-full h-full flex flex-col bg-white text-slate-800 rounded-xl overflow-hidden shadow-2xl font-sans">
        <div className="flex-1 overflow-y-auto p-10 bg-white">
          <div className="max-w-[900px] mx-auto bg-white p-8 relative print:shadow-none print:border-none print:w-full print:p-0">
            
            {/* INVOICE HEADER */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-serif text-slate-800 mb-2">{companyName}</h1>
                <div className="inline-block bg-slate-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {branchDisplayName}
                </div>
              </div>
              <div className="text-right">
                <button onClick={() => setCurrentView(paymentStatus === "paid" ? "paid" : "form")} className="text-[#5b51d8] hover:text-[#4a41b5] text-sm font-semibold flex items-center gap-1 justify-end print:hidden">
                  <span className="text-lg leading-none">&lsaquo;</span> Back to calendar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <p className="text-gray-500 mb-1">Invoice to:</p>
                <p className="font-semibold text-slate-800">{customerName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xl text-gray-500 mb-4">Tax invoice #INV-{Math.floor(Math.random() * 10000).toString().padStart(5, '0')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold tracking-wider uppercase mb-1">INVOICE DATE</p>
                  <p className="text-sm text-slate-800">{appointmentDate}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-500 font-bold tracking-wider uppercase mb-1">DUE DATE</p>
                   <p className="text-sm text-slate-800">{appointmentDate}</p>
                </div>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="border-b border-gray-200 pb-2 mb-2">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-semibold text-slate-800 w-[10%]">Staff</th>
                    <th className="pb-3 font-semibold text-slate-800 w-[10%]">Account</th>
                    <th className="pb-3 font-semibold text-slate-800 w-[15%]">Type</th>
                    <th className="pb-3 font-semibold text-slate-800 w-[35%]">Description</th>
                    <th className="pb-3 font-semibold text-slate-800 text-center w-[10%]">Quantity</th>
                    <th className="pb-3 font-semibold text-slate-800 text-right w-[10%]">Unit price</th>
                    <th className="pb-3 font-semibold text-slate-800 text-center w-[5%]">Tax</th>
                    <th className="pb-3 font-semibold text-slate-800 text-right w-[15%]">Total QAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedServices.map((row, i) => {
                    const staffName = staff.find((s: Staff) => String(s.id) === String(row.staff_id))?.name || "-";
                    return (
                      <tr key={i} className="align-top">
                        <td className="py-4">
                          <span className="inline-block bg-slate-600 text-white text-[10px] px-2 py-0.5 rounded-full">{staffName}</span>
                        </td>
                        <td className="py-4 text-gray-600">Revenue</td>
                        <td className="py-4 text-gray-600">Appointment</td>
                        <td className="py-4 text-slate-800 pr-4">
                          {row.service_name || row.category} with {staffName} at {branchDisplayName} on {new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'})} from {startTime} to {endTime} 📅
                        </td>
                        <td className="py-4 text-gray-600 text-center">1.0</td>
                        <td className="py-4 text-gray-600 text-right">QR{Number(row.price).toFixed(2)}</td>
                        <td className="py-4 text-gray-600 text-center">N/A</td>
                        <td className="py-4 text-slate-800 text-right font-medium">QR{Number(row.price).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {tips > 0 && (
                     <tr className="align-top">
                        <td className="py-4">
                          <span className="inline-block bg-slate-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                            {staff.find((st: Staff) => String(st.id) === String(tippedStaffId || selectedServices[0]?.staff_id))?.name || "-"}
                          </span>
                        </td>
                        <td className="py-4 text-gray-600">Revenue</td>
                        <td className="py-4 text-gray-600">Tip / Gratuity</td>
                        <td className="py-4 text-slate-800 pr-4">
                          Staff Tip for {staff.find((st: Staff) => String(st.id) === String(tippedStaffId || selectedServices[0]?.staff_id))?.name || "Stylist"}
                        </td>
                        <td className="py-4 text-gray-600 text-center">1.0</td>
                        <td className="py-4 text-gray-600 text-right">QR{Number(tips).toFixed(2)}</td>
                        <td className="py-4 text-gray-600 text-center">N/A</td>
                        <td className="py-4 text-slate-800 text-right font-medium">QR{Number(tips).toFixed(2)}</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* TOTALS */}
            <div className="flex justify-end mb-8">
              <div className="w-80 border-b border-gray-300 pb-4">
                <div className="flex justify-between text-sm text-gray-600 py-2">
                  <span>Includes tax of</span>
                  <span>QR0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 py-3 border-y-2 border-slate-800 my-1">
                  <span>TOTAL QAR</span>
                  <span>QR{Number(totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 py-2">
                  <span className="pl-4">Less amount paid</span>
                  <span>QR{paymentStatus === "paid" ? Number(totalAmount).toFixed(2) : "0.00"}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-800 py-2 mt-2">
                  <span>Amount due</span>
                  <span>QR{paymentStatus === "paid" ? "0.00" : Number(totalAmount).toFixed(2)}</span>
                </div>
                {paymentStatus === "paid" && (
                   <div className="flex justify-end mt-4">
                     <span className="inline-block bg-[#417637] text-white text-xs font-bold px-3 py-1 rounded shadow-sm">
                       ✔ Invoice paid in full
                     </span>
                   </div>
                )}
              </div>
            </div>

            {/* PAYMENTS */}
            {paymentStatus === "paid" && (
               <div className="mb-12">
                 <h3 className="font-semibold text-slate-800 mb-2">Payments</h3>
                 <div className="border-t border-gray-200 pt-2 text-sm text-gray-600">
                   <ul className="list-disc pl-5">
                     <li>
                       {appointmentDate} | QR{Number(totalAmount).toFixed(2)} | {paymentMethod === 'card' ? 'Credit card' : 'Cash'} | Processed by Admin | <span onClick={async () => {
                        showConfirm("Void Payment", "Are you sure you want to void this payment?", async () => {
                          if (onSave) { await onSave({ ...editData, payment_status: "unpaid" }); }
                          onClose();
                        }, "danger");
                      }} className="text-[#5b51d8] hover:underline cursor-pointer">Void</span>
                     </li>
                   </ul>
                 </div>
               </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="border-t border-gray-200 pt-6 flex justify-between items-center print:hidden">
              <div className="flex gap-3">
                <button onClick={() => setCurrentView("form")} className="bg-[#5b51d8] text-white px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-[#4a41b5] transition-colors flex items-center gap-2">
                  📝 Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const eData = editData as any;
                    if (eData?.email || eData?.customer_email) {
                      setRecipientEmail(eData.email || eData.customer_email);
                    }
                    setIsEmailInvoiceModalOpen(true);
                  }}
                  className="bg-white border border-gray-300 text-slate-700 px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  ✉️ Email invoice
                </button>
                <button onClick={() => window.print()} className="bg-white border border-gray-300 text-slate-700 px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                  🖨️ Print
                </button>
              </div>
              <div className="flex gap-3">
                {paymentStatus === "paid" && (
                  <button
                    type="button"
                    onClick={() => {
                      setRefundAmount(Number(totalAmount) || 0);
                      setRefundReason("Customer Dissatisfaction");
                      setRefundNotes("");
                      setIsRefundModalOpen(true);
                    }}
                    className="bg-white border border-gray-300 text-slate-700 px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Issue refund
                  </button>
                )}
                <button onClick={() => {
                  showConfirm("Void Invoice", "Are you sure you want to void this invoice? This will mark the booking as unpaid but keep the appointment active.", async () => {
                    if (onSave) { await onSave({ ...editData, payment_status: "unpaid" }); }
                    onClose();
                  }, "warning");
                }} className="bg-[#b93838] text-white px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-[#9d2e2e] transition-colors">
                  Void
                </button>
              </div>
            </div>

          </div>
        </div>
        {renderEmailInvoiceModal()}
        {renderRefundModal()}
      </div>
    );
  }

  // ==========================================
  // VIEW: FORM (Default)
  // ==========================================
  return (
    <div className="w-full h-full flex flex-col bg-transparent font-sans">
      <div 
        style={{
          background: "#f9f4ec",
          color: "#3a4a35",
          boxShadow: "0 32px 80px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
          border: "1px solid #e6dccb",
        }}
        className="w-full h-full rounded-xl overflow-hidden flex flex-col relative backdrop-blur-xl"
      >
        {/* HEADER & SWITCH TABS */}
        <div className="border-b border-[#e6dccb] bg-white/50 px-5 py-3.5 flex flex-row items-center justify-between gap-4">
          <h2 className="text-base font-bold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #c29957, #e0ca9c, #c29957)", backgroundSize: "200% auto" }}>
            {isEditMode ? "Edit Appointment" : "Schedule Appointment"}
          </h2>
          
          <div className="flex items-center gap-3">
            {!isEditMode && (
              <div className="flex bg-white border border-[#e6dccb] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setBookingType("appointment")}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${bookingType === "appointment" ? "bg-[#3a4a35] text-white shadow-sm" : "text-[#6b7f5e] hover:text-[#3a4a35]"}`}
                >
                  Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType("busy")}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${bookingType === "busy" ? "bg-[#3a4a35] text-white shadow-sm" : "text-[#6b7f5e] hover:text-[#3a4a35]"}`}
                >
                  Busy Blocker
                </button>
              </div>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="text-[#6b7f5e] hover:text-[#3a4a35] font-bold text-base p-1 transition-all cursor-pointer"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* SCROLLABLE FORM CONTENT */}
        <form 
          onSubmit={handleSubmit} 
          className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          
          {/* APPOINTMENT FORM DETAILS */}
          {bookingType === "appointment" ? (
            <>
              {/* CRM Customer Fields Wrapper with Click-Outside Listener */}
              <div ref={crmSectionRef} className="flex flex-col gap-3">
                {/* Row 1: Full Name */}
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2 sm:gap-3 items-start pb-3 border-b border-[#e6dccb] relative">
                  <div className="text-[#c29957] text-xs font-bold uppercase tracking-wider text-left pt-1.5">
                    Full Name
                  </div>
                  <div className="space-y-2 relative">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full">
                      <div className="flex-1 min-w-[130px]">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={firstName}
                          onFocus={() => setActiveFocusedField("name")}
                          onChange={(e) => {
                            setSelectedFromCrm(false);
                            setFirstName(e.target.value);
                          }}
                          className="w-full bg-white/80 border border-[#e6dccb] rounded-md px-3 py-1.5 text-[#3a4a35] placeholder-[#6b7f5e]/50 text-xs focus:outline-none focus:border-[#c29957] focus:bg-white transition-all font-medium shadow-sm"
                        />
                        <span className="text-[9px] text-[#6b7f5e] mt-0.5 block">First Name</span>
                      </div>
                      <div className="flex-1 min-w-[130px]">
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={lastName}
                          onFocus={() => setActiveFocusedField("name")}
                          onChange={(e) => {
                            setSelectedFromCrm(false);
                            setLastName(e.target.value);
                          }}
                          className="w-full bg-white/80 border border-[#e6dccb] rounded-md px-3 py-1.5 text-[#3a4a35] placeholder-[#6b7f5e]/50 text-xs focus:outline-none focus:border-[#c29957] focus:bg-white transition-all font-medium shadow-sm"
                        />
                        <span className="text-[9px] text-[#6b7f5e] mt-0.5 block">Last Name</span>
                      </div>

                      <div className="flex-1 min-w-[130px]">
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="الاسم بالعربية (Name Arabic)"
                          value={nameArabic}
                          onChange={(e) => setNameArabic(e.target.value)}
                          className="w-full bg-white/80 border border-[#e6dccb] rounded-md px-3 py-1.5 text-[#3a4a35] placeholder-[#6b7f5e]/50 text-xs focus:outline-none focus:border-[#c29957] focus:bg-white transition-all font-arabic font-medium shadow-sm"
                        />
                        <span className="text-[9px] text-[#6b7f5e] mt-0.5 block">Name (Arabic)</span>
                      </div>
                    </div>

                    {/* CRM Autocomplete Dropdown for Name Field */}
                    {activeFocusedField === "name" && showSuggestions && crmSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#c29957] rounded-xl shadow-2xl z-50 p-2 space-y-1">
                        <div className="px-2 py-1 text-[10px] font-bold text-[#c29957] uppercase tracking-wider bg-[#f9f4ec] rounded flex items-center justify-between">
                          <span>⚡ Previously Booked Customers</span>
                          <span className="text-[9px] text-[#6b7f5e] font-normal">Click to auto-fill</span>
                        </div>
                        <div className="max-h-36 overflow-y-auto divide-y divide-[#e6dccb]/50">
                          {crmSuggestions.map((cust, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectCustomer(cust)}
                              className="p-2 hover:bg-[#f9f4ec] cursor-pointer rounded transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <FaUser className="text-[#c29957] text-xs" />
                                <span className="text-xs font-bold text-[#3a4a35]">{cust.name}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6b7f5e]">
                                <FaPhone className="text-[9px] text-[#c29957]" />
                                <span>{cust.phone}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Phone & Date */}
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2 sm:gap-3 items-start pb-3 border-b border-[#e6dccb] relative">
                  <div className="text-[#c29957] text-xs font-bold uppercase tracking-wider text-left pt-1.5">
                    Phone & Date
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full">
                    {/* PHONE FIELD */}
                    <div className="flex-1 min-w-[150px] relative">
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={phone}
                        onFocus={() => setActiveFocusedField("phone")}
                        onChange={(e) => {
                          const val = e.target.value;
                          const numeric = val.replace(/\D/g, "");
                          setSelectedFromCrm(false);
                          setPhone(numeric);
                        }}
                        className="w-full bg-white/80 border border-[#e6dccb] rounded-md px-3 py-1.5 text-[#3a4a35] placeholder-[#6b7f5e]/50 text-xs focus:outline-none focus:border-[#c29957] focus:bg-white transition-all font-medium shadow-sm"
                      />
                      <span className="text-[9px] text-[#6b7f5e] mt-0.5 block">Phone Number</span>

                      {/* CRM Autocomplete Dropdown for Phone Field */}
                      {activeFocusedField === "phone" && showSuggestions && crmSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#c29957] rounded-xl shadow-2xl z-50 p-2 space-y-1">
                          <div className="px-2 py-1 text-[10px] font-bold text-[#c29957] uppercase tracking-wider bg-[#f9f4ec] rounded flex items-center justify-between">
                            <span>⚡ Previously Booked Customers</span>
                            <span className="text-[9px] text-[#6b7f5e] font-normal">Click to auto-fill</span>
                          </div>
                          <div className="max-h-36 overflow-y-auto divide-y divide-[#e6dccb]/50">
                            {crmSuggestions.map((cust, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleSelectCustomer(cust)}
                                className="p-2 hover:bg-[#f9f4ec] cursor-pointer rounded transition-colors flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <FaUser className="text-[#c29957] text-xs" />
                                  <span className="text-xs font-bold text-[#3a4a35]">{cust.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6b7f5e]">
                                  <FaPhone className="text-[9px] text-[#c29957]" />
                                  <span>{cust.phone}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DATE FIELD */}
                    <div className="flex-1 min-w-[130px]">
                      <input
                        type="date"
                        required
                        value={appointmentDate}
                        onClick={(e) => "showPicker" in e.target && (e.target as HTMLInputElement).showPicker()}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full bg-white/80 border border-[#e6dccb] rounded-md px-3 py-1.5 text-[#3a4a35] text-xs focus:outline-none focus:border-[#c29957] focus:bg-white transition-all cursor-pointer font-medium shadow-sm"
                      />
                      <span className="text-[9px] text-[#6b7f5e] mt-0.5 block">Appointment Date</span>
                    </div>

                    {/* TIME FIELD (EDIT MODE) */}
                    {isEditMode && (
                      <div className="w-28 sm:w-32 flex-shrink-0">
                        <CustomTimePicker
                          value={startTime}
                          onChange={(val) => setStartTime(val)}
                          className="w-full bg-white/80 border border-[#e6dccb] rounded-md px-3 py-1.5 text-[#3a4a35] text-xs focus:outline-none focus:border-[#c29957]"
                        />
                        <span className="text-[9px] text-[#6b7f5e] mt-0.5 block">Start Time</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>



              {/* Row 4: Service required */}
              <div className="flex flex-col gap-2.5 pb-3 border-b border-[#e6dccb]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#c29957] text-xs font-bold uppercase tracking-wider">Service required</span>
                    <button
                      type="button"
                      onClick={handleAddServiceRow}
                      className="text-[#c29957] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all shadow-sm cursor-pointer"
                    >
                      + Add Service
                    </button>
                  </div>
                  {/* Sleek Scroll Arrows */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollServices('left')}
                      className="w-5 h-5 rounded-full bg-white border border-[#e6dccb] text-[#c29957] hover:bg-[#d4af37] hover:text-white flex items-center justify-center text-[9px] transition-all shadow-sm cursor-pointer"
                      title="Scroll Left"
                    >
                      ◄
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollServices('right')}
                      className="w-5 h-5 rounded-full bg-white border border-[#e6dccb] text-[#c29957] hover:bg-[#d4af37] hover:text-white flex items-center justify-center text-[9px] transition-all shadow-sm cursor-pointer"
                      title="Scroll Right"
                    >
                      ►
                    </button>
                  </div>
                </div>
                <div 
                  ref={serviceScrollRef}
                  className="flex flex-col w-full max-h-[220px] overflow-auto border border-[#e6dccb] bg-white/50 rounded-lg p-2.5 shadow-inner [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex flex-col gap-2.5 min-w-max">
                    {selectedServices.map((row, index) => {
                      const qualifiedStylists = staff.filter((s: Staff) => {
                        if (!row.service_name) return true;
                        if (!s.services || !Array.isArray(s.services) || s.services.length === 0) return true;
                        
                        const serviceNameLower = row.service_name.trim().toLowerCase();
                        const categoryLower = row.category ? row.category.trim().toLowerCase() : "";
                        
                        return s.services.some((serv: string) => {
                          if (typeof serv !== 'string') return false;
                          const servLower = serv.trim().toLowerCase();
                          if (servLower === serviceNameLower) return true;
                          if (categoryLower) {
                            if (servLower === categoryLower) return true;
                            if ((categoryLower === "hair care" || categoryLower === "hair") && (servLower === "hair care" || servLower === "hair")) return true;
                            if ((categoryLower === "nails & spa" || categoryLower === "nails") && (servLower === "nails & spa" || servLower === "nails")) return true;
                          }
                          return false;
                        });
                      });
                      const finalStylists = qualifiedStylists.length > 0 ? qualifiedStylists : staff;
                      const hasNotes = Boolean(openNotes[row.id] || row.notes);
                      const hasArabicDesc = Boolean(openArabicDesc[row.id]);

                      return (
                        <div 
                          key={row.id} 
                          className="flex flex-nowrap items-center gap-2 pb-2.5 border-b border-[#e6dccb]/60 last:border-b-0 last:pb-0 relative"
                        >
                        {/* CATEGORY */}
                        <div className="w-24 sm:w-28 flex-shrink-0">
                          <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5">Category</label>
                          <select
                            value={row.category}
                            onChange={(e) => handleServiceFieldChange(row.id, "category", e.target.value)}
                            className="w-full bg-white border border-[#e6dccb] rounded-md px-2 py-1 text-[#3a4a35] text-xs focus:outline-none focus:border-[#c29957] font-medium"
                          >
                            <option value="" className="bg-white">Select Category</option>
                            {services.map((cat: any) => (
                              <option key={cat.name} value={cat.name} className="bg-white">
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* SERVICE SELECT */}
                        <div className="w-28 sm:w-36 flex-shrink-0">
                          <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5">Service</label>
                          <select
                            value={row.service_name}
                            onChange={(e) => handleServiceFieldChange(row.id, "service_name", e.target.value)}
                            className="w-full bg-white border border-[#e6dccb] rounded-md px-2 py-1 text-[#3a4a35] text-xs focus:outline-none focus:border-[#c29957] font-medium text-ellipsis overflow-hidden whitespace-nowrap"
                          >
                            <option value="" className="bg-white">Select Service</option>
                            {row.category &&
                              services
                                .find((c: any) => c.name === row.category)
                                ?.items.map((item: any) => (
                                  <option key={item.name} value={item.bookingName || item.name} className="bg-white">
                                    {item.name}
                                  </option>
                                ))}
                          </select>
                        </div>

                        {/* STYLIST */}
                        <div className="w-24 sm:w-28 flex-shrink-0">
                          <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5">Stylist</label>
                          <select
                            value={row.staff_id}
                            onChange={(e) => handleServiceFieldChange(row.id, "staff_id", e.target.value)}
                            className="w-full bg-white border border-[#e6dccb] rounded-md px-2 py-1 text-[#3a4a35] text-xs focus:outline-none focus:border-[#c29957] font-medium"
                          >
                            <option value="" className="bg-white">Select Stylist</option>
                            {finalStylists.map((st: Staff) => (
                              <option key={st.id} value={String(st.id)} className="bg-white">
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* SCHEDULED TIME */}
                        {!isEditMode && (
                          <div className="flex flex-col flex-shrink-0">
                            <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5">Time</label>
                            <div className="flex items-center gap-1 text-[11px] text-[#6b7f5e] bg-white border border-[#e6dccb] px-2 py-1 rounded-md">
                              <span className="font-semibold text-[#3a4a35] text-[10px]">Sched:</span>
                              {index === 0 ? (
                                <div className="flex items-center gap-1">
                                  <CustomTimePicker
                                    value={startTime}
                                    onChange={(val) => setStartTime(val)}
                                    className="text-[#3a4a35] font-semibold"
                                  />
                                  <span className="text-[#3a4a35] font-semibold text-[11px]">- {calculateEndTimeStr(startTime, row.duration_minutes || 0)}</span>
                                </div>
                              ) : (
                                <span className="font-semibold text-[#3a4a35] text-[11px]">
                                  {(() => {
                                    const previousDuration = selectedServices.slice(0, index).reduce((sum, prev) => sum + (Number(prev.duration_minutes) || 0), 0);
                                    const start = calculateEndTimeStr(startTime, previousDuration);
                                    const end = calculateEndTimeStr(start, row.duration_minutes || 0);
                                    return `${start} - ${end}`;
                                  })()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* DURATION */}
                        <div className="flex flex-col flex-shrink-0">
                          <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5">Duration</label>
                          <div className="flex items-center gap-1 text-xs text-[#3a4a35] bg-white border border-[#e6dccb] px-2 py-1 rounded-md">
                            <input 
                              type="number" 
                              min="0"
                              value={Math.floor((row.duration_minutes || 0) / 60)} 
                              onChange={(e) => handleServiceFieldChange(row.id, "duration_minutes", (Number(e.target.value) || 0) * 60 + ((row.duration_minutes || 0) % 60))}
                              className="w-7 bg-transparent text-[#3a4a35] font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[#6b7f5e] text-[10px] font-semibold">h</span>
                            <input 
                              type="number" 
                              min="0"
                              max="59"
                              value={(row.duration_minutes || 0) % 60} 
                              onChange={(e) => handleServiceFieldChange(row.id, "duration_minutes", Math.floor((row.duration_minutes || 0) / 60) * 60 + (Number(e.target.value) || 0))}
                              className="w-8 bg-transparent text-[#3a4a35] font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[#6b7f5e] text-[10px] font-semibold">m</span>
                          </div>
                        </div>

                        {/* PRICE */}
                        <div className="flex flex-col flex-shrink-0">
                          <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5">Price</label>
                          <div className="flex items-center gap-1 text-xs text-[#3a4a35] bg-white border border-[#e6dccb] px-2 py-1 rounded-md">
                            <span className="text-[#c29957] font-bold text-[10px]">QR</span>
                            <input 
                              type="number" 
                              value={row.price} 
                              onChange={(e) => handleServiceFieldChange(row.id, "price", Number(e.target.value) || 0)}
                              className="w-12 bg-transparent text-[#3a4a35] font-bold focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        {/* NOTES BUTTON / FIELD */}
                        {hasNotes ? (
                          <div className="w-28 sm:w-32 flex-shrink-0">
                            <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5">Notes</label>
                            <input
                              type="text"
                              autoFocus
                              placeholder="Notes..."
                              value={row.notes || ""}
                              onChange={(e) => handleServiceFieldChange(row.id, "notes", e.target.value)}
                              onBlur={(e) => {
                                if (!e.target.value || !e.target.value.trim()) {
                                  setOpenNotes(prev => ({ ...prev, [row.id]: false }));
                                }
                              }}
                              className="w-full bg-white border border-[#e6dccb] rounded-md px-2 py-1 text-[#3a4a35] text-xs focus:outline-none focus:border-[#c29957] placeholder-[#6b7f5e]/40 font-medium"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col justify-end flex-shrink-0">
                            <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5 opacity-0 select-none">Notes</label>
                            <button
                              type="button"
                              onClick={() => setOpenNotes(prev => ({ ...prev, [row.id]: true }))}
                              className="text-[#c29957] hover:text-[#3a4a35] text-[10px] font-bold uppercase border border-[#c29957]/40 bg-[#d4af37]/5 px-2 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer"
                            >
                              + Note
                            </button>
                          </div>
                        )}



                        {/* REMOVE BUTTON */}
                        {(!isEditMode || row.isNew) && selectedServices.length > 1 && (
                          <div className="flex flex-col justify-end flex-shrink-0">
                            <label className="block text-[9px] font-bold text-[#c29957] uppercase tracking-wider mb-0.5 opacity-0 select-none">Del</label>
                            <button
                              type="button"
                              onClick={() => handleRemoveServiceRow(row.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 transition-colors cursor-pointer"
                              title="Remove service"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        )}

                        {row.service_name?.toLowerCase().includes("premium hydra facial") && (
                          <div className="w-28">
                            <select
                              value={sessionNumber}
                              onChange={(e) => setSessionNumber(e.target.value)}
                              className="w-full bg-white border border-[#e6dccb] rounded-md px-2 py-1 text-[#3a4a35] text-xs focus:outline-none focus:border-[#c29957]"
                            >
                              <option value="">Session...</option>
                              <option value="1">Session 1</option>
                              <option value="2">Session 2</option>
                              <option value="3">Session 3</option>
                              <option value="4">Session 4</option>
                              <option value="5">Session 5</option>
                              <option value="6">Session 6</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>






              {/* Row 6: Tips */}
              <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2 sm:gap-3 items-start pb-3 border-b border-[#e6dccb]">
                <div className="flex flex-col items-start gap-1 pt-1">
                  <span className="text-[#c29957] text-xs font-bold uppercase tracking-wider text-left">Tips</span>
                  <button
                    type="button"
                    onClick={() => setTipEntries((prev) => [...prev, { id: `tip-${Date.now()}`, amount: 0, staff_id: "" }])}
                    className="text-[#c29957] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap"
                  >
                    + Add Tip
                  </button>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {tipEntries.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-white border border-[#e6dccb] px-2 py-1 rounded-md">
                        <span className="text-[#c29957] font-bold text-[10px]">QR</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.amount || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setTipEntries((prev) =>
                              prev.map((t) => (t.id === item.id ? { ...t, amount: val } : t))
                            );
                            setTips(val);
                          }}
                          placeholder="0"
                          className="w-14 bg-transparent text-[#3a4a35] font-bold text-xs focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[#6b7f5e] text-[10px] font-semibold">For:</span>
                        <select
                          value={item.staff_id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTipEntries((prev) =>
                              prev.map((t) => (t.id === item.id ? { ...t, staff_id: val } : t))
                            );
                            setTippedStaffId(val);
                          }}
                          className="bg-white border border-[#e6dccb] rounded-md px-2 py-1 text-[#3a4a35] text-xs focus:outline-none focus:border-[#c29957] font-medium"
                        >
                          <option value="" className="bg-white">Select staff for tip</option>
                          {staff.map((st: Staff) => (
                            <option key={st.id} value={st.id} className="bg-white">
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {tipEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTipEntries((prev) => prev.filter((t) => t.id !== item.id))}
                          className="text-red-500 hover:text-red-700 p-1 transition-colors cursor-pointer"
                          title="Remove tip"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact Total Duration & Est. Total Summary Pill under Tips */}
              <div className="flex items-center justify-between gap-3 bg-white/90 border border-[#e6dccb] rounded-lg px-3.5 py-1.5 shadow-sm my-2 max-w-full overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs text-[#3a4a35]">
                  <span className="text-[#6b7f5e] font-semibold text-[11px]">Total Duration:</span>
                  <span className="bg-[#f9f4ec] text-[#3a4a35] border border-[#e6dccb] px-2 py-0.5 rounded font-bold text-xs">
                    {Math.floor(totalDuration / 60) > 0 ? `${Math.floor(totalDuration / 60)}h ` : ""}
                    {totalDuration % 60}m
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#c29957] uppercase tracking-wider">Est. Total:</span>
                  <span className="text-[#c29957] font-bold text-sm tracking-wide bg-[#d4af37]/10 border border-[#d4af37]/30 px-2.5 py-0.5 rounded">
                    QR {totalAmount}
                  </span>
                </div>
              </div>


            </>
          ) : (
            /* BUSY / LEAVE TIME FORM DETAILS */
            <div className={`border border-dashed rounded-lg p-4 space-y-4 ${bookingType === "leave" ? "bg-red-500/10 border-red-500/30" : "bg-black/10 border-white/30"}`}>
              {bookingType === "leave" && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold border border-red-200 flex items-center gap-2 mb-2">
                  <FaBan className="text-red-500 shrink-0" />
                  This will mark the staff member as ON LEAVE for the specified time. No appointments can be booked during this time.
                </div>
              )}
              <h3 className={`text-sm font-semibold flex items-center gap-2 border-b pb-2 ${bookingType === "leave" ? "text-red-700 border-red-200" : "text-[#3a4a35] border-[#e6dccb]"}`}>
                {bookingType === "leave" ? "Staff Leave Details" : "Stylist Calendar Block Details"}
              </h3>
              
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${bookingType === "leave" ? "text-red-700" : "text-[#3a4a35]/80"}`}>
                  Select Stylist to {bookingType === "leave" ? "mark on Leave" : "Block"}
                </label>
                <select
                  required
                  value={selectedServices[0]?.staff_id || ""}
                  onChange={(e) => handleServiceFieldChange(selectedServices[0]?.id, "staff_id", e.target.value)}
                  className="w-full bg-[#8a8a8a] border border-white/40 rounded p-2 text-white text-xs focus:outline-none focus:border-white"
                >
                  <option value="" className="bg-gray-700">Select Stylist</option>
                  {staff.map((st: Staff) => (
                    <option key={st.id} value={String(st.id)} className="bg-gray-700">
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${bookingType === "leave" ? "text-red-700" : "text-[#3a4a35]/80"}`}>
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onClick={(e) => "showPicker" in e.target && (e.target as HTMLInputElement).showPicker()}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className={`w-full bg-transparent border border-dashed rounded p-2 text-xs focus:outline-none cursor-pointer ${bookingType === "leave" ? "border-red-400 text-red-900 focus:border-red-600" : "border-white/60 text-[#3a4a35] focus:border-white"}`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${bookingType === "leave" ? "text-red-700" : "text-[#3a4a35]/80"}`}>Start Time</label>
                    <CustomTimePicker
                      value={startTime}
                      onChange={(val) => setStartTime(val)}
                      className={`w-full bg-white/70 border border-dashed rounded p-2 text-xs focus:outline-none ${bookingType === "leave" ? "border-red-400 text-red-900 focus:border-red-600" : "border-[#e6dccb] text-[#3a4a35] focus:border-[#c29957]"}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${bookingType === "leave" ? "text-red-700" : "text-[#3a4a35]/80"}`}>End Time</label>
                    <CustomTimePicker
                      value={endTime}
                      onChange={(val) => setEndTime(val)}
                      className={`w-full bg-white/70 border border-dashed rounded p-2 text-xs focus:outline-none ${bookingType === "leave" ? "border-red-400 text-red-900 focus:border-red-600" : "border-[#e6dccb] text-[#3a4a35] focus:border-[#c29957]"}`}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${bookingType === "leave" ? "text-red-700" : "text-[#3a4a35]/80"}`}>
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={bookingType === "leave" ? "e.g., Sick leave, Vacation..." : "e.g., Lunch break, Client meeting..."}
                  className={`w-full bg-transparent border border-dashed rounded p-2 text-xs focus:outline-none resize-none ${bookingType === "leave" ? "border-red-400 text-red-900 focus:border-red-600 placeholder-red-400/50" : "border-white/60 text-[#3a4a35] focus:border-white placeholder-white/50"}`}
                  rows={2}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-3 rounded-lg text-sm mb-4 mx-8 font-medium">
              {errorMsg}
            </div>
          )}

        </form>

        {/* BOTTOM ACTION BAR */}
        <div className="border-t border-[#e6dccb] bg-[#f9f4ec] shrink-0 z-20 px-5 py-3 flex flex-col justify-center items-center gap-2">
          <div className="flex gap-2.5 w-full max-w-md justify-center flex-wrap">
            {status !== "completed" && (
              <button
                type={isEditMode ? "button" : "submit"}
                onClick={(e) => {
                  if (isEditMode && onReschedule) {
                    e.preventDefault();
                    if (onReschedule) onReschedule(editData as any);
                  } else {
                    handleSubmit(e);
                  }
                }}
                style={{
                  background: "linear-gradient(135deg, #d4af37 0%, #f5e6a8 50%, #d4af37 100%)",
                  backgroundSize: "200% 200%",
                  color: "#0a1f12",
                }}
                className="flex-1 min-w-[110px] font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider hover:-translate-y-0.5 shadow-md"
              >
                {isEditMode ? "Reschedule" : "Submit"}
              </button>
            )}
            
            {isEditMode && bookingType === "appointment" && (
              <>
                {status !== "completed" && paymentStatus !== "paid" && (
                  <>
                    {status !== "arrived" && (
                      <button
                        type="button"
                        onClick={handleArrivedAndSave}
                        style={{
                          backgroundColor: "transparent",
                          color: "#166534",
                          border: "1.5px solid #166534",
                        }}
                        className="flex-1 min-w-[120px] hover:bg-green-800/10 font-bold text-sm py-3 px-4 rounded-[14px] transition-all cursor-pointer text-center uppercase tracking-wider"
                      >
                        Arrived
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCompleteAndSave}
                      style={{
                        backgroundColor: "transparent",
                        color: "#d4af37",
                        border: "1.5px solid #d4af37",
                      }}
                      className="flex-1 min-w-[120px] hover:bg-[#d4af37]/10 font-bold text-sm py-3 px-4 rounded-[14px] transition-all cursor-pointer flex justify-center items-center gap-2 uppercase tracking-wider"
                    >
                      <FaCheck /> Complete
                    </button>
                  </>
                )}
                
                {status === "completed" && paymentStatus !== "paid" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentView("invoice")}
                      style={{
                        backgroundColor: "transparent",
                        color: "#fff",
                        border: "1.5px solid #fff",
                      }}
                      className="flex-1 min-w-[120px] hover:bg-white/80 font-bold text-sm py-3 px-4 rounded-[14px] transition-all cursor-pointer text-center uppercase tracking-wider"
                    >
                      View Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView("checkout")}
                      style={{
                        backgroundColor: "#eab308",
                        color: "#0a1f12",
                        border: "1.5px solid #eab308",
                      }}
                      className="flex-1 min-w-[120px] hover:bg-yellow-600 font-bold text-sm py-3 px-4 rounded-[14px] transition-all cursor-pointer text-center uppercase tracking-wider shadow-md"
                    >
                      Checkout
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="flex w-full justify-between items-center text-xs pt-2 border-t border-[#e6dccb]">
            {isEditMode && onDelete && status !== "completed" ? (
              bookingType === "appointment" ? (
                <button
                  type="button"
                  onClick={() => {
                    showConfirm("Cancel Booking", "Are you sure you want to cancel this booking? It will remain in the ledger as cancelled.", async () => {
                      if (onSave) {
                        if (onSave) { await onSave({ ...editData, status: "cancelled" }); }
                      }
                      onClose();
                    }, "danger");
                  }}
                  className="text-red-300 hover:text-red-600 font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <FaBan /> Cancel Booking
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { if (editData && editData.id && onDelete) onDelete(editData.id); }}
                  className="text-red-300 hover:text-red-600 font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <FaTrash /> Delete Block
                </button>
              )
            ) : <div />}
            
            {isEditMode && status !== "completed" ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-green-600 hover:text-green-700 font-extrabold uppercase tracking-widest text-sm transition-all cursor-pointer bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-5 py-2.5 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-red-600 hover:text-red-700 font-extrabold uppercase tracking-widest text-sm transition-all cursor-pointer bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-5 py-2.5 rounded-xl shadow-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>      {renderEmailInvoiceModal()}
      {renderRefundModal()}
    </div>
  );
}