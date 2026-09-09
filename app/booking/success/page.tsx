"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle, FaSpinner, FaCalendarAlt, FaClock, FaHeart, FaChevronRight } from "react-icons/fa";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const bookingId = searchParams.get("booking_id");
  const sessionId = searchParams.get("session_id");

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!bookingId || !sessionId) {
      setError("Missing booking reference or session details.");
      setVerifying(false);
      return;
    }

    const confirmPayment = async () => {
      try {
        const res = await fetch("/api/payments/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId, sessionId }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setSuccess(true);
          setBooking(data.booking);
        } else {
          setError(data.error || "Could not verify payment with Stripe.");
        }
      } catch (err) {
        setError("Network error verifying payment.");
      } finally {
        setVerifying(false);
      }
    };

    confirmPayment();
  }, [bookingId, sessionId]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#faf6f0] text-[var(--color-text-main)] flex flex-col justify-center items-center font-['Montserrat'] p-5">
        <FaSpinner className="animate-spin text-5xl text-[var(--color-gold)] mb-5" />
        <h2 className="tracking-wide font-semibold text-2xl font-['Playfair_Display'] text-[var(--color-gold)]">Verifying Your Payment...</h2>
        <p className="text-gray-500 mt-2 font-light">Securing your luxury pampering slot</p>
      </div>
    );
  }

  if (error || !success) {
    return (
      <div className="min-h-screen bg-[#faf6f0] text-[var(--color-text-main)] flex flex-col justify-center items-center font-['Montserrat'] p-5">
        <div className="bg-white border border-red-200 rounded-3xl p-10 max-w-lg w-full text-center shadow-lg">
          <div className="text-5xl text-red-500 mb-5">⚠️</div>
          <h2 className="text-red-500 mb-4 font-bold text-2xl font-['Playfair_Display']">Verification Unsuccessful</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            {error || "We could not verify your card payment. Please contact our support team or check your banking details."}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/booking"
              className="block p-4 bg-[var(--color-gold)] text-white no-underline rounded-full font-bold transition-all hover:bg-[#b08d4b] hover:-translate-y-1 shadow-md"
            >
              Retry Booking
            </Link>
            <Link
              href="/"
              className="block p-4 border border-[var(--color-gold)] text-[var(--color-gold)] no-underline rounded-full font-bold transition-all hover:bg-gray-50"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format services array
  let servicesArray = [];
  try {
    if (booking?.services) {
      servicesArray = typeof booking.services === "string" ? JSON.parse(booking.services) : booking.services;
    }
  } catch (e) {
    servicesArray = [];
  }

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[var(--color-text-main)] flex justify-center items-center font-['Montserrat'] py-20 px-5">
      <div className="bg-white border border-[var(--color-border)] rounded-3xl p-10 md:p-12 max-w-xl w-full text-center shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden">
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-[var(--color-gold)] opacity-5 rounded-br-full"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[var(--color-gold)] opacity-5 rounded-tl-full"></div>

        <div className="inline-flex justify-center items-center relative mb-6">
          <div className="absolute w-24 h-24 rounded-full bg-[var(--color-gold)]/10 animate-ping"></div>
          <FaCheckCircle className="text-7xl text-[var(--color-gold)] relative z-10" />
        </div>

        <h1 className="text-[var(--color-gold)] text-4xl font-bold font-['Playfair_Display'] mb-3">
          Payment Confirmed
        </h1>
        <p className="text-gray-500 text-base mb-8 leading-relaxed font-light">
          Thank you, <strong className="text-gray-800 font-semibold">{booking?.name}</strong>! Your appointment is successfully booked. A confirmation has been sent to your WhatsApp number.
        </p>

        {/* BOOKING CARD */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left mb-8 shadow-sm relative z-10">
          <h3 className="text-[var(--color-gold)] m-0 mb-4 text-lg border-b border-[var(--color-gold)]/20 pb-3 font-['Playfair_Display'] font-semibold">
            Appointment Details
          </h3>
          
          <div className="flex gap-6 mb-5 flex-wrap">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <FaCalendarAlt className="text-[var(--color-gold)]" />
              <span>{booking?.date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <FaClock className="text-[var(--color-gold)]" />
              <span>{booking?.time}</span>
            </div>
          </div>

          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">SERVICES</div>
          <div className="flex flex-col gap-3">
            {servicesArray.map((s: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between bg-white border border-gray-100 p-3 px-4 rounded-xl text-sm shadow-sm"
              >
                <div>
                  <span className="text-gray-800 font-semibold">{s.service}</span>
                  <span className="text-gray-400 text-xs ml-2">({s.staff || "Any Staff"})</span>
                </div>
                <span className="text-[var(--color-gold)] font-bold">QR {s.price}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 text-lg font-bold">
            <span className="text-gray-800">Total Paid</span>
            <span className="text-green-600">QR {booking?.total}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 relative z-10">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 p-4 bg-[var(--color-gold)] text-white no-underline rounded-full font-bold text-lg transition-all hover:bg-[#b08d4b] hover:-translate-y-1 shadow-[0_4px_15px_rgba(197,160,89,0.3)]"
          >
            Return Home <FaChevronRight size={14} />
          </Link>
          
          <p className="text-gray-400 text-sm mt-4 flex items-center justify-center gap-1.5 font-light">
            Made with <FaHeart className="text-red-400" /> Rospa Salon & Spa
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf6f0] flex justify-center items-center text-[var(--color-gold)] font-['Montserrat']">
        Loading Booking Info...
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
