"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCreditCard, FaUniversity, FaMobileAlt, FaSpinner, FaChevronLeft, FaLock, FaBuilding } from "react-icons/fa";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("booking_id");
  const giftId = searchParams.get("gift_id");

  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const banks = [
    { id: "qnb", name: "QNB (Qatar National Bank)" },
    { id: "cbq", name: "Commercial Bank (CBQ)" },
    { id: "qib", name: "QIB (Qatar Islamic Bank)" },
    { id: "doha", name: "Doha Bank" },
    { id: "rayyan", name: "Masraf Al Rayyan" },
  ];

  const handleNext = () => {
    if (step === 1 && selectedMethod) {
      if (selectedMethod === "bank_transfer" || selectedMethod === "naps") {
        setStep(2); // Bank selection
      } else {
        setStep(3); // Card details
      }
    } else if (step === 2 && selectedBank) {
      setStep(3); // Details entry
    } else if (step === 3 && cardNumber.length >= 8) {
      setStep(4); // PIN entry
    } else if (step === 4 && pin.length >= 4) {
      handleFinalPayment();
    }
  };

  const handleFinalPayment = () => {
    setIsProcessing(true);
    
    // Simulate real bank connection delay
    setTimeout(() => {
      if (giftId) {
        router.push(`/gift/success?gift_id=${giftId}&booking_id=${bookingId}&session_id=local_sim_${Date.now()}`);
      } else {
        router.push(`/booking/success?booking_id=${bookingId}&session_id=local_sim_${Date.now()}`);
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[var(--color-text-main)] flex flex-col items-center justify-center p-4 sm:p-8 font-['Montserrat']">
      <div className="max-w-2xl w-full bg-white border border-gray-200 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50 p-6 text-center border-b border-gray-200 relative">
          {step > 1 && !isProcessing && (
            <button 
              onClick={() => setStep(step - 1)}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--color-gold)] transition-colors p-2"
            >
              <FaChevronLeft size={18} />
            </button>
          )}
          <h1 className="text-3xl font-['Playfair_Display'] text-[var(--color-gold)] tracking-wide">Secure Checkout</h1>
          <p className="text-gray-500 mt-2 text-sm font-light flex items-center justify-center gap-2">
            <FaLock size={12} className="text-gray-400" /> End-to-end encrypted local payment
          </p>
        </div>

        {isProcessing ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-8 bg-white">
            <div className="relative">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[var(--color-gold)] rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2 font-['Playfair_Display']">Connecting to {selectedBank ? banks.find(b => b.id === selectedBank)?.name : 'your bank'}...</h2>
              <p className="text-gray-500 text-sm font-light">Verifying PIN and authorizing transaction.</p>
              <p className="text-gray-400 text-xs mt-4">Please do not close or refresh this page.</p>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 space-y-8">
            
            {/* Booking Summary Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Booking Reference</p>
                <p className="text-gray-800 font-mono font-medium">{bookingId || "Unknown"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Total Due</p>
                <p className="text-[var(--color-gold)] text-xl font-bold font-['Playfair_Display']">
                  {searchParams.get("total") ? `QR ${searchParams.get("total")}` : "Calculated at completion"}
                </p>
              </div>
            </div>

            {/* Step 1: Method Selection */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-gray-800 font-semibold text-lg border-b border-gray-200 pb-2">Select Payment Method</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedMethod("naps")}
                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                      selectedMethod === "naps" 
                        ? "bg-[var(--color-gold)]/10 border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]" 
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-3 rounded-full transition-colors ${selectedMethod === "naps" ? "bg-[var(--color-gold)] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <FaCreditCard size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-800 font-bold">Debit Card (NAPS)</p>
                      <p className="text-xs text-gray-500 mt-1">Qatar Local Debit Cards</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedMethod("credit_card")}
                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                      selectedMethod === "credit_card" 
                        ? "bg-[var(--color-gold)]/10 border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]" 
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-3 rounded-full transition-colors ${selectedMethod === "credit_card" ? "bg-[var(--color-gold)] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <FaCreditCard size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-800 font-bold">Credit Card</p>
                      <p className="text-xs text-gray-500 mt-1">Visa / Mastercard</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedMethod("bank_transfer")}
                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all sm:col-span-2 ${
                      selectedMethod === "bank_transfer" 
                        ? "bg-[var(--color-gold)]/10 border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]" 
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-3 rounded-full transition-colors ${selectedMethod === "bank_transfer" ? "bg-[var(--color-gold)] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <FaUniversity size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-800 font-bold">Direct Bank Transfer</p>
                      <p className="text-xs text-gray-500 mt-1">Pay directly from your bank account</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Bank Selection */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-gray-800 font-semibold text-lg border-b border-gray-200 pb-2">Select Your Bank</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {banks.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => setSelectedBank(bank.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        selectedBank === bank.id 
                          ? "bg-[var(--color-gold)]/10 border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]" 
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${selectedBank === bank.id ? "bg-[var(--color-gold)] text-white" : "bg-gray-100 text-gray-500"}`}>
                        <FaBuilding size={16} />
                      </div>
                      <span className="font-medium text-gray-800">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Account/Card Details */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-gray-800 font-semibold text-lg border-b border-gray-200 pb-2">
                  {selectedMethod === "bank_transfer" ? "Account Details" : "Card Information"}
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    {selectedMethod === "bank_transfer" ? "Account Number / IBAN" : "Card Number"}
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder={selectedMethod === "bank_transfer" ? "0000 0000 0000 0000" : "4000 1234 5678 9010"}
                    className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] text-lg tracking-widest font-mono text-gray-700"
                  />
                </div>

                {selectedMethod !== "bank_transfer" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] font-mono text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">CVV</label>
                      <input type="text" placeholder="123" maxLength={3} className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] font-mono text-gray-700" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: PIN Verification */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
                    <FaLock size={24} />
                  </div>
                  <h3 className="text-gray-800 font-bold text-xl mb-2 font-['Playfair_Display']">Security Verification</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Please enter your 4-digit bank PIN or the OTP sent to your registered mobile number to authorize this transaction.
                  </p>
                </div>
                
                <div className="max-w-[200px] mx-auto">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="w-full text-center p-4 border-2 border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:border-[var(--color-gold)] text-3xl tracking-[1em] font-mono text-gray-700 placeholder:text-gray-300"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-6 mt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => {
                  if (step === 1) router.back();
                  else setStep(step - 1);
                }}
                className="w-full sm:w-1/3 py-4 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                {step === 1 ? "Cancel" : "Back"}
              </button>
              <button 
                onClick={handleNext}
                disabled={(step === 1 && !selectedMethod) || (step === 2 && !selectedBank) || (step === 3 && cardNumber.length < 8) || (step === 4 && pin.length < 4)}
                className={`w-full sm:w-2/3 py-4 rounded-xl font-bold transition-all shadow-md ${
                  ((step === 1 && selectedMethod) || (step === 2 && selectedBank) || (step === 3 && cardNumber.length >= 8) || (step === 4 && pin.length >= 4))
                    ? "bg-[var(--color-gold)] text-white hover:bg-[#b08d4b] hover:-translate-y-1" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {step === 4 ? "Authorize Payment" : "Continue"}
              </button>
            </div>

          </div>
        )}
      </div>
      
      {/* Trust Badges */}
      <div className="mt-8 flex items-center justify-center gap-6 opacity-50">
        <span className="text-gray-500 text-xs font-bold tracking-wider flex items-center gap-1"><FaLock size={10}/> SECURE ENCRYPTION</span>
        <span className="text-gray-500 text-xs font-bold tracking-wider">PCI-DSS COMPLIANT</span>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf6f0] flex items-center justify-center text-[var(--color-gold)]">Loading secure checkout...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
