"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaTimesCircle, FaUndo, FaHome } from "react-icons/fa";

function CancelledPageContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at center, #0B2B20, #041410)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(11, 43, 32, 0.9) 0%, rgba(5, 23, 17, 0.95) 100%)",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          borderRadius: "28px",
          padding: "45px 35px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ fontSize: "75px", color: "#EF4444", marginBottom: "25px" }}>
          <FaTimesCircle />
        </div>

        <h1
          style={{
            color: "#D4AF37",
            fontSize: "32px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            marginBottom: "15px",
          }}
        >
          Payment Cancelled
        </h1>
        
        <p style={{ color: "#A0B5AD", fontSize: "16px", marginBottom: "35px", lineHeight: "1.6" }}>
          Your online card payment session was cancelled. No charges were made, and your booking slot has not been confirmed.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link
            href="/booking"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "15px",
              background: "#D4AF37",
              color: "#041410",
              textDecoration: "none",
              borderRadius: "35px",
              fontWeight: "bold",
              fontSize: "16px",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <FaUndo /> Retry Booking
          </Link>
          
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "15px",
              background: "transparent",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              color: "#D4AF37",
              textDecoration: "none",
              borderRadius: "35px",
              fontWeight: "bold",
              fontSize: "16px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(212, 175, 55, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FaHome /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CancelledPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#041410", color: "#D4AF37" }}>
        Loading...
      </div>
    }>
      <CancelledPageContent />
    </Suspense>
  );
}
