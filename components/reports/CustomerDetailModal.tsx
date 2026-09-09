"use client";

import React from "react";
import { FaTimes, FaUser, FaPhoneAlt, FaEnvelope, FaCalendarCheck, FaMoneyBillWave, FaHistory, FaCheckCircle } from "react-icons/fa";

interface CustomerDetailModalProps {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentsList: any[];
  onClose: () => void;
}

export default function CustomerDetailModal({
  customerName,
  customerPhone = "N/A",
  customerEmail = "N/A",
  paymentsList = [],
  onClose,
}: CustomerDetailModalProps) {
  if (!customerName) return null;

  // Filter payments associated with this customer
  const customerPayments = paymentsList.filter((b) => {
    const cName = (b.client_name || b.customer_name || "Guest Customer").toLowerCase();
    return cName === customerName.toLowerCase() || cName.includes(customerName.toLowerCase());
  });

  const totalSpent = customerPayments.reduce((sum, b) => sum + Number(b.total || b.price || b.amount || 0), 0);
  const totalVisits = customerPayments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200 animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5c54b6] flex items-center justify-center font-bold text-white text-base shadow-sm">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{customerName}</h3>
              <p className="text-xs text-gray-400">Customer CRM Profile & Order History</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50/60 border border-purple-100 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-[#5c54b6] text-white rounded-xl">
                <FaMoneyBillWave className="text-lg" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Spent</p>
                <p className="text-lg font-bold text-slate-900">QR {totalSpent.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                <FaCalendarCheck className="text-lg" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Visits</p>
                <p className="text-lg font-bold text-slate-900">{totalVisits} {totalVisits === 1 ? "Visit" : "Visits"}</p>
              </div>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
            <h4 className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Contact Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium">
              <p className="flex items-center gap-2">
                <FaUser className="text-[#5c54b6]" /> <span className="font-bold text-slate-900">{customerName}</span>
              </p>
              <p className="flex items-center gap-2">
                <FaPhoneAlt className="text-gray-400" /> <span>{customerPhone}</span>
              </p>
            </div>
          </div>

          {/* Payment History Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FaHistory className="text-[#5c54b6]" /> Transaction & Service History
            </h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Service / Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerPayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-3 text-center text-gray-500 italic">
                        No transactions recorded for this customer in selected period.
                      </td>
                    </tr>
                  ) : (
                    customerPayments.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {p.appointment_date || p.created_at ? new Date(p.appointment_date || p.created_at).toLocaleDateString("en-GB") : "N/A"}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-800">{p.service_name || "Salon Treatment"}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{p.payment_method || "Payment"}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <FaCheckCircle className="text-[9px]" /> Paid
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          QR {Number(p.total || p.price || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
