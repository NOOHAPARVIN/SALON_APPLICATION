"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { FaBuilding, FaUser, FaEnvelope, FaLock, FaSpinner } from "react-icons/fa";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [salonName, setSalonName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Hit our custom signup API to provision the workspace
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonName, fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to sign up");
      }

      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("fetch failed") || msg.includes("Failed to fetch")) {
        setErrorMsg("Network connection timeout. Please verify your internet connection and try again.");
      } else {
        setErrorMsg(msg || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl max-w-lg w-full text-center shadow-2xl border border-gray-700 space-y-5">
          <div className="w-16 h-16 bg-amber-500/20 text-[#d4af37] rounded-full flex items-center justify-center text-3xl mx-auto border border-[#d4af37]/30">
            ⏳
          </div>
          <h2 className="text-2xl font-bold text-white">Registration Request Submitted!</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Thank you for registering <strong className="text-white">{salonName}</strong>. Your workspace creation request has been sent to our Super Admin for review.
          </p>
          <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700 text-xs text-gray-400 text-left space-y-2">
            <p className="font-semibold text-gray-300">📋 Next Steps:</p>
            <p>1. Super Admin will review your workspace details.</p>
            <p>2. Once approved, your workspace will be activated instantly.</p>
            <p>3. You can log in using <strong className="text-gray-200">{email}</strong> after approval.</p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push("/portal/login")}
              className="w-full py-3 bg-[#d4af37] text-gray-900 rounded-lg font-bold hover:bg-[#b5952f] transition-colors"
            >
              Go to Sign In Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Workspace</h1>
          <p className="text-gray-400">Start managing your salon effortlessly.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Salon / Company Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <FaBuilding />
              </div>
              <input
                type="text"
                required
                autoComplete="off"
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                placeholder="Glamour Studio"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Your Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <FaUser />
              </div>
              <input
                type="text"
                required
                autoComplete="off"
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <FaEnvelope />
              </div>
              <input
                type="email"
                required
                autoComplete="off"
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <FaLock />
              </div>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#d4af37] hover:bg-[#b5952f] text-gray-900 font-bold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-[#d4af37] hover:underline font-medium">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
