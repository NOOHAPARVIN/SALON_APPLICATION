"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !authData?.user) {
      setLoading(false);
      setErrorMsg(error?.message || "Invalid credentials");
      return;
    }

    // Check for pending/rejected approval state
    const userMeta = authData.user.user_metadata;
    if (userMeta?.approval_status === "pending") {
      await supabase.auth.signOut();
      setLoading(false);
      setErrorMsg("Your workspace registration is currently pending Super Admin approval. Please wait for approval before signing in.");
      return;
    }

    if (userMeta?.approval_status === "rejected") {
      await supabase.auth.signOut();
      setLoading(false);
      setErrorMsg("Your workspace registration request was rejected by the Super Admin.");
      return;
    }

    try {
      const metaRole = (authData.user.user_metadata?.role || "").toLowerCase();
      const res = await fetch("/api/profile");
      const profile = await res.json();
      const role = (profile?.role || metaRole || "customer").toLowerCase();

      if (role !== "super_admin" && metaRole !== "super_admin") {
        await supabase.auth.signOut();
        setLoading(false);
        setErrorMsg("Access Denied: This login page is strictly reserved for Super Admin accounts. Salon Owners & Staff must log in via /portal/login.");
        return;
      }

      window.location.href = "/dashboard/owner";
    } catch (err) {
      console.error("Login redirect error:", err);
      setErrorMsg("An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-5 font-['Montserrat'] relative overflow-hidden"
      style={{ backgroundColor: '#020617', color: '#ffffff' }}
    >
      {/* Background Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: 'rgba(194, 153, 87, 0.15)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }} />

      <div 
        className="w-full max-w-md rounded-3xl p-8 md:p-10 border shadow-2xl relative z-10 text-white"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: '#1e293b'
        }}
      >
        
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl mb-4 shadow-lg font-bold"
            style={{
              background: 'linear-gradient(to top right, #c29957, #e6dccb)',
              color: '#020617',
              boxShadow: '0 10px 25px -5px rgba(194, 153, 87, 0.3)'
            }}
          >
            SA
          </div>
          <div>
            <span 
              className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 border"
              style={{
                backgroundColor: 'rgba(194, 153, 87, 0.15)',
                color: '#c29957',
                borderColor: 'rgba(194, 153, 87, 0.3)'
              }}
            >
              Super Admin Restricted
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SaaS Platform Admin
          </h1>
          <p className="text-xs mt-1 font-light" style={{ color: '#94a3b8' }}>
            Sign in with your Super Admin credentials
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {errorMsg && (
            <div 
              className="px-4 py-3 rounded-xl text-xs font-medium leading-relaxed border"
              style={{ backgroundColor: 'rgba(69, 10, 10, 0.6)', borderColor: '#991b1b', color: '#fca5a5' }}
            >
              {errorMsg}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
              Super Admin Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@gmail.com"
              className="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all focus:outline-none"
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.8)',
                borderColor: '#1e293b',
                color: '#ffffff',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>
                Password
              </label>
              <Link
                href="/forgetpassword"
                className="text-xs hover:underline font-light"
                style={{ color: '#c29957' }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all focus:outline-none"
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.8)',
                borderColor: '#1e293b',
                color: '#ffffff',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg disabled:opacity-50"
            style={{
              background: 'linear-gradient(to right, #c29957, #b0894b)',
              color: '#020617',
              boxShadow: '0 10px 25px -5px rgba(194, 153, 87, 0.25)'
            }}
          >
            {loading ? "Authenticating Admin..." : "Sign In to Admin Portal"}
          </button>
          
          <div className="mt-6 pt-6 border-t text-center space-y-2" style={{ borderColor: 'rgba(30, 41, 59, 0.8)' }}>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              Salon Owner or Staff member?{" "}
              <Link
                href="/portal/login"
                className="hover:underline font-medium"
                style={{ color: '#c29957' }}
              >
                Go to Staff Portal Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
