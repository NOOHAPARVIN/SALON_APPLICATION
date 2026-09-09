"use client";

import React, { useState, useMemo } from "react";
import { FaPrint, FaDownload, FaSyncAlt, FaCalendarAlt, FaBuilding, FaUser } from "react-icons/fa";
import * as XLSX from "xlsx";
import InvoiceDetailModal from "@/components/invoices/InvoiceDetailModal";
import CustomerDetailModal from "./CustomerDetailModal";
import { useBranch } from "@/lib/BranchContext";

export interface TransactionBookingItem {
  id: string | number;
  total?: number;
  price?: number;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  appointment_date?: string;
  created_at?: string;
  staff_name?: string;
  branch?: string;
  client_name?: string;
  customer_name?: string;
  phone?: string;
  reference?: string;
  notes?: string;
}

interface TransactionSummaryReportProps {
  companyName?: string;
  branch?: string;
  staff?: string;
  rawBookings?: TransactionBookingItem[];
}

export default function TransactionSummaryReport({
  companyName = "Rospa",
  branch = "all",
  staff = "all",
  rawBookings = [],
}: TransactionSummaryReportProps) {
  const branchCtx = useBranch();

  // Dynamically resolve company name from context if available
  let activeCompanyName = companyName;
  if (branchCtx?.companies && branchCtx?.currentCompanyId) {
    const activeComp = branchCtx.companies.find((c: any) => String(c.id) === String(branchCtx.currentCompanyId));
    if (activeComp?.name) activeCompanyName = activeComp.name;
  } else if (branch === "elan" || companyName.toLowerCase().includes("elan")) {
    activeCompanyName = "Elan Gents Salon";
  }

  // Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; phone?: string } | null>(null);

  const handleOpenInvoice = (b: TransactionBookingItem, invoiceNum: number, pType: string) => {
    setSelectedInvoice({
      invoice_number: invoiceNum,
      invoice_date: b.appointment_date ? new Date(b.appointment_date).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB"),
      location: b.branch || `${activeCompanyName} - Main Branch`,
      branch: b.branch || branch,
      customer_name: b.client_name || b.customer_name || "Guest Customer",
      customer_phone: b.phone || "N/A",
      payment_method: pType,
      staff_name: b.staff_name || "Duty Receptionist",
      services: (b as any).services || [{ name: (b as any).service_name || "Salon Treatment", price: Number(b.total || b.price || 0) }],
      amount: Number(b.total || b.price || 0),
      total: Number(b.total || b.price || 0),
      status: b.status || "Paid",
      notes: b.notes || ""
    });
  };

  const handleOpenCustomer = (b: TransactionBookingItem) => {
    setSelectedCustomer({
      name: b.client_name || b.customer_name || "Guest Customer",
      phone: b.phone || "N/A"
    });
  };

  // Date Range state (defaults to today)
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [selectedBranch, setSelectedBranch] = useState<string>(branch);
  const [selectedStaff, setSelectedStaff] = useState<string>(staff);

  // Sorting state for List of Payments
  const [sortField, setSortField] = useState<string>("appointment_date");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter bookings by date range, branch, and staff
  const filteredTransactions = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const activeBookings = rawBookings.filter((b) => {
      const bDateStr = b.appointment_date || b.created_at || "";
      if (!bDateStr) return false;
      const bDate = new Date(bDateStr);
      if (isNaN(bDate.getTime())) return false;

      const dateMatch = bDate >= start && bDate <= end;
      const branchMatch = selectedBranch === "all" || !b.branch || b.branch === selectedBranch;
      const staffMatch = selectedStaff === "all" || b.staff_name === selectedStaff || String(b.id) === selectedStaff;

      return dateMatch && branchMatch && staffMatch;
    });

    // Payments (Completed / Paid items)
    const payments = activeBookings.filter(
      (b) => b.status === "completed" || b.payment_status === "paid" || b.payment_status === "completed"
    );

    // Refunds (Cancelled items with payment recorded or refund status)
    const refunds = activeBookings.filter(
      (b) => b.status === "cancelled" && (b.payment_status === "refunded" || b.payment_status === "paid")
    );

    return {
      all: activeBookings,
      payments,
      refunds,
    };
  }, [rawBookings, startDate, endDate, selectedBranch, selectedStaff]);

  // Payment Type Summary Calculations
  const paymentTypeSummary = useMemo(() => {
    let creditCard = 0;
    let cash = 0;
    let fawran = 0;
    let coupon = 0;

    filteredTransactions.payments.forEach((b) => {
      const amt = Number(b.total || b.price || 0);
      const method = (b.payment_method || "").toLowerCase();

      if (method === "card" || method === "credit card" || method === "pos") {
        creditCard += amt;
      } else if (method === "cash") {
        cash += amt;
      } else if (method === "fawran" || method === "qr" || method === "online" || method === "bank_transfer") {
        fawran += amt;
      } else if (method === "coupon" || method === "voucher" || method === "giftcard") {
        coupon += amt;
      } else {
        creditCard += amt; // Default
      }
    });

    const total = creditCard + cash + fawran + coupon;

    return {
      creditCard,
      cash,
      fawran,
      coupon,
      total,
    };
  }, [filteredTransactions]);

  // Sorted Payments
  const sortedPayments = useMemo(() => {
    return [...filteredTransactions.payments].sort((a: any, b: any) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "amount" || sortField === "total" || sortField === "price") {
        valA = Number(a.total || a.price || 0);
        valB = Number(b.total || b.price || 0);
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions.payments, sortField, sortAsc]);

  // Format date helper
  const formatDateLabel = (dStr: string) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  // Sort toggle handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Print Handler
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${activeCompanyName.toUpperCase()} - TRANSACTION SUMMARY REPORT (${formatDateLabel(startDate)} - ${formatDateLabel(endDate)})`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  // Excel Download Handler
  const handleExportExcel = () => {
    const title = `${companyName} - Transaction Summary`;
    const dateRangeStr = `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;

    const rows = [
      [title],
      [companyName],
      [`Date Range: ${dateRangeStr}`],
      [`Location: ${selectedBranch === "all" ? "All locations" : selectedBranch}`],
      [`Staff: ${selectedStaff === "all" ? "All staff" : selectedStaff}`],
      [],
      ["Payment type summary"],
      ["Payment type", "Amount (QAR)"],
      ["Credit card", paymentTypeSummary.creditCard],
      ["Cash", paymentTypeSummary.cash],
      ["Fawran", paymentTypeSummary.fawran],
      ["Coupon / Voucher", paymentTypeSummary.coupon],
      ["Total:", paymentTypeSummary.total],
      [],
      ["List of payments"],
      ["Invoice", "Payment type", "Payment date", "Processed by", "Location", "Reference", "Customer", "Amount (QAR)"],
      ...sortedPayments.map((b, idx) => [
        13210 + idx,
        b.payment_method ? (b.payment_method.toLowerCase() === "card" ? "Credit card" : b.payment_method) : "Credit card",
        formatDateLabel(b.appointment_date || b.created_at || ""),
        b.staff_name || "Duty Receptionist",
        b.branch || "Rospa - Mirqab",
        b.reference || `REF-${b.id}`,
        b.client_name || b.customer_name || "Guest Customer",
        Number(b.total || b.price || 0),
      ]),
      ["Total:", paymentTypeSummary.total],
      [],
      ["List of refunds"],
      ["Invoice", "Payment type", "Payment date", "Processed by", "Location", "Reference", "Customer", "Amount (QAR)"],
      ...filteredTransactions.refunds.map((b, idx) => [
        14000 + idx,
        b.payment_method || "Credit card",
        formatDateLabel(b.appointment_date || b.created_at || ""),
        b.staff_name || "Duty Receptionist",
        b.branch || "Rospa - Mirqab",
        b.reference || `REF-${b.id}`,
        b.client_name || b.customer_name || "Guest Customer",
        Number(b.total || b.price || 0),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 15 }, { wch: 20 }, { wch: 22 }, { wch: 15 }, { wch: 22 }, { wch: 15 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaction Summary");

    XLSX.writeFile(wb, `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Transaction_Summary_${startDate}.xlsx`);
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Toolbar (Hidden on Print) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 text-slate-700 transition-colors shadow-xs"
          >
            <FaPrint size={12} /> Print
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 text-slate-700 transition-colors shadow-xs"
          >
            <FaDownload size={12} /> Download Excel
          </button>

          <button
            onClick={() => {
              setStartDate(todayStr);
              setEndDate(todayStr);
            }}
            className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 text-xs transition-colors"
            title="Reset filters"
          >
            <FaSyncAlt size={12} />
          </button>
        </div>

        {/* Date Range Picker Controls */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded px-2.5 py-1">
            <FaCalendarAlt className="text-gray-400" />
            <span className="font-semibold text-gray-600">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-none font-medium cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded px-2.5 py-1">
            <FaCalendarAlt className="text-gray-400" />
            <span className="font-semibold text-gray-600">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-none font-medium cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Document Content */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Transaction Summary
          </h1>
          <h2 className="text-lg font-bold text-slate-800 mb-1">{companyName}</h2>
          
          <div className="text-xs text-gray-600 space-y-0.5 font-medium">
            <p>
              {formatDateLabel(startDate)} – {formatDateLabel(endDate)}
            </p>
            <p>Location: . {selectedBranch === "all" ? "All locations" : selectedBranch}</p>
            <p>Staff: {selectedStaff === "all" ? "All staff" : selectedStaff}</p>
          </div>

          <hr className="border-t border-slate-900 mt-4 mb-6" />
        </div>

        {/* SECTION 1: PAYMENT TYPE SUMMARY */}
        <div className="mb-8 max-w-lg">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Payment type summary</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-200 text-slate-800 font-bold border-b border-gray-400 text-left">
                <th className="py-1.5 px-2">Payment type</th>
                <th className="py-1.5 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              <tr>
                <td className="py-1.5 px-2">Credit card</td>
                <td className="py-1.5 px-2 text-right font-semibold">
                  {paymentTypeSummary.creditCard.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {paymentTypeSummary.cash > 0 && (
                <tr>
                  <td className="py-1.5 px-2">Cash</td>
                  <td className="py-1.5 px-2 text-right font-semibold">
                    {paymentTypeSummary.cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              {paymentTypeSummary.fawran > 0 && (
                <tr>
                  <td className="py-1.5 px-2">Fawran / Online</td>
                  <td className="py-1.5 px-2 text-right font-semibold">
                    {paymentTypeSummary.fawran.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              {paymentTypeSummary.coupon > 0 && (
                <tr>
                  <td className="py-1.5 px-2">Coupon / Voucher</td>
                  <td className="py-1.5 px-2 text-right font-semibold">
                    {paymentTypeSummary.coupon.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-b-4 border-double border-slate-900 font-bold text-slate-900">
                <td className="py-1.5 px-2">Total:</td>
                <td className="py-1.5 px-2 text-right">
                  {paymentTypeSummary.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 2: LIST OF PAYMENTS */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-700 mb-2">List of payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200 text-slate-800 font-bold border-b border-gray-400 text-left">
                  <th
                    onClick={() => handleSort("id")}
                    className="py-1.5 px-2 cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    Invoice ↕
                  </th>
                  <th
                    onClick={() => handleSort("payment_method")}
                    className="py-1.5 px-2 cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    Payment type ↕
                  </th>
                  <th
                    onClick={() => handleSort("appointment_date")}
                    className="py-1.5 px-2 cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    Payment date ↕
                  </th>
                  <th
                    onClick={() => handleSort("staff_name")}
                    className="py-1.5 px-2 cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    Processed by ↕
                  </th>
                  <th
                    onClick={() => handleSort("branch")}
                    className="py-1.5 px-2 cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    Location ↕
                  </th>
                  <th className="py-1.5 px-2">Reference ↕</th>
                  <th
                    onClick={() => handleSort("client_name")}
                    className="py-1.5 px-2 cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    Customer ↕
                  </th>
                  <th
                    onClick={() => handleSort("total")}
                    className="py-1.5 px-2 text-right cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    Amount ↕
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {sortedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 px-2 text-center text-gray-500 italic">
                      No payments found for the selected timeframe.
                    </td>
                  </tr>
                ) : (
                  sortedPayments.map((b, idx) => {
                    const invoiceNum = 13210 + idx;
                    const pType = b.payment_method
                      ? b.payment_method.toLowerCase() === "card"
                        ? "Credit card"
                        : b.payment_method
                      : "Credit card";
                    const pDate = formatDateLabel(b.appointment_date || b.created_at || "");
                    const processedBy = b.staff_name || "Duty Receptionist";
                    const location = b.branch || `${companyName} - Main Branch`;
                    const refCode = b.reference || "";
                    const customer = b.client_name || b.customer_name || "Guest Customer";
                    const amt = Number(b.total || b.price || 0);

                    return (
                      <tr key={b.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td
                          onClick={() => handleOpenInvoice(b, invoiceNum, pType)}
                          className="py-1.5 px-2 text-blue-600 font-medium hover:underline cursor-pointer"
                        >
                          {invoiceNum}
                        </td>
                        <td className="py-1.5 px-2">{pType}</td>
                        <td className="py-1.5 px-2">{pDate}</td>
                        <td className="py-1.5 px-2">{processedBy}</td>
                        <td className="py-1.5 px-2">{location}</td>
                        <td className="py-1.5 px-2">{refCode}</td>
                        <td
                          onClick={() => handleOpenCustomer(b)}
                          className="py-1.5 px-2 text-blue-600 font-medium hover:underline cursor-pointer"
                        >
                          {customer}
                        </td>
                        <td className="py-1.5 px-2 text-right font-semibold">
                          {amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
                {sortedPayments.length > 0 && (
                  <tr className="border-t-2 border-b-4 border-double border-slate-900 font-bold text-slate-900">
                    <td colSpan={7} className="py-1.5 px-2 text-right">
                      Total:
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      {paymentTypeSummary.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: LIST OF REFUNDS */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">List of refunds</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200 text-slate-800 font-bold border-b border-gray-400 text-left">
                  <th className="py-1.5 px-2">Invoice ↕</th>
                  <th className="py-1.5 px-2">Payment type ↕</th>
                  <th className="py-1.5 px-2">Payment date ↕</th>
                  <th className="py-1.5 px-2">Processed by ↕</th>
                  <th className="py-1.5 px-2">Location ↕</th>
                  <th className="py-1.5 px-2">Reference ↕</th>
                  <th className="py-1.5 px-2">Customer ↕</th>
                  <th className="py-1.5 px-2 text-right">Amount ↕</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {filteredTransactions.refunds.length === 0 ? (
                  <tr className="border-b border-gray-300">
                    <td colSpan={8} className="py-3 px-2 text-gray-400 italic">
                      No refunds recorded.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.refunds.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-gray-50">
                      <td
                        onClick={() => handleOpenInvoice(b, 14000 + idx, b.payment_method || "Credit card")}
                        className="py-1.5 px-2 text-blue-600 font-medium hover:underline cursor-pointer"
                      >
                        {14000 + idx}
                      </td>
                      <td className="py-1.5 px-2">{b.payment_method || "Credit card"}</td>
                      <td className="py-1.5 px-2">{formatDateLabel(b.appointment_date || b.created_at || "")}</td>
                      <td className="py-1.5 px-2">{b.staff_name || "Duty Receptionist"}</td>
                      <td className="py-1.5 px-2">{b.branch || companyName}</td>
                      <td className="py-1.5 px-2">{b.reference || ""}</td>
                      <td
                        onClick={() => handleOpenCustomer(b)}
                        className="py-1.5 px-2 text-blue-600 font-medium hover:underline cursor-pointer"
                      >
                        {b.client_name || b.customer_name || "Guest Customer"}
                      </td>
                      <td className="py-1.5 px-2 text-right font-semibold text-red-600">
                        {Number(b.total || b.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          companyName={activeCompanyName}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customerName={selectedCustomer.name}
          customerPhone={selectedCustomer.phone}
          paymentsList={rawBookings}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* CSS for Paper Printing */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          nav, header, sidebar, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
