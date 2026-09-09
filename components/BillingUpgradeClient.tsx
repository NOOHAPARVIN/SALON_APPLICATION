"use client";

import { useState } from "react";
import { FaCreditCard, FaUniversity, FaCoins } from "react-icons/fa";

export default function BillingUpgradeClient({ companyName }: { companyName: string }) {
  const [interval, setInterval] = useState<"monthly" | "annual">("annual");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
  const [loading, setLoading] = useState(false);
  
  const monthlyPrice = 20;
  const annualPrice = 16;
  
  const currentTotal = interval === "monthly" ? monthlyPrice : annualPrice;

  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      
      {/* LEFT COLUMN: Payment Details */}
      <div className="flex-1 p-8 md:p-10">
        <div className="mb-8">
          <div className="inline-block px-3 py-1 bg-purple-600 text-white font-bold text-xs rounded-lg mb-4">
            POPULAR
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Upgrade to Plus</h2>
          <p className="text-gray-500 text-sm">Do more with unlimited bookings, staff management, and custom domains.</p>
        </div>

        <form action="/api/stripe/create-checkout-session" method="POST" onSubmit={() => setLoading(true)}>
          <input type="hidden" name="interval" value={interval} />
          <input type="hidden" name="paymentMethod" value={paymentMethod} />
          
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</label>
            <input 
              type="text" 
              defaultValue={companyName}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium text-slate-800"
              placeholder="Account Name"
            />
          </div>

          <div className="mb-8">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Details</label>
            <div className="grid grid-cols-2 gap-4">
              {/* Credit Card */}
              <div 
                onClick={() => setPaymentMethod("card")}
                className={`rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer relative shadow-sm transition-all ${
                  paymentMethod === "card" 
                    ? "border-2 border-slate-900 bg-white" 
                    : "border border-gray-200 bg-gray-50 hover:bg-white"
                }`}
              >
                <FaCreditCard className={`${paymentMethod === "card" ? "text-slate-800" : "text-gray-500"} text-xl mb-2`} />
                <span className={`text-xs ${paymentMethod === "card" ? "font-bold text-slate-800" : "font-medium text-gray-600"}`}>
                  Credit Card
                </span>
                {paymentMethod === "card" && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500"></div>
                )}
              </div>
              
              {/* Bank Transfer */}
              <div 
                onClick={() => setPaymentMethod("bank")}
                className={`rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer relative shadow-sm transition-all ${
                  paymentMethod === "bank" 
                    ? "border-2 border-slate-900 bg-white" 
                    : "border border-gray-200 bg-gray-50 hover:bg-white"
                }`}
              >
                <FaUniversity className={`${paymentMethod === "bank" ? "text-slate-800" : "text-gray-500"} text-xl mb-2`} />
                <span className={`text-xs ${paymentMethod === "bank" ? "font-bold text-slate-800" : "font-medium text-gray-600"}`}>
                  Bank Transfer
                </span>
                {paymentMethod === "bank" && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500"></div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="button" className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-[2] py-3.5 px-4 bg-purple-200 hover:bg-purple-300 text-purple-700 font-bold rounded-xl transition-colors disabled:opacity-50">
              {loading ? "Redirecting..." : "Subscribe"}
            </button>
          </div>
          
          <p className="text-xs text-gray-400 mt-6 leading-relaxed">
            By providing your card information, you allow us to charge your card for future payment in accordance with our terms.
          </p>
        </form>
      </div>

      {/* RIGHT COLUMN: Plan Selection */}
      <div className="lg:w-[400px] bg-slate-50 p-8 md:p-10 border-t lg:border-t-0 lg:border-l border-gray-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Starter Plan</h3>
        
        <div className="space-y-4 mb-8">
          {/* Monthly Option */}
          <div 
            onClick={() => setInterval("monthly")}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 bg-white ${
              interval === "monthly" ? "border-slate-300 shadow-sm" : "border-transparent shadow-sm hover:border-gray-200"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${interval === "monthly" ? "border-slate-400" : "border-gray-300"}`}>
               {interval === "monthly" && <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>}
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Pay Monthly</h4>
              <p className="text-sm text-gray-500">${monthlyPrice} / Month</p>
            </div>
          </div>

          {/* Annual Option */}
          <div 
            onClick={() => setInterval("annual")}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
              interval === "annual" ? "border-purple-300 bg-purple-50 shadow-sm" : "border-transparent bg-white shadow-sm hover:border-gray-200"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${interval === "annual" ? "border-purple-500" : "border-gray-300"}`}>
               {interval === "annual" && <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800">Pay Annual</h4>
              <p className="text-sm text-gray-500">${annualPrice} / Month</p>
            </div>
            <div className="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
              Save 20%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-6 border-t border-b border-gray-200 mb-6">
          <span className="text-xl font-bold text-slate-800">Total</span>
          <span className="text-2xl font-extrabold text-slate-900">${currentTotal} / Month</span>
        </div>

        <div className="flex items-start gap-3 text-xs text-gray-500">
          <svg width="16" height="16" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p>Guaranteed to be safe & secure, ensuring that all transactions are protected with the highest level of security.</p>
        </div>
      </div>
    </div>
  );
}
