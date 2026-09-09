"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FaCheckCircle, FaCalendarAlt, FaUser, FaCut, FaSpinner } from "react-icons/fa";

function WidgetContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");
  
  const [step, setStep] = useState(1);
  const [companySettings, setCompanySettings] = useState<any>(null);
  
  // Data States
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Selection States
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  // Form States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Initialize and load basic data
  useEffect(() => {
    if (!companyId) {
      setErrorMsg("Missing company ID");
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        const [settingsRes, servicesRes, staffRes] = await Promise.all([
          fetch(`/api/companies/settings?companyId=${companyId}`),
          fetch(`/api/widget/services?companyId=${companyId}`),
          fetch(`/api/widget/staff?companyId=${companyId}`)
        ]);

        const settingsData = await settingsRes.json();
        const servicesData = await servicesRes.json();
        const staffData = await staffRes.json();

        if (settingsData.success) setCompanySettings(settingsData.settings || {});
        if (servicesData.success) setServices(servicesData.services || []);
        if (staffData.success) setStaffList(staffData.staff || []);
      } catch (err) {
        console.error("Failed to load widget data", err);
        setErrorMsg("Failed to load booking widget.");
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [companyId]);

  // Load availability when date and staff change
  useEffect(() => {
    if (selectedStaff && selectedDate) {
      const fetchAvailability = async () => {
        try {
          const res = await fetch(`/api/widget/availability?companyId=${companyId}&staff=${selectedStaff.name}&date=${selectedDate}`);
          const data = await res.json();
          if (data.success) {
            setAvailableSlots(data.availableSlots || []);
          }
        } catch (err) {
          console.error("Failed to fetch slots", err);
        }
      };
      fetchAvailability();
    }
  }, [selectedStaff, selectedDate, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    
    try {
      const payload = {
        company_id: companyId,
        customer: { name: customerName, phone: customerPhone },
        date: selectedDate,
        time: selectedTime,
        payment: "cash",
        notes: notes,
        services: [{
          category: selectedService.category,
          service: selectedService.service,
          staff: selectedStaff.name,
          price: selectedService.price,
          duration_minutes: selectedService.duration || 30
        }]
      };

      const res = await fetch("/api/widget/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setErrorMsg(data.error || "Failed to submit booking");
      }
    } catch (err: any) {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-transparent"><FaSpinner className="animate-spin text-4xl text-gray-400" /></div>;
  }

  if (errorMsg && !companyId) {
    return <div className="p-8 text-center text-red-500 font-semibold">{errorMsg}</div>;
  }

  const primaryColor = companySettings?.primary_color || "#d4af37";
  const logoUrl = companySettings?.logo_url || null;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-xl shadow-lg border border-gray-100">
        <FaCheckCircle className="text-6xl mb-4" style={{ color: primaryColor }} />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-6">Thank you, {customerName}. We look forward to seeing you on {selectedDate} at {selectedTime}.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-lg text-white font-semibold shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-xl border border-gray-100 min-h-[500px] flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-full border border-gray-200" />
        ) : (
          <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner" style={{ backgroundColor: primaryColor }}>
            W
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-800">Book Appointment</h1>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: SERVICE */}
      {step === 1 && (
        <div className="flex-1 animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaCut style={{ color: primaryColor }} /> Select a Service
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {services.map((s) => (
              <div 
                key={s.id} 
                onClick={() => { setSelectedService(s); setStep(2); }}
                className="p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-gray-300 group bg-gray-50 hover:bg-white"
                style={{ borderColor: selectedService?.id === s.id ? primaryColor : undefined, backgroundColor: selectedService?.id === s.id ? `${primaryColor}10` : undefined }}
              >
                <div className="font-semibold text-gray-800 group-hover:text-black">{s.service}</div>
                <div className="text-sm text-gray-500 mt-1 flex justify-between">
                  <span>{s.duration} mins</span>
                  <span className="font-bold text-gray-700">QR {s.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: STAFF & DATE */}
      {step === 2 && (
        <div className="flex-1 animate-fadeIn flex flex-col gap-6">
          <button onClick={() => setStep(1)} className="text-sm font-medium hover:underline self-start flex items-center gap-1" style={{ color: primaryColor }}>
            &larr; Back to Services
          </button>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FaUser style={{ color: primaryColor }} /> Select Staff
            </h2>
            <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
              {staffList.map((staff) => (
                <div 
                  key={staff.id} 
                  onClick={() => setSelectedStaff(staff)}
                  className="flex-shrink-0 flex flex-col items-center p-3 w-28 border rounded-lg cursor-pointer transition-all bg-white hover:shadow-md"
                  style={{ borderColor: selectedStaff?.id === staff.id ? primaryColor : '#e5e7eb', backgroundColor: selectedStaff?.id === staff.id ? `${primaryColor}10` : 'white' }}
                >
                  <div className="h-14 w-14 rounded-full bg-gray-200 mb-2 overflow-hidden border-2" style={{ borderColor: selectedStaff?.id === staff.id ? primaryColor : 'transparent' }}>
                    {staff.profile_picture ? (
                      <img src={staff.profile_picture} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 font-bold">{staff.name.charAt(0)}</div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-center text-gray-800">{staff.name}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedStaff && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FaCalendarAlt style={{ color: primaryColor }} /> Choose Date & Time
              </h2>
              <input 
                type="date" 
                className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white text-gray-800 mb-4"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
              />

              {selectedDate && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {availableSlots.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-4 italic text-sm">No slots available on this date.</div>
                  ) : (
                    availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); setStep(3); }}
                        className="py-2 px-1 text-sm border rounded-md font-medium transition-colors hover:shadow-sm"
                        style={{ 
                          backgroundColor: selectedTime === time ? primaryColor : 'white',
                          color: selectedTime === time ? 'white' : '#374151',
                          borderColor: selectedTime === time ? primaryColor : '#e5e7eb'
                        }}
                      >
                        {time}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: DETAILS */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="flex-1 animate-fadeIn flex flex-col h-full">
          <button type="button" onClick={() => setStep(2)} className="text-sm font-medium hover:underline self-start mb-6" style={{ color: primaryColor }}>
            &larr; Back to Time Selection
          </button>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100 flex justify-between items-center text-sm">
            <div>
              <p className="font-semibold text-gray-800">{selectedService.service}</p>
              <p className="text-gray-500">{selectedDate} at {selectedTime} with {selectedStaff.name}</p>
            </div>
            <div className="font-bold text-lg text-gray-800">QR {selectedService.price}</div>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 bg-white text-black placeholder-gray-400"
                placeholder="Jane Doe"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 bg-white text-black placeholder-gray-400"
                placeholder="+974 5555 1234"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 bg-white text-black placeholder-gray-400 resize-none h-24"
                placeholder="Any special requests?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 mt-6"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? "Confirming..." : "Confirm Booking"}
          </button>
        </form>
      )}

      {/* Progress Dots */}
      {!success && (
        <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-gray-50">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${step === i ? 'w-6' : 'w-2 opacity-30'}`}
              style={{ backgroundColor: primaryColor }}
            />
          ))}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}} />
    </div>
  );
}

export default function WidgetPage() {
  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans">
      <Suspense fallback={<div className="flex justify-center p-10"><FaSpinner className="animate-spin text-3xl text-gray-400" /></div>}>
        <WidgetContent />
      </Suspense>
    </div>
  );
}
