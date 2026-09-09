"use client";

import { Suspense } from "react";
import BookingForm from "@/components/BookingForms";

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] px-6 pt-32 pb-24 text-[var(--color-text-main)]">

      {/* HEADER */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-['Playfair_Display'] font-normal mb-6">
          Book Your Appointment
        </h1>

        <p className="text-lg max-w-2xl mx-auto text-[var(--color-text-muted)] font-['Montserrat'] leading-relaxed">
          Experience luxury beauty and wellness services with our professional salon experts.
        </p>
      </div>

      {/* BOOKING FORM */}
      <Suspense
        fallback={
          <div className="text-center text-[var(--color-text-main)] font-['Montserrat']">
            Loading Booking Form...
          </div>
        }
      >
        <BookingForm />
      </Suspense>
    </div>
  );
}