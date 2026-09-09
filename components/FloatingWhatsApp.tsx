"use client";

import React, { useState } from "react";
import { FaWhatsapp, FaTimes, FaPaperPlane } from "react-icons/fa";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  defaultMessage?: string;
  salonName?: string;
}

export default function FloatingWhatsApp({
  phoneNumber = "+97470370099",
  defaultMessage = "Hello! I would like to inquire about booking an appointment at Rospa Salon.",
  salonName = "Rospa Salon",
}: FloatingWhatsAppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  const cleanPhone = phoneNumber.replace(/\D/g, "");

  const getWhatsAppLink = (customText?: string) => {
    const textToSend = customText || message || defaultMessage;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textToSend)}`;
  };

  const handleOpenChat = (customText?: string) => {
    const link = getWhatsAppLink(customText);
    window.location.href = link;
    setIsOpen(false);
  };

  const quickMessages = [
    { label: "📅 Book Appointment", text: "Hello! I would like to book an appointment at Rospa Salon." },
    { label: "💅 Services & Prices", text: "Hi! Can you please send me your services menu and prices?" },
    { label: "📍 Location & Hours", text: "Hello! What are your salon location and working hours?" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      {/* Pop-up Chat Card */}
      {isOpen && (
        <div className="mb-4 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#075E54] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xl shadow-inner">
                <FaWhatsapp />
              </div>
              <div>
                <h4 className="font-semibold text-sm leading-tight">{salonName}</h4>
                <p className="text-[11px] text-emerald-200 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online • Replies instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close WhatsApp chat popup"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-[#ECE5DD]/40 space-y-3">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-700 leading-relaxed border border-slate-100">
              👋 Hi there! Welcome to <b>{salonName}</b>. How can we assist you with your beauty and wellness appointment today?
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col gap-1.5">
              {quickMessages.map((qm, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenChat(qm.text)}
                  className="w-full text-left bg-white/90 hover:bg-white text-slate-800 text-xs font-medium py-2 px-3 rounded-xl border border-slate-200/80 hover:border-[#25D366] hover:text-[#075E54] transition-all duration-150 shadow-xs flex items-center justify-between cursor-pointer"
                >
                  <span>{qm.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">Send ➔</span>
                </button>
              ))}
            </div>

            {/* Input & Direct Send */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOpenChat()}
                placeholder="Type your message..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#25D366] text-slate-800"
              />
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="bg-[#25D366] hover:bg-[#1ebd59] text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
                title="Send on WhatsApp"
              >
                <FaPaperPlane className="text-xs" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Button */}
      <div className="relative group">
        {!isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center">
            <span className="bg-slate-900 text-white text-xs font-medium py-1.5 px-3 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5">
              <span>Chat with us on WhatsApp</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </span>
          </div>
        )}

        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none"></span>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
          aria-label="Chat with Rospa Salon on WhatsApp"
        >
          {isOpen ? (
            <FaTimes className="text-2xl transition-transform duration-200 rotate-90" />
          ) : (
            <FaWhatsapp className="text-3xl drop-shadow-xs" />
          )}
        </button>
      </div>
    </div>
  );
}
