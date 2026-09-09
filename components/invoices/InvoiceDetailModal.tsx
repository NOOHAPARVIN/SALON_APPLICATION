"use client";

import React from "react";
import { FaTimes, FaPrint, FaReceipt, FaBuilding, FaUser, FaPhoneAlt, FaCalendarAlt } from "react-icons/fa";
import { useBranch } from "@/lib/BranchContext";

interface InvoiceDetailModalProps {
  invoice: any;
  companyName?: string;
  onClose: () => void;
}

export default function InvoiceDetailModal({ invoice, companyName = "ROSPA SALON", onClose }: InvoiceDetailModalProps) {
  if (!invoice) return null;

  // Resolve active company name dynamically from context or invoice data
  let activeCompanyName = companyName;
  try {
    const branchCtx = useBranch();
    const targetCompId = invoice?.company_id || branchCtx?.currentCompanyId;
    if (branchCtx?.companies && targetCompId) {
      const foundComp = branchCtx.companies.find((c: any) => String(c.id) === String(targetCompId));
      if (foundComp?.name) activeCompanyName = foundComp.name;
    } else if (invoice?.location?.toLowerCase().includes("elan") || invoice?.branch?.toLowerCase().includes("elan")) {
      activeCompanyName = "Elan Gents Salon";
    }
  } catch (e) {}

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${activeCompanyName.toUpperCase()} - INVOICE #${invoice.invoice_number}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const services = Array.isArray(invoice.services) ? invoice.services : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white text-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 print:shadow-none print:border-none print:max-w-none print:w-full print:m-0 print:rounded-none">
        
        {/* Header (Hidden on Print) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaReceipt className="text-[#5c54b6] text-xl" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Invoice #{invoice.invoice_number}</h3>
              <p className="text-xs text-gray-400">Official Salon Transaction Receipt</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#5c54b6] hover:bg-[#4b439c] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <FaPrint /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 space-y-6">
          {/* Company & Invoice Info Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase">{activeCompanyName}</h1>
              <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                <FaBuilding className="text-gray-400" /> {invoice.location || "Rospa - Mirqab - E302"}
              </p>
              <p className="text-xs text-gray-500">Doha, State of Qatar</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                invoice.status === "Paid" ? "bg-emerald-100 text-emerald-800" :
                invoice.status === "Refunded" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
              }`}>
                ● {invoice.status}
              </span>
              <p className="text-lg font-bold text-slate-900">Invoice #{invoice.invoice_number}</p>
              <p className="text-xs text-gray-500 flex items-center sm:justify-end gap-1">
                <FaCalendarAlt className="text-gray-400" /> {invoice.invoice_date}
              </p>
              <p className="text-[11px] text-gray-400">Ref #: {invoice.ref_number}</p>
            </div>
          </div>

          {/* Customer Details Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Customer Info</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <FaUser className="text-[#5c54b6]" /> {invoice.customer_name}
              </p>
              {invoice.customer_phone && (
                <p className="text-gray-600 flex items-center gap-1.5 mt-1">
                  <FaPhoneAlt className="text-gray-400" /> {invoice.customer_phone}
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Payment Details</span>
              <p className="text-slate-700">Payment Method: <span className="font-bold text-slate-900 capitalize">{invoice.payment_method || "Cash"}</span></p>
              <p className="text-slate-700">Transaction Type: <span className="font-semibold text-slate-900">{invoice.type || "Sale"}</span></p>
            </div>
          </div>

          {/* Itemized Services Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Itemized Summary</h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Service / Product</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-4 text-slate-800 font-medium">
                        Standard Salon Service
                      </td>
                    </tr>
                  ) : (
                    services.map((item: any, idx: number) => {
                      const qty = Number(item.quantity) || 1;
                      const itemPrice = Number(item.price) || 0;
                      const lineTotal = itemPrice * qty;

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{item.service || item.service_name || item.name || "Salon Treatment"}</p>
                            {item.staff && <p className="text-[10px] text-gray-400">Stylist: {item.staff}</p>}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-700">{qty}</td>
                          <td className="py-3 px-4 text-right text-gray-600">QR {itemPrice.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">QR {lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Notes Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1 max-w-xs">
              {invoice.notes && (
                <p><span className="font-bold text-slate-700">Notes:</span> {invoice.notes}</p>
              )}
              <p className="text-[11px] text-gray-400 italic">Thank you for visiting {activeCompanyName}. We look forward to serving you again!</p>
            </div>

            <div className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>QR {Number(invoice.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax / VAT (0%):</span>
                <span>QR 0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total:</span>
                <span className="text-[#5c54b6]">QR {Number(invoice.amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer (Hidden on Print) */}
        <div className="print:hidden bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
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
