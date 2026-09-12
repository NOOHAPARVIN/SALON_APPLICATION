"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./BookingForm.module.css";
import { FaCheckCircle, FaExclamationCircle, FaUserPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_SERVICES = [
  { id: 5, name: "Haircut", category: "Hair Care", price: 100 },
  { id: 6, name: "Coloring", category: "Hair Care", price: 250 },
  { id: 7, name: "Protein", category: "Hair Care", price: 350 },
  { id: 8, name: "Hairspa", category: "Hair Care", price: 150 },
  { id: 51, name: "Haircut & Styling", category: "Hair Care", price: 120 },
  { id: 52, name: "Premium Hair Coloring", category: "Hair Care", price: 300 },
  { id: 53, name: "Keratin Protein Treatment", category: "Hair Care", price: 400 },
  { id: 54, name: "Glamour Blow Dry", category: "Hair Care", price: 80 },
  { id: 19, name: "Manicure", category: "Nails & Spa", price: 60 },
  { id: 18, name: "Pedicure", category: "Nails & Spa", price: 70 },
  { id: 20, name: "Pedicure and Manicure", category: "Nails & Spa", price: 100 },
  { id: 21, name: "Gel polish", category: "Nails & Spa", price: 80 },
  { id: 23, name: "Gel extentions", category: "Nails & Spa", price: 200 },
  { id: 22, name: "Gel polish Removal", category: "Nails & Spa", price: 30 },
  { id: 55, name: "Luxury Manicure", category: "Nails & Spa", price: 70 },
  { id: 56, name: "Premium Spa Pedicure", category: "Nails & Spa", price: 60 },
  { id: 57, name: "Creative Nail Art", category: "Nails & Spa", price: 50 },
  { id: 17, name: "Footspa", category: "Nails & Spa", price: 80 },
  { id: 13, name: "Any Facial", category: "Facials", price: 180 },
  { id: 14, name: "Anti-aging Hydra Facial", category: "Facials", price: 250 },
  { id: 15, name: "Premium Hydra Facial", category: "Facials", price: 220 },
  { id: 16, name: "Kanpeki Korean Facial", category: "Facials", price: 280 },
  { id: 9, name: "Full Body Relaxing Massage", category: "Massage", price: 200 },
  { id: 10, name: "Thai Massage", category: "Massage", price: 220 },
  { id: 11, name: "Hot Oil Massage", category: "Massage", price: 230 },
  { id: 12, name: "Deep Tissue Massage", category: "Massage", price: 250 },
  { id: 27, name: "Full Body Waxing", category: "Waxing", price: 350 },
  { id: 28, name: "Half Leg Waxing", category: "Waxing", price: 80 },
  { id: 29, name: "Half Arms Waxing", category: "Waxing", price: 60 },
  { id: 30, name: "Bikini Wax", category: "Waxing", price: 90 },
  { id: 31, name: "Full Face Wax", category: "Waxing", price: 100 },
  { id: 32, name: "Eyebrows Wax", category: "Waxing", price: 40 },
  { id: 33, name: "Forehead Wax", category: "Waxing", price: 35 },
  { id: 34, name: "Chin Wax", category: "Waxing", price: 30 },
  { id: 35, name: "Belly Wax", category: "Waxing", price: 70 },
  { id: 36, name: "Back Wax", category: "Waxing", price: 120 },
  { id: 37, name: "Chest Wax", category: "Waxing", price: 100 },
  { id: 24, name: "Classic Eyelash Extensions", category: "Eye Lashes", price: 180 },
  { id: 25, name: "Volume Lash Extensions", category: "Eye Lashes", price: 220 },
  { id: 26, name: "Moroccan Bath", category: "Moroccan Bath", price: 250 }
];

const DEFAULT_STAFF = [
  { id: 1, name: "Jocelyn", services: ["Haircut", "Coloring", "Protein", "Waxing", "Keratin Protein Treatment", "Hair Care"] },
  { id: 2, name: "Feriel", services: ["Manicure", "Nail Art", "Gel Polish", "Gel Polish Removal", "Classic Eyelash Extensions", "Volume Lash Extensions", "Gel extentions", "Nails & Spa"] },
  { id: 3, name: "Reham", services: ["Hair Spa", "Full Body Relaxing Massage", "Deep Tissue Massage", "Thai Massage", "Any Facial", "Hot Oil Massage", "Moroccan Bath", "Footspa"] },
  { id: 4, name: "Ramsi", services: ["Any Facial", "Kanpeki Korean Facial", "Premium Hydra Facial", "Anti-aging Hydra Facial", "Full Body Waxing", "Half Leg Waxing", "Half Arms Waxing", "Full Face Wax", "Eyebrows Wax", "Forehead Wax", "Chin Wax", "Belly Wax", "Back Wax", "Chest Wax", "Hairspa"] },
  { id: 5, name: "Zara", services: ["Manicure", "Pedicure", "Gel extentions", "Gel polish", "Pedicure and Manicure", "Gel polish Removal", "Nails & Spa"] },
  { id: 9, name: "Kopila", services: ["Hair Spa", "Hairspa", "Footspa"] },
  { id: 10, name: "Rebecca", services: ["Haircut", "Coloring", "Hair Spa", "massage", "Protein", "Kanpeki Korean Facial", "Any Facial", "Hot Oil Massage", "Full Body Relaxing Massage", "Relaxing Foot Reflexology", "Waxing", "Hairspa", "Footspa", "Keratin Protein Treatment", "Hair Care"] },
  { id: 11, name: "Yashodha", services: ["Hair Spa", "Pedicure", "Classic Eyelash Extensions", "Volume Lash Extensions", "Relaxing Foot Reflexology", "Hairspa", "Footspa", "Manicure", "Pedicure and Manicure", "Nails & Spa"] },
  { id: 12, name: "Maggy", services: ["Full Body Relaxing Massage", "Deep Tissue Massage", "Thai Massage", "Hot Oil Massage", "Moroccan Bath", "Footspa"] },
  { id: 13, name: "Nancy", services: ["Full Body Relaxing Massage", "Deep Tissue Massage", "Thai Massage", "Hot Oil Massage", "Waxing", "Footspa"] },
  { id: 15, name: "Sajal", services: ["hair", "Hair Spa", "Hairspa", "Hair Care"] }
];

/* =========================
   PURE FRONTEND BOOKING FORM
========================= */
export default function BookingForms({ branch: propBranch = 'rospa' }: { user?: any, branch?: 'rospa' | 'elan' }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlBranch = (searchParams.get("branch") as 'rospa' | 'elan') || null;
  const branch = urlBranch || propBranch || 'rospa';

  const [dbServices, setDbServices] = useState<any[]>(DEFAULT_SERVICES);
  const [dbStaff, setDbStaff] = useState<any[]>(DEFAULT_STAFF);

  const rawCategory = searchParams.get("category") || "";
  const selectedService = searchParams.get("service") || "";
  
  const categoryMap: Record<string, string> = {
    "Hair": "Hair Care",
    "Facial": "Facials",
    "Nails": "Nails & Spa",
    "Lashes": "Eye Lashes",
    "Massage": "Massage"
  };
  const selectedCategory = categoryMap[rawCategory] || rawCategory;
  const [submitting, setSubmitting] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Registration step state
  const [isRegistrationStep, setIsRegistrationStep] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    phone: string;
    email: string;
    date: string;
    time: string;
    payment: string;
    note: string;
    services: {
      category: string;
      service: string;
      custom_service?: string;
      staff: string;
      price: number;
      start_time?: string;
    }[];
  }>({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    payment: "",
    note: "",
    services: [
      {
        category: selectedCategory || "Hair Care",
        service: selectedService || "Haircut & Styling",
        staff: "",
        price: 120,
        start_time: "",
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, staffRes] = await Promise.all([
          fetch(`/api/services?branch=${branch}`),
          fetch(`/api/staff?branch=${branch}`)
        ]);
        const servicesData = await servicesRes.json();
        const staffData = await staffRes.json();
        
        const servicesList = servicesData.services || (Array.isArray(servicesData) ? servicesData : []);
        const staffList = staffData.staff || (Array.isArray(staffData) ? staffData : []);

        if (servicesList.length > 0) setDbServices(servicesList);
        if (staffList.length > 0) setDbStaff(staffList);
      } catch (err) {
        console.error("Failed to load dynamic booking data:", err);
      }
    };
    fetchData();
  }, [branch]);

  const categories = Array.from(
    new Set([
      "Hair Care",
      "Nails & Spa",
      "Facials",
      "Waxing",
      "Massage",
      "Eye Lashes",
      "Moroccan Bath",
      ...dbServices.map((s: any) => s.category).filter(Boolean),
    ])
  );

  const getCategoryServices = (catName: string) => {
    if (!catName || catName === "Others") return dbServices;
    const normalized = catName.trim().toLowerCase();
    const filtered = dbServices.filter((s: any) => {
      const sCat = (s.category || "").trim().toLowerCase();
      if (sCat === normalized) return true;
      if (sCat.includes(normalized) || normalized.includes(sCat)) return true;
      if (
        (normalized.includes("hair") || normalized === "hair care") &&
        (sCat.includes("hair") || sCat === "hair care")
      ) return true;
      if (
        (normalized.includes("nail") || normalized === "nails & spa") &&
        (sCat.includes("nail") || sCat === "nails & spa")
      ) return true;
      if (
        (normalized.includes("facial") || normalized === "facials") &&
        (sCat.includes("facial") || sCat === "facials")
      ) return true;
      if (
        (normalized.includes("massage") || normalized === "massage") &&
        (sCat.includes("massage") || sCat === "massage")
      ) return true;
      if (
        (normalized.includes("lash") || normalized === "eye lashes") &&
        (sCat.includes("lash") || sCat === "eye lashes")
      ) return true;
      return false;
    });

    return filtered.length > 0 ? filtered : dbServices;
  };

  useEffect(() => {
    if (!selectedService || dbServices.length === 0) return;

    const selected = dbServices.find(
      (s: any) => s.name.toLowerCase() === selectedService.toLowerCase()
    );

    if (selected) {
      setForm((prev) => ({
        ...prev,
        services: [
          {
            category: selected.category,
            service: selected.name,
            staff: "",
            price: selected.price || 0,
          },
        ],
      }));
    } else if (selectedCategory) {
      const catServices = getCategoryServices(selectedCategory);
      const firstServ = catServices[0];
      setForm((prev) => ({
        ...prev,
        services: [
          {
            category: selectedCategory,
            service: firstServ ? firstServ.name : selectedService,
            staff: "",
            price: firstServ ? firstServ.price || 0 : 0,
          },
        ],
      }));
    }
  }, [selectedCategory, selectedService, dbServices]);

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[] | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    const selectedStaff = form.services[0]?.staff || "";
    const selectedService = form.services[0]?.service || "";
    const selectedDate = form.date;

    if (!selectedDate) {
      setAvailableTimeSlots(null);
      return;
    }

    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const servObj = dbServices.find((s: any) => s.name === selectedService);
        const duration = servObj?.duration_minutes || 30;

        const res = await fetch(
          `/api/bookings/availability?staff=${encodeURIComponent(selectedStaff)}&service=${encodeURIComponent(selectedService)}&date=${selectedDate}&duration=${duration}`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailableTimeSlots(data);
          if (form.time && !data.includes(form.time)) {
            setForm((prev) => ({ ...prev, time: "" }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch availability slots:", err);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [form.date, form.services[0]?.staff, form.services[0]?.service, dbServices]);

  const addMinutes = (timeStr: string, minsToAdd: number) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minsToAdd);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

    const isToday = form.date === todayStr;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let h = 9; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        const timeVal = `${hour}:${minute}`;

        if (isToday) {
          // Skip past time slots for today
          if (h < currentHour || (h === currentHour && m <= currentMinute)) {
            continue;
          }
        }

        // If availability slots loaded for selected staff, filter out booked slots
        if (availableTimeSlots !== null && !availableTimeSlots.includes(timeVal)) {
          continue;
        }

        slots.push({ value: timeVal, label: timeVal });
      }
    }

    if (slots.length === 0) {
      if (isToday) {
        slots.push({ value: "", label: "Fully booked / Closed for today" });
      } else if (availableTimeSlots !== null) {
        slots.push({ value: "", label: "No available times for selected stylist" });
      }
    }

    return slots;
  };
  const timeSlots = generateTimeSlots();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setErrorMsg("");

    setForm((prev) => {
      let updatedTime = prev.time;
      if (name === "date") {
        const now = new Date();
        const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .split("T")[0];

        if (value === todayStr && prev.time) {
          const [h, m] = prev.time.split(":").map(Number);
          if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) {
            updatedTime = "";
          }
        }
      }

      return {
        ...prev,
        [name]: value,
        time: updatedTime,
      };
    });
  };

  const addService = () => {
    const lastService = form.services[form.services.length - 1];
    let nextStartTime = form.time;

    if (lastService && lastService.service) {
      const dbService = dbServices.find(
        (s) => s.name === lastService.service && s.category === lastService.category
      );
      const duration = dbService?.duration_minutes || 30;
      const lastStartTime = lastService.start_time || form.time;
      if (lastStartTime) {
        nextStartTime = addMinutes(lastStartTime, duration);
      }
    }

    setForm({
      ...form,
      services: [
        ...form.services,
        {
          category: "Hair Care",
          service: "Haircut & Styling",
          staff: "",
          price: 120,
          start_time: nextStartTime,
        },
      ],
    });
  };

  const removeService = (indexToRemove: number) => {
    if (form.services.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleCategory = (index: number, value: string) => {
    const updated = [...form.services];
    updated[index].category = value;
    
    const catServices = getCategoryServices(value);
    if (catServices && catServices.length > 0 && value !== "Others") {
      const firstService = catServices[0];
      updated[index].service = firstService.name;
      updated[index].price = firstService.price || 0;
    } else {
      updated[index].service = value === "Others" ? "Others" : "";
      updated[index].price = 0;
    }
    
    updated[index].staff = "";
    setForm({ ...form, services: updated });
    setErrorMsg("");
  };

  const handleCustomService = (index: number, value: string) => {
    const updated = [...form.services];
    updated[index].custom_service = value;
    setForm({ ...form, services: updated });
  };

  const handleService = (index: number, value: string) => {
    let price = 0;
    if (value !== "Others") {
      const selected = dbServices.find(
        (s: any) => s.name === value
      );
      price = selected?.price || 0;
    }

    const updated = [...form.services];
    updated[index].service = value;
    updated[index].price = price;
    updated[index].staff = "";

    setForm({ ...form, services: updated });
    setErrorMsg("");
  };

  const handleStaff = (index: number, value: string) => {
    const updated = [...form.services];
    updated[index].staff = value;
    setForm({ ...form, services: updated });
    setErrorMsg("");
  };

  const handleServiceTime = (index: number, value: string) => {
    const updated = [...form.services] as any[];
    updated[index].start_time = value;
    
    if (index === 0) {
      setForm({ ...form, time: value, services: updated });
    } else {
      setForm({ ...form, services: updated });
    }
  };

  const totalPrice = form.services.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.name.trim() || !form.phone.trim() || !form.date || !form.time || !form.payment) {
      setErrorMsg("Please fill out all required fields (Name, Phone, Date, Time, Payment method).");
      return;
    }

    if (form.services.length === 0 || form.services.some(s => !s.category || !s.service)) {
      setErrorMsg("Please select a category and service for all service rows.");
      return;
    }

    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    if (form.date === today && form.time) {
      const [h, m] = form.time.split(":").map(Number);
      if (h < now.getHours() || (h === now.getHours() && m < now.getMinutes())) {
        setErrorMsg("The selected time has already passed today. Please choose a future time.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
        },
        date: form.date,
        time: form.time,
        services: form.services.map(s => ({
          ...s,
          service: (s.category === "Others" || s.service === "Others") && s.custom_service ? `Others: ${s.custom_service}` : s.service,
          category: s.category === "Others" ? "Other" : s.category
        })),
        payment: form.payment,
        note: form.note,
        total: totalPrice,
        createdAt: new Date(),
        branch: branch,
      };

      const res = await fetch(`/api/bookings?branch=${branch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error && data.error.includes("is not available for this time")) {
          setErrorMsg(`${data.error}. Please choose another time or stylist.`);
        } else {
          setErrorMsg("Error saving booking: " + (data.error || "Unknown error"));
        }
        setSubmitting(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Check if customer already has an account — if so, skip registration
        const customerEmail = form.email.trim();
        if (customerEmail) {
          try {
            const checkRes = await fetch(`/api/customers/register?email=${encodeURIComponent(customerEmail)}`);
            const checkData = await checkRes.json();
            if (checkData.exists) {
              // Already registered — go straight to success
              setSuccessMessage("Your appointment has been scheduled successfully!");
              setIsSuccess(true);
              return;
            }
          } catch {
            // If check fails, still show registration
          }
        }

        // Show registration form for new customers
        setRegName(form.name.trim());
        setRegPhone(form.phone.trim());
        setRegEmail(customerEmail);
        setRegPassword("");
        setRegConfirmPassword("");
        setRegError("");
        setIsRegistrationStep(true);
      }
    } catch (err: any) {
      setErrorMsg("An error occurred: " + (err.message || err));
      setSubmitting(false);
    }
  };

  const handleSkipRegistration = () => {
    setIsRegistrationStep(false);
    setSuccessMessage("Your appointment has been scheduled successfully!");
    setIsSuccess(true);
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regEmail.trim()) {
      setRegError("Please enter your email address.");
      return;
    }
    if (!regName.trim()) {
      setRegError("Please enter your name.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }

    setRegSubmitting(true);

    try {
      const res = await fetch("/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setRegError(data.error || "Failed to create account. Please try again.");
        setRegSubmitting(false);
        return;
      }

      // Success — move to the confirmation screen
      setIsRegistrationStep(false);
      setSuccessMessage(
        data.exists
          ? "Your appointment has been scheduled successfully!"
          : "Your appointment is confirmed and your account has been created!"
      );
      setIsSuccess(true);
    } catch (err: any) {
      setRegError("An error occurred: " + (err.message || err));
      setRegSubmitting(false);
    }
  };

  const getAvailableStaff = (itemCategory: string, itemService: string) => {
    if (!dbStaff || dbStaff.length === 0) return [];
    if (!itemCategory && !itemService) return dbStaff;
    if (itemCategory === "Others" || itemService === "Others") return dbStaff;

    const servLower = (itemService || "").trim().toLowerCase();
    const catLower = (itemCategory || "").trim().toLowerCase();

    const filtered = dbStaff.filter((s: any) => {
      if (!s.services || s.services.length === 0) return true;
      return s.services.some((serv: string) => {
        if (typeof serv !== "string") return false;
        const sLower = serv.trim().toLowerCase();
        if (servLower && (sLower === servLower || sLower.includes(servLower) || servLower.includes(sLower))) return true;
        if (catLower && (sLower === catLower || sLower.includes(catLower) || catLower.includes(sLower))) return true;
        if (
          (catLower.includes("hair") || catLower === "hair care") &&
          (sLower.includes("hair") || sLower === "hair care")
        ) return true;
        if (
          (catLower.includes("nail") || catLower === "nails & spa") &&
          (sLower.includes("nail") || sLower === "nails & spa")
        ) return true;
        if (
          (catLower.includes("facial") || catLower === "facials") &&
          (sLower.includes("facial") || sLower === "facials")
        ) return true;
        if (
          (catLower.includes("massage") || catLower === "massage") &&
          (sLower.includes("massage") || sLower === "massage")
        ) return true;
        if (
          (catLower.includes("lash") || catLower === "eye lashes") &&
          (sLower.includes("lash") || sLower === "eye lashes")
        ) return true;
        if (catLower.includes("wax") && sLower.includes("wax")) return true;
        return false;
      });
    });

    return filtered.length > 0 ? filtered : dbStaff;
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-6">
            <FaCheckCircle className="text-green-500 text-7xl animate-bounce" />
            <h2 className="text-3xl font-bold text-slate-800">Booking Successful!</h2>
            <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
              {successMessage}
            </p>
            <button 
              onClick={() => router.push(branch === 'elan' ? "/elan" : "/")}
              className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-lg hover:bg-slate-800 transition-colors"
            >
              Return Home
            </button>
          </div>
        ) : isRegistrationStep ? (
          /* ── REGISTRATION STEP ── */
          <div className="flex flex-col items-center py-8 px-4">
            <div className="w-full max-w-md space-y-6">
              {/* Icon & Title */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-light)] text-white text-2xl shadow-lg mx-auto">
                  <FaUserPlus />
                </div>
                <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-heading)" }}>
                  Create Your Account
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Save your details for faster bookings next time.
                </p>
              </div>

              {/* Registration Error */}
              {regError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-start gap-2 border border-red-100 text-sm">
                  <FaExclamationCircle className="text-base flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{regError}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleRegisterCustomer} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    className={styles.field}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    className={styles.field}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    className={styles.field}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+974 XXXX XXXX"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Create Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={styles.field}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={styles.field}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      minLength={6}
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {regPassword && regConfirmPassword && regPassword !== regConfirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className={styles.submitBtn}
                  style={{ marginTop: "12px" }}
                >
                  {regSubmitting ? "Creating Account..." : "Create Account & Continue"}
                </button>
              </form>

              {/* Skip */}
              <button
                type="button"
                onClick={handleSkipRegistration}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-2 font-medium"
              >
                No thanks, skip this step →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className={styles.title}>Book Appointment</h2>
            
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 mb-2">
                <FaExclamationCircle className="text-xl flex-shrink-0 mt-0.5" />
                <span className="font-medium text-sm leading-snug">{errorMsg}</span>
              </div>
            )}

            <input
              className={styles.field}
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <input
              className={styles.field}
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <input
              className={styles.field}
              type="email"
              name="email"
              placeholder="Email (Optional)"
              value={form.email}
              onChange={handleChange}
            />

            <input
              className={styles.field}
              type="date"
              name="date"
              value={form.date}
              min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}
              onChange={handleChange}
              required
            />

            <h3>Services & Stylists</h3>

            {form.services.map((item: any, index) => {
              const categoryServices = getCategoryServices(item.category);
              const availableStaff = getAvailableStaff(item.category, item.service);

              return (
                <div key={index} className={styles.serviceRow}>
                  <select
                    className={styles.field}
                    value={item.category}
                    onChange={(e) => handleCategory(index, e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat: any) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Others">Others</option>
                  </select>

                  {item.category !== "Others" ? (
                    <select
                      className={styles.field}
                      value={item.service}
                      onChange={(e) => handleService(index, e.target.value)}
                      required
                    >
                      <option value="">Select Service</option>
                      {categoryServices.map((s: any) => (
                        <option key={s.id || s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                      {item.category && <option value="Others">Others</option>}
                    </select>
                  ) : (
                    <input
                      className={styles.field}
                      placeholder="Please specify the service you want..."
                      value={item.custom_service || ""}
                      onChange={(e) => handleCustomService(index, e.target.value)}
                      required
                    />
                  )}

                  <select
                    className={styles.field}
                    value={item.staff}
                    onChange={(e) => handleStaff(index, e.target.value)}
                  >
                    <option value="">Select Staff</option>
                    {availableStaff.map((s: any) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <span>
                      {item.category === "Hair Care" || item.category === "Hair" ? "Starting from " : ""}QR {item.price}
                    </span>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors ml-1"
                        title="Remove service"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button type="button" className={styles.addBtn} onClick={addService}>
              + Add More
            </button>

            {/* Time selection field UNDER services and category & stylist field */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Select Available Time</span>
                {loadingAvailability && (
                  <span className="text-amber-600 font-normal normal-case text-xs animate-pulse">
                    Checking stylist schedule...
                  </span>
                )}
              </label>
              <select
                className={styles.field}
                name="time"
                value={form.time}
                onChange={(e) => {
                  handleChange(e);
                  if (form.services.length > 0) {
                    handleServiceTime(0, e.target.value);
                  }
                }}
                required
              >
                <option value="">
                  {!form.date
                    ? "Select Date First"
                    : timeSlots.length === 0
                    ? "No available time slots"
                    : "Select Available Time"}
                </option>
                {timeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value} disabled={!slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <h3>{form.services.some(s => s.category === "Hair Care" || s.category === "Hair") ? "Starting Total: " : "Total: "}QR {totalPrice}</h3>

            <select
              className={styles.field}
              name="payment"
              value={form.payment}
              onChange={handleChange}
              required
            >
              <option value="">Payment Method</option>
              <option value="cash">Cash (Pay at Salon)</option>
              <option value="online">Pay Online (Card / Bank Transfer)</option>
            </select>

            <textarea
              className={styles.field}
              name="note"
              placeholder="Notes / Special Requests"
              value={form.note}
              onChange={handleChange}
              rows={3}
            />

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Processing..." : "Confirm Booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
