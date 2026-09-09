"use client";

import { useState, useEffect } from "react";
import { FaStar, FaRegStar, FaSpinner, FaCheckCircle, FaLock } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function ReviewForm() {
  const [form, setForm] = useState({
    name: "",
    service: "",
    stylist: "",
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowLoginRequired(true);
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setForm({ name: "", service: "", stylist: "", rating: 5, comment: "" });
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl mx-auto border border-gray-100">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaCheckCircle className="text-4xl text-green-500" />
        </div>
        <h3 className="text-3xl font-bold text-slate-800 mb-4 font-['Playfair_Display']">Thank You!</h3>
        <p className="text-slate-600 text-lg">Your review has been submitted successfully. We appreciate your feedback!</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-8 text-[#d4af37] font-semibold hover:underline"
        >
          Submit another review
        </button>
      </div>
    );
  }

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    setUser(data.user);
    setShowLoginRequired(false);
    setLoginLoading(false);
    
    // Auto-submit the review after successful login
    handleSubmit(new Event('submit') as unknown as React.FormEvent);
  };

  if (loadingAuth) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl mx-auto border border-gray-100 flex justify-center py-20">
        <FaSpinner className="animate-spin text-4xl text-[#d4af37]" />
      </div>
    );
  }

  if (showLoginRequired) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl mx-auto border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab]"></div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-3xl text-[#d4af37]" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-['Playfair_Display']">Login Required</h3>
          <p className="text-slate-500 text-sm mt-2">Please sign in to submit your review.</p>
        </div>

        {loginError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 text-center">
            {loginError}
          </div>
        )}

        <form onSubmit={handleInlineLogin} className="space-y-4 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="Email Address"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center"
          >
            {loginLoading ? <FaSpinner className="animate-spin text-xl" /> : "Sign In & Submit"}
          </button>
        </form>

        <button 
          onClick={() => setShowLoginRequired(false)}
          className="block w-full mt-6 text-sm text-slate-500 hover:text-slate-700 underline text-center"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl mx-auto border border-gray-100 relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab]"></div>
      
      <div className="text-center mb-10">
        <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 font-['Playfair_Display']">Leave a Review</h3>
        <p className="text-slate-600">We would love to hear about your experience at Rospa Salon.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Stars */}
        <div className="flex flex-col items-center justify-center space-y-3 mb-8">
          <label className="text-sm font-bold text-slate-600 uppercase tracking-widest">Your Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setForm({ ...form, rating: star })}
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              >
                {star <= form.rating ? (
                  <FaStar className="text-4xl text-[#ffc107] drop-shadow-sm" />
                ) : (
                  <FaRegStar className="text-4xl text-gray-200" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Name *</label>
            <input
              type="text"
              required
              placeholder="Your Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Service Received</label>
            <input
              type="text"
              placeholder="e.g. Balayage, Hydra Facial"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37] transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Stylist / Therapist Name</label>
          <input
            type="text"
            placeholder="Who provided your service?"
            value={form.stylist}
            onChange={(e) => setForm({ ...form, stylist: e.target.value })}
            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37] transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Your Review</label>
          <textarea
            rows={4}
            placeholder="Tell us about your experience..."
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37] transition-all resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-[#d4af37] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-lg shadow-black/10"
        >
          {submitting ? (
            <><FaSpinner className="animate-spin" /> Submitting...</>
          ) : (
            "Submit Review"
          )}
        </button>
      </form>
    </div>
  );
}
