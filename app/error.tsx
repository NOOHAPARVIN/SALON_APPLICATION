"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FaExclamationTriangle } from "react-icons/fa";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-5 font-['Montserrat']">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-12 text-center shadow-2xl border border-[var(--color-border)]">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-4xl">
            <FaExclamationTriangle />
          </div>
        </div>
        <h1 className="font-['Playfair_Display'] text-4xl text-[var(--color-text-main)] mb-4">
          Something went wrong
        </h1>
        <p className="text-[var(--color-text-muted)] text-lg mb-10">
          We apologize for the inconvenience. An unexpected error occurred while processing your request. Our technical team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-8 py-3 rounded-full bg-[var(--color-gold)] text-white font-bold tracking-wider hover:bg-[var(--color-gold-hover)] transition-all shadow-md"
          >
            Try Again
          </button>
          <Link href="/">
            <button className="w-full px-8 py-3 rounded-full border-2 border-[var(--color-gold)] text-[var(--color-gold)] font-bold tracking-wider hover:bg-[var(--color-gold)] hover:text-white transition-all">
              Return Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
