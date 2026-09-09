"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useModal } from "@/components/ModalContext";

function PortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramEmail = searchParams?.get("email") || "";
  const { showAlert } = useModal();

  const [email, setEmail] = useState(paramEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramEmail) {
      setEmail(paramEmail);
    }
  }, [paramEmail]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !authData.user) {
        setLoading(false);
        showAlert("Login Failed", error?.message || "Invalid credentials", "error");
        return;
      }

      // Check for pending approval state
      const userMeta = authData.user.user_metadata;
      if (userMeta?.approval_status === "pending") {
        await supabase.auth.signOut();
        setLoading(false);
        showAlert(
          "Approval Pending",
          "Your workspace registration is currently pending Super Admin approval. Please wait for approval before signing in.",
          "info"
        );
        return;
      }

      if (userMeta?.approval_status === "rejected") {
        await supabase.auth.signOut();
        setLoading(false);
        showAlert(
          "Access Denied",
          "Your workspace registration request was rejected by the Super Admin.",
          "error"
        );
        return;
      }

      // Fetch user profile to verify role
      const res = await fetch("/api/profile");
      const profile = await res.json();
      const role = (profile?.role || "customer").toLowerCase();

      setLoading(false);

      if (role === "owner" || role === "super_admin") {
        window.location.href = "/dashboard/owner";
      } else if (role === "receptionist") {
        window.location.href = "/dashboard/receptionist";
      } else if (role === "stylist") {
        window.location.href = "/dashboard/stylist";
      } else {
        // Customer account trying to access staff portal
        await supabase.auth.signOut();
        showAlert(
          "Access Denied",
          "Customer accounts must log in via the customer website.",
          "error"
        );
      }
    } catch (err: any) {
      setLoading(false);
      showAlert("Error", err.message || "An unexpected error occurred", "error");
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-5 font-['Montserrat'] relative overflow-hidden"
      style={{ backgroundColor: '#090d16', color: '#ffffff' }}
    >
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(147, 51, 234, 0.2)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)' }} />

      <form 
        onSubmit={handleLogin} 
        className="w-full max-w-md rounded-3xl p-8 md:p-10 border shadow-2xl relative z-10 text-white"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: '#1e293b'
        }}
      >
        <div className="text-center mb-8">
          <img 
            src="/images/portal-logo.png" 
            alt="Staff Portal" 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg object-cover"
            style={{ boxShadow: '0 10px 25px -5px rgba(147, 51, 234, 0.3)' }}
          />
          <h1 className="text-2xl font-bold mb-1 tracking-tight text-white">
            Staff & Management Portal
          </h1>
          <p className="text-xs font-light" style={{ color: '#cbd5e1' }}>
            Sign in to access your branch dashboard
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
              Staff Email
            </label>
            <input
              type="email"
              placeholder="e.g. receptionist@elan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all focus:outline-none"
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.8)',
                borderColor: '#334155',
                color: '#ffffff',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all focus:outline-none"
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.8)',
                borderColor: '#334155',
                color: '#ffffff',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg disabled:opacity-50"
            style={{
              background: 'linear-gradient(to right, #9333ea, #4f46e5)',
              color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(147, 51, 234, 0.3)'
            }}
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'rgba(51, 65, 85, 0.6)' }}>
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            Restricted System • Authorized Personnel Only
          </p>
        </div>
      </form>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-purple-400">Loading Portal...</div>}>
      <PortalLoginForm />
    </Suspense>
  );
}
