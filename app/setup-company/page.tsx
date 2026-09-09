"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaBuilding, FaUser, FaEnvelope, FaLock, FaCheckCircle, FaExclamationCircle, FaArrowRight } from 'react-icons/fa';

function SetupCompanyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteEmail = searchParams?.get('email') || '';

  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ companyName: string; loginUrl: string } | null>(null);

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!companyName.trim()) {
      setErrorMessage('Please enter your Salon or Company Name.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/setup-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          ownerName,
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to set up workspace.');
      }

      setSuccessData({
        companyName: data.company.name,
        loginUrl: data.loginUrl
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5 font-['Montserrat']">
        <div className="max-w-md w-full bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center text-3xl">
            <FaCheckCircle />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">🎉 Workspace Created!</h2>
            <p className="text-slate-300 text-sm">
              Your salon workspace <strong className="text-emerald-400">{successData.companyName}</strong> has been successfully configured.
            </p>
          </div>
          <button
            onClick={() => router.push(successData.loginUrl)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            Go to Salon Sign-In <FaArrowRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5 font-['Montserrat'] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c29957]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-slate-800 shadow-2xl relative z-10 text-white space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-[#c29957]/15 text-[#c29957] border border-[#c29957]/30 text-[10px] font-bold uppercase tracking-widest rounded-full">
            Workspace Invitation
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Set Up Your Salon Workspace
          </h1>
          <p className="text-slate-400 text-xs font-light">
            Enter your salon details and choose your password to get started.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <FaExclamationCircle className="shrink-0" />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Salon / Company Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Elegance Beauty Salon"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]/30 transition-all text-sm font-medium"
              />
              <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Owner Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Sarah Mitchell"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]/30 transition-all text-sm font-medium"
              />
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Account Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]/30 transition-all text-sm font-medium"
              />
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Create Password *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]/30 transition-all text-sm font-medium"
              />
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-800 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]/30 transition-all text-sm font-medium"
              />
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-[#c29957] to-[#b0894b] text-slate-950 font-bold text-sm hover:from-[#b0894b] hover:to-[#9f793b] transition-all duration-300 shadow-lg shadow-[#c29957]/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Setting Up Workspace..." : "Complete Setup & Launch Workspace"} <FaArrowRight />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetupCompanyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-[#c29957]">Loading Setup...</div>}>
      <SetupCompanyForm />
    </Suspense>
  );
}
