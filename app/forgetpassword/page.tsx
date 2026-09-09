"use client";

import { useState } from "react";
import Link from "next/link";
import { useModal } from "@/components/ModalContext";
import styles from "./ForgotPassword.module.css";

export default function ForgotPasswordPage() {
  const { showAlert } = useModal();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        showAlert("Error", data.error || "Failed to send reset link.", "error");
        return;
      }

      showAlert("Success", "A password reset link has been sent to your WhatsApp number.", "success");
    } catch (err) {
      setLoading(false);
      showAlert("Error", "An error occurred. Please try again.", "error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]/40 p-5 relative z-10 font-['Montserrat']">
      <form onSubmit={handleReset} className="w-full max-w-md bg-white/40 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-[var(--color-gold)]/30 shadow-2xl relative overflow-hidden text-[var(--color-text-main)]">
        
        {/* Shimmer Effect */}
        <div className="absolute top-0 left-[-100%] w-[60%] h-full bg-gradient-to-r from-transparent via-[var(--color-gold)]/10 to-transparent animate-[shimmer_4s_infinite] pointer-events-none" />
        
        {/* Top Gold Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[var(--color-gold)] rounded-b-md animate-pulse" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center text-3xl shadow-sm">
            🔑
          </div>
          <h1 className="text-3xl font-bold mb-3 font-['Playfair_Display'] drop-shadow-sm text-[var(--color-text-main)]">
            Reset Password
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm font-light leading-relaxed">
            Enter your email and we'll send a password reset link to your registered WhatsApp number
          </p>
        </div>

        <div className="space-y-5">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl border border-[var(--color-border)] bg-white/60 text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-4 focus:ring-[var(--color-gold)]/10 transition-all font-light"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-xl bg-[var(--color-text-main)] text-white font-semibold uppercase tracking-wider text-sm hover:bg-[var(--color-gold)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
          >
            {loading ? "Sending..." : "Send Reset Link via WhatsApp"}
          </button>
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="text-[var(--color-text-main)] hover:text-[var(--color-gold)] font-semibold transition-colors text-sm">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}