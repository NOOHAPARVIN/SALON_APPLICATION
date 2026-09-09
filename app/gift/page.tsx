"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function GiftPage() {
  const router = useRouter();
  const branch = "rospa"; // Public site defaults to rospa
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    service_id: "",
    service_name: "",
    price: 0,
    purchaser_name: "",
    purchaser_phone: "",
    recipient_name: "",
    recipient_phone: "",
    message: "",
    date: "",
    time: "",
    staff_id: "",
    staff_name: "",
  });

  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    const savedData = localStorage.getItem("giftFormData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        localStorage.removeItem("giftFormData");
      } catch (err) {
        console.error("Failed to parse saved form data", err);
      }
    }
  }, []);

  useEffect(() => {
    const ts = new Date().getTime();
    fetch(`/api/services?branch=${branch}&t=${ts}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.services) {
          setServices(data.services.filter((s: any) => s.is_active));
        }
      })
      .catch((err) => console.error("Failed to fetch services", err));

    fetch(`/api/staff?branch=${branch}&t=${ts}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.staff) {
          setStaffList(data.staff);
        }
      })
      .catch((err) => console.error("Failed to fetch staff", err));
  }, [branch]);

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = services.find((s) => s.id === Number(e.target.value));
    if (selected) {
      setFormData({
        ...formData,
        service_id: e.target.value,
        service_name: selected.name,
        price: selected.price,
      });
    } else {
      setFormData({ ...formData, service_id: "", service_name: "", price: 0 });
    }
  };

  const [isTimeOpen, setIsTimeOpen] = useState(false);

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    
    // Convert to local time string safely for comparison
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const isToday = formData.date === today;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let h = 9; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (isToday) {
          if (h < currentHour || (h === currentHour && m <= currentMinute)) {
            continue; // Skip past times today
          }
        }
        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        slots.push({ value: `${hour}:${minute}`, label: `${hour}.${minute}` });
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        localStorage.setItem("giftFormData", JSON.stringify(formData));
        router.push("/login?next=/gift");
        return;
      }

      const res = await fetch("/api/gift/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, branch }),
      });
      const data = await res.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Failed to process request");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#faf6f0] text-[var(--color-text-main)] min-h-screen pt-32 pb-64 px-5 font-['Montserrat']">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-['Playfair_Display'] text-[var(--color-text-main)] mb-4">
            Send a Gift
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto font-light">
            Surprise someone special with a luxury salon experience. Select a service, schedule their appointment, and we'll deliver the gift straight to their WhatsApp!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* LEFT: FORM */}
          <div className="w-full lg:w-1/2 bg-white rounded-3xl p-8 shadow-[0_5px_15px_rgba(0,0,0,0.03)] border border-[var(--color-border)]">
            <h2 className="text-2xl font-['Playfair_Display'] text-[var(--color-gold)] mb-6 border-b border-[var(--color-gold)]/20 pb-4">
              Gift Details & Scheduling
            </h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Select a Service *</label>
                <select
                  required
                  value={formData.service_id}
                  onChange={handleServiceChange}
                  className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
                >
                  <option value="">-- Choose a Luxury Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - QR {s.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Appointment Time *</label>
                  <div 
                    onClick={() => setIsTimeOpen(!isTimeOpen)}
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors cursor-pointer flex justify-between items-center"
                  >
                    <span className={formData.time ? "text-black" : "text-gray-500"}>
                      {formData.time ? timeSlots.find(s => s.value === formData.time)?.label || formData.time : "Select Time"}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                  {isTimeOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto top-full left-0">
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.value}
                          onClick={() => {
                            setFormData({ ...formData, time: slot.value });
                            setIsTimeOpen(false);
                          }}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${formData.time === slot.value ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] font-bold' : ''}`}
                        >
                          {slot.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Preferred Stylist (Optional)</label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => {
                    const staff = staffList.find(s => String(s.id) === String(e.target.value));
                    setFormData({ ...formData, staff_id: e.target.value, staff_name: staff?.name || "" });
                  }}
                  className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
                >
                  <option value="">Any Available Stylist</option>
                  {staffList.filter(s => s.services?.some((srv: string) => srv.toLowerCase() === formData.service_name.toLowerCase() || srv.toLowerCase() === (services.find(svc => svc.id === Number(formData.service_id))?.category?.toLowerCase() || ""))).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.purchaser_name}
                    onChange={(e) => setFormData({ ...formData, purchaser_name: e.target.value })}
                    placeholder="e.g. Sarah"
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Your WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.purchaser_phone}
                    onChange={(e) => setFormData({ ...formData, purchaser_phone: e.target.value.replace(/\D/g, "") })}
                    placeholder="e.g. +974 5555 1234"
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Recipient's Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    placeholder="e.g. Emma"
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Recipient's WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.recipient_phone}
                    onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value.replace(/\D/g, "") })}
                    placeholder="e.g. +974 5555 5678"
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Wishful Message (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Add a special message for the recipient..."
                  className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors resize-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !formData.service_id || !formData.date || !formData.time}
                  className="w-full bg-[var(--color-gold)] text-white font-bold text-lg py-4 rounded-full shadow-[0_4px_15px_rgba(197,160,89,0.3)] hover:bg-[#b08d4b] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? "Processing..." : `Purchase & Schedule Gift (QR ${formData.price})`}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-2">
                  🔒 Secure online payment via Stripe
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT: GIFT CARD PREVIEW */}
          <div className="w-full lg:w-1/2 sticky top-32">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">
              Gift Card Preview
            </h2>
            
            <div className="relative w-full aspect-[1.6/1] rounded-[2rem] overflow-hidden shadow-2xl group border-[8px] border-white">
              {/* Background Image */}
              <Image 
                src="/images/8.jpeg" 
                alt="Luxury Salon" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent backdrop-blur-[2px]" />
              
              {/* Card Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-between text-white border-2 border-[var(--color-gold)]/40 m-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <h3 className="font-['Playfair_Display'] text-3xl font-bold text-[var(--color-gold)]">
                    Gift Card
                  </h3>
                  <div className="w-12 h-12 rounded-full border border-[var(--color-gold)] flex items-center justify-center text-xl">
                    🎀
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[var(--color-gold)] text-xs uppercase tracking-widest font-bold mb-1">A Gift For</p>
                    <p className="font-['Playfair_Display'] text-2xl">
                      {formData.recipient_name || "Someone Special"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-[var(--color-gold)] text-xs uppercase tracking-widest font-bold mb-1">The Experience</p>
                    <p className="font-['Montserrat'] text-lg font-light">
                      {formData.service_name || "Any Luxury Service"}
                    </p>
                  </div>

                  {formData.message && (
                    <div className="italic text-sm text-gray-300 border-l-2 border-[var(--color-gold)] pl-3 line-clamp-2">
                      "{formData.message}"
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end border-t border-white/20 pt-4">
                  <div>
                    <p className="text-[var(--color-gold)] text-[10px] uppercase tracking-widest font-bold mb-1">From</p>
                    <p className="font-['Playfair_Display'] text-lg">
                      {formData.purchaser_name || "You"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--color-gold)] text-[10px] uppercase tracking-widest font-bold mb-1">Code</p>
                    <p className="font-mono text-sm tracking-widest">
                      {formData.service_name ? "GIFT-XXXX-XXXX" : "--------------"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6 max-w-sm mx-auto">
              This digital gift card will be sent directly to {formData.recipient_name || "the recipient"}'s WhatsApp instantly after purchase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
