"use client";

import React, { useState, useEffect } from 'react';
import { FaBuilding, FaSave, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function OwnerSettings() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#d4af37");
  const [senderName, setSenderName] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch available companies
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch('/api/companies');
        const data = await res.json();
        if (data.success && data.companies?.length > 0) {
          setCompanies(data.companies);
          setSelectedCompanyId(data.companies[0].id);
        }
      } catch (err) {
        console.error("Failed to load companies list", err);
      }
    }
    loadCompanies();
  }, []);

  // 2. Load settings for selected company
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const url = selectedCompanyId 
          ? `/api/companies/settings?companyId=${selectedCompanyId}`
          : '/api/companies/settings';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setCompanyName(data.companyName || "");
          setLogoUrl(data.settings?.logo_url || "");
          setPrimaryColor(data.settings?.primary_color || "#d4af37");
          setSenderName(data.settings?.sender_name || "");
          setTwilioPhoneNumber(data.settings?.twilio_phone_number || "");
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [selectedCompanyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    
    try {
      const url = selectedCompanyId 
        ? `/api/companies/settings?companyId=${selectedCompanyId}`
        : '/api/companies/settings';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          targetCompanyId: selectedCompanyId,
          settings: {
            logo_url: logoUrl,
            primary_color: primaryColor,
            sender_name: senderName,
            twilio_phone_number: twilioPhoneNumber
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: "Settings saved successfully!" });
      } else {
        setMessage({ type: 'error', text: "Failed to save settings: " + data.error });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: "Error saving settings: " + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && companies.length === 0) {
    return (
      <div className="min-h-screen bg-[#fff9eb] p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c29957]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9eb] p-6 md:p-8 font-['Montserrat']">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#3a4a35] flex items-center gap-3">
            <FaBuilding className="text-[#c29957]" />
            Company & White-Label Settings
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Configure salon branding, custom theme colors, logo, and SMS/WhatsApp notification settings.
          </p>
        </div>

        {/* Company Selector Dropdown (For Super Admin / Multi-Tenant Management) */}
        {companies.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-[#e6dccb] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-[#c29957] uppercase tracking-wider mb-1">
                Select Company Workspace
              </label>
              <p className="text-xs text-gray-500">Choose which company's settings and branding to edit</p>
            </div>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="bg-[#fcfaf7] border border-[#e6dccb] text-[#3a4a35] font-bold text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c29957] min-w-[240px]"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_active === false ? '(Pending Approval)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#e6dccb] shadow-xl p-6 md:p-8 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-[#c29957] uppercase tracking-wider mb-2">
              Company Name
            </label>
            <input
              type="text"
              className="w-full bg-[#fcfaf7] border border-[#e6dccb] text-[#3a4a35] rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#c29957] font-medium"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Glamour Salon"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#c29957] uppercase tracking-wider mb-2">
              Logo URL
            </label>
            <input
              type="url"
              className="w-full bg-[#fcfaf7] border border-[#e6dccb] text-[#3a4a35] rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#c29957]"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-gray-400 text-xs mt-1">Paste a direct HTTPS image URL for your salon logo.</p>
            {logoUrl && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl inline-block">
                <img src={logoUrl} alt="Logo Preview" className="h-12 object-contain" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#c29957] uppercase tracking-wider mb-2">
              Primary Theme Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                className="w-12 h-12 bg-transparent cursor-pointer rounded-xl border-0"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <input
                type="text"
                className="flex-1 bg-[#fcfaf7] border border-[#e6dccb] text-[#3a4a35] rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#c29957] font-mono uppercase font-bold"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#D4AF37"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#c29957] uppercase tracking-wider mb-2">
              SMS / WhatsApp Sender Name
            </label>
            <input
              type="text"
              className="w-full bg-[#fcfaf7] border border-[#e6dccb] text-[#3a4a35] rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#c29957]"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Glamour Salon"
            />
            <p className="text-gray-400 text-xs mt-1">
              Used in automated SMS & WhatsApp appointment confirmations.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#c29957] uppercase tracking-wider mb-2">
              Twilio WhatsApp Sender Number
            </label>
            <input
              type="text"
              className="w-full bg-[#fcfaf7] border border-[#e6dccb] text-[#3a4a35] rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#c29957]"
              value={twilioPhoneNumber}
              onChange={(e) => setTwilioPhoneNumber(e.target.value)}
              placeholder="e.g. whatsapp:+14155238886"
            />
            <p className="text-gray-400 text-xs mt-1">
              Must include the 'whatsapp:' prefix. If left blank, default sender will be used.
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-semibold ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-xl font-bold text-white bg-[#3a4a35] hover:bg-[#2d3a29] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FaSave /> {isSaving ? "Saving Settings..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
