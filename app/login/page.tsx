"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useModal } from "@/components/ModalContext";
import styles from "./Login.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useModal();
  const nextUrl = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      showAlert("Login Failed", error.message, "error");
      return;
    }

    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      
      const profile = await res.json();
      const role = (profile?.role || "customer").toLowerCase();

      if (role === "customer") {
        window.location.href = nextUrl;
      } else if (role === "owner" || role === "super_admin") {
        window.location.href = "/dashboard/owner";
      } else {
        window.location.href = `/dashboard/${role}`;
      }
    } catch (err) {
      console.error("Login redirect error:", err);
      // Fallback to home page if profile fetch fails
      window.location.href = nextUrl;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]/40 p-5 relative z-10 font-['Montserrat']">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white/40 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-[var(--color-gold)]/30 shadow-2xl relative overflow-hidden text-[var(--color-text-main)]">
        
        {/* Shimmer Effect */}
        <div className="absolute top-0 left-[-100%] w-[60%] h-full bg-gradient-to-r from-transparent via-[var(--color-gold)]/10 to-transparent animate-[shimmer_4s_infinite] pointer-events-none" />
        
        {/* Top Gold Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[var(--color-gold)] rounded-b-md animate-pulse" />

        <div className="text-center mb-8">
          <img 
            src="/images/logo.jpeg" 
            alt="Rospa Salon" 
            className="w-20 h-20 mx-auto mb-5 rounded-2xl border border-[var(--color-gold)]/30 shadow-sm object-cover"
          />
          <h1 className="text-3xl font-bold mb-2 font-['Playfair_Display'] drop-shadow-sm text-[var(--color-text-main)]">
            Welcome Back
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm font-light">
            Login to continue your luxury beauty experience
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-xl border border-[var(--color-border)] bg-white/60 text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-4 focus:ring-[var(--color-gold)]/10 transition-all font-light"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-xl border border-[var(--color-border)] bg-white/60 text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-4 focus:ring-[var(--color-gold)]/10 transition-all font-light"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-xl bg-[var(--color-text-main)] text-white font-semibold uppercase tracking-wider text-sm hover:bg-[var(--color-gold)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </div>

        <div className="flex justify-between items-center mt-6 text-sm relative z-20">
          <a href="/forgetpassword" className="text-[var(--color-text-muted)] hover:text-[var(--color-gold)] font-medium transition-colors cursor-pointer">
            Forgot Password?
          </a>
          <a href="/register" className="text-[var(--color-text-main)] hover:text-[var(--color-gold)] font-semibold transition-colors cursor-pointer">
            New User? Register
          </a>
        </div>

        <p className="text-center text-[var(--color-text-muted)]/60 text-xs mt-8 tracking-widest uppercase">
          Premium Beauty • Luxury Experience
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--color-gold)]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}