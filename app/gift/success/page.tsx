"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function GiftSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const giftId = searchParams.get("gift_id");
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!giftId || !sessionId) {
      setStatus("error");
      setErrorMsg("Missing order details.");
      return;
    }

    const confirmPayment = async () => {
      try {
        const res = await fetch("/api/gift/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gift_id: giftId, sessionId }),
        });

        const data = await res.json();
        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Payment verification failed.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    };

    confirmPayment();
  }, [giftId, sessionId]);

  return (
    <div className="w-full bg-[#faf6f0] min-h-screen pt-40 pb-24 px-5 flex flex-col items-center font-['Montserrat']">
      <div className="bg-white p-10 md:p-16 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-[var(--color-border)] max-w-2xl w-full text-center">
        {status === "loading" && (
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-3xl animate-spin">⏳</span>
            </div>
            <h2 className="text-3xl font-['Playfair_Display'] text-[var(--color-text-main)] mb-4">
              Verifying your payment...
            </h2>
            <p className="text-[var(--color-text-muted)]">Please wait while we confirm your gift card purchase.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full mx-auto mb-8 flex items-center justify-center text-4xl border border-green-100">
              ✅
            </div>
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] text-[var(--color-text-main)] mb-6">
              Gift Sent Successfully!
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg mb-8 leading-relaxed">
              Thank you for choosing Rospa Salon! Your payment was successful. We have sent the digital gift card and coupon code to the recipient via WhatsApp. You will also receive a confirmation receipt shortly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/"
                className="px-8 py-4 bg-[var(--color-gold)] text-white font-bold rounded-full shadow-[0_4px_15px_rgba(197,160,89,0.3)] hover:bg-[#b08d4b] hover:-translate-y-1 transition-all duration-300"
              >
                Return to Home
              </Link>
              <Link 
                href="/gift"
                className="px-8 py-4 bg-transparent border-2 border-[var(--color-gold)] text-[var(--color-gold)] font-bold rounded-full hover:bg-[var(--color-gold)]/10 transition-all duration-300"
              >
                Send Another Gift
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full mx-auto mb-8 flex items-center justify-center text-4xl border border-red-100">
              ❌
            </div>
            <h2 className="text-4xl font-['Playfair_Display'] text-[var(--color-text-main)] mb-6">
              Payment Error
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg mb-8">
              {errorMsg}
            </p>
            <Link 
              href="/gift"
              className="px-8 py-4 bg-[var(--color-gold)] text-white font-bold rounded-full shadow-[0_4px_15px_rgba(197,160,89,0.3)] hover:bg-[#b08d4b] hover:-translate-y-1 transition-all duration-300 inline-block"
            >
              Try Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GiftSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf6f0] flex items-center justify-center">Loading...</div>}>
      <GiftSuccessContent />
    </Suspense>
  );
}
