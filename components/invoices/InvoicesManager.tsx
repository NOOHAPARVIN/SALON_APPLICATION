"use client";

import React, { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaPrint, FaEye, FaSpinner, FaFilter, FaCalendarAlt, FaBuilding, FaExclamationCircle } from "react-icons/fa";
import { useBranch } from "@/lib/BranchContext";
import InvoiceDetailModal from "./InvoiceDetailModal";

interface InvoiceItem {
  service: string;
  staff?: string;
  price: number;
  quantity: number;
}

export default function InvoicesManager() {
  const { currentBranch, availableBranches, branchesForCurrentCompany, companies, currentCompanyId } = useBranch();
  const branches = branchesForCurrentCompany?.length > 0 ? branchesForCurrentCompany : availableBranches;

  const [activeTab, setActiveTab] = useState<"view" | "create">("view");

  // Filters State
  const [dateRange, setDateRange] = useState<string>("last_7_days");
  const [selectedBranch, setSelectedBranch] = useState<string>(currentBranch || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");

  // Data State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<string>("invoice_number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Create Invoice Form State
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formBranch, setFormBranch] = useState(currentBranch || "rospa");
  const [formPaymentMethod, setFormPaymentMethod] = useState("Cash");
  const [formStatus, setFormStatus] = useState("Paid");
  const [formInvoiceDate, setFormInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { service: "Salon Service", staff: "", price: 50, quantity: 1 }
  ]);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Derive company name for headers
  let companyName = "ROSPA SALON";
  if (companies && currentCompanyId) {
    const activeCompany = companies.find((c: any) => String(c.id) === String(currentCompanyId));
    if (activeCompany?.name) {
      companyName = activeCompany.name;
    } else if (currentBranch === "elan") {
      companyName = "Elan Gents Salon";
    }
  } else if (currentBranch === "elan") {
    companyName = "Elan Gents Salon";
  }

  // Keep branch inputs in sync with global branch selector
  useEffect(() => {
    if (currentBranch) {
      setSelectedBranch(currentBranch);
      if (currentBranch !== "all") {
        setFormBranch(currentBranch);
      }
    }
  }, [currentBranch]);

  // Fetch Invoices from Database API
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("dateRange", dateRange);
      params.append("branch", selectedBranch);
      if (appliedSearch) params.append("search", appliedSearch);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [dateRange, selectedBranch, appliedSearch, currentBranch]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery);
  };

  // Handle Sort column click
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sorted Invoices list
  const sortedInvoices = [...invoices].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "amount") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else if (sortField === "invoice_number") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      aVal = String(aVal || "").toLowerCase();
      bVal = String(bVal || "").toLowerCase();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handle Create Item Row
  const handleAddItem = () => {
    setFormItems([...formItems, { service: "", staff: "", price: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const totalInvoiceAmount = formItems.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);

  // Submit Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim()) {
      setCreateMessage({ type: "error", text: "Please enter customer name." });
      return;
    }

    setCreating(true);
    setCreateMessage(null);

    try {
      const payload = {
        customer_name: formCustomerName,
        customer_phone: formCustomerPhone,
        branch: formBranch,
        payment_method: formPaymentMethod,
        status: formStatus,
        invoice_date: formInvoiceDate,
        due_date: formDueDate,
        services: formItems,
        notes: formNotes,
        total_amount: totalInvoiceAmount,
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setCreateMessage({ type: "success", text: `Invoice #${data.invoice?.invoice_number || ""} saved successfully!` });
        // Reset form
        setFormCustomerName("");
        setFormCustomerPhone("");
        setFormNotes("");
        setFormItems([{ service: "Salon Service", staff: "", price: 50, quantity: 1 }]);
        
        // Refresh invoices list and switch back to view
        await fetchInvoices();
        setTimeout(() => {
          setActiveTab("view");
          setCreateMessage(null);
        }, 1200);
      } else {
        setCreateMessage({ type: "error", text: data.error || "Failed to create invoice." });
      }
    } catch (err: any) {
      setCreateMessage({ type: "error", text: err.message || "Network error while saving invoice." });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header & View / Create Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Navigation Mode Pill Buttons strictly matching user reference screenshot */}
          <button
            onClick={() => setActiveTab("view")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "view"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            View invoices
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "create"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Create invoices
          </button>
        </div>

        {/* Filter Controls Row (Shown on View tab) matching exact screenshot UI layout */}
        {activeTab === "view" && (
          <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto">
            {/* Date range dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-semibold">for</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-[#5c54b6]"
              >
                <option value="last_7_days">Last 7 days</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="all_time">All Time</option>
              </select>
            </div>

            {/* Location / Branch dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-semibold">at</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-[#5c54b6]"
              >
                <option value="all">All locations</option>
                {branches && branches.length > 0 ? (
                  branches.map((b: any) => (
                    <option key={b.id} value={b.name || b.id}>
                      {b.name || b.location_name || b.id}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="rospa">Rospa - Mirqab - E302</option>
                    <option value="elan">Elan Gents Salon</option>
                  </>
                )}
              </select>
            </div>

            {/* Filter View Submit Button */}
            <button
              onClick={fetchInvoices}
              className="bg-[#5c54b6] hover:bg-[#4b439c] text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
            >
              <FaFilter className="text-[10px]" /> View
            </button>

            {/* Search by invoice # or Customer input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1 ml-auto md:ml-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by invoice #"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 placeholder-gray-400 focus:outline-none focus:border-[#5c54b6] w-44 md:w-52"
                />
              </div>
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 rounded-lg transition-colors cursor-pointer"
                title="Search invoices"
              >
                <FaSearch className="text-xs" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === "view" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
              <FaSpinner className="animate-spin text-3xl text-[#5c54b6]" />
              <p className="text-xs font-semibold">Loading invoices from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700 border-collapse">
                {/* Table Headers matching reference image */}
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[11px] tracking-wider select-none">
                  <tr>
                    <th onClick={() => handleSort("invoice_number")} className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-1">Invoice # <span>↕</span></div>
                    </th>
                    <th onClick={() => handleSort("type")} className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-1">Type <span>↕</span></div>
                    </th>
                    <th onClick={() => handleSort("customer_name")} className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-1">Customer <span>↕</span></div>
                    </th>
                    <th onClick={() => handleSort("location")} className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-1">Location <span>↕</span></div>
                    </th>
                    <th onClick={() => handleSort("status")} className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-1">Status <span>↕</span></div>
                    </th>
                    <th onClick={() => handleSort("invoice_date")} className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-1">Invoice date <span>↕</span></div>
                    </th>
                    <th onClick={() => handleSort("due_date")} className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-1">Due date <span>↕</span></div>
                    </th>
                    <th onClick={() => handleSort("ref_number")} className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-1">Ref # <span>↕</span></div>
                    </th>
                    <th onClick={() => handleSort("amount")} className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-end gap-1">Amount <span>↕</span></div>
                    </th>
                    <th className="py-3 px-4 text-center">Invoice options</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {sortedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-400 font-medium">
                        No invoices found for the selected date range or search criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedInvoices.map((inv: any, idx: number) => (
                      <tr key={inv.id || idx} className="hover:bg-indigo-50/40 transition-colors">
                        {/* Invoice # */}
                        <td className="py-3 px-4 font-bold text-[#5c54b6] hover:underline cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                          {inv.invoice_number}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 text-slate-700 font-medium">{inv.type}</td>

                        {/* Customer */}
                        <td className="py-3 px-4 font-semibold text-slate-900">{inv.customer_name}</td>

                        {/* Location */}
                        <td className="py-3 px-4 text-gray-600">{inv.location}</td>

                        {/* Status badge */}
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold text-white uppercase tracking-wider ${
                            inv.status === "Paid" ? "bg-emerald-600" :
                            inv.status === "Refunded" ? "bg-red-600" : "bg-amber-500"
                          }`}>
                            {inv.status}
                          </span>
                        </td>

                        {/* Invoice date */}
                        <td className="py-3 px-4 text-gray-600">{inv.invoice_date}</td>

                        {/* Due date */}
                        <td className="py-3 px-4 text-gray-600">{inv.due_date}</td>

                        {/* Ref # */}
                        <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">{inv.ref_number}</td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          QR{Number(inv.amount).toFixed(2)}
                        </td>

                        {/* Invoice Options */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-3 text-xs font-semibold">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="text-[#5c54b6] hover:text-[#4b439c] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FaPrint /> Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Create Invoices Tab Form */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create New Sale Invoice</h2>
            <p className="text-xs text-gray-500 mt-1">Issue a new invoice directly to a customer and save it in the database.</p>
          </div>

          {createMessage && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
              createMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <FaExclamationCircle className="text-sm" />
              <span>{createMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateInvoice} className="space-y-6">
            {/* Customer & Branch Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ayesha Al-Thani"
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +974 5555 1234"
                  value={formCustomerPhone}
                  onChange={(e) => setFormCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Branch</label>
                <select
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                >
                  {branches && branches.length > 0 ? (
                    branches.map((b: any) => (
                      <option key={b.id} value={b.name || b.id}>{b.name || b.id}</option>
                    ))
                  ) : (
                    <>
                      <option value="rospa">Rospa - Mirqab - E302</option>
                      <option value="elan">Elan Gents Salon</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit card">Credit card</option>
                  <option value="Fawran">Fawran</option>
                  <option value="Coupon">Coupon</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={formInvoiceDate}
                  onChange={(e) => setFormInvoiceDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Line Items / Services</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[#5c54b6] hover:text-[#4b439c] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FaPlus /> Add Line Item
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Service / Product Name</th>
                      <th className="py-2.5 px-3">Stylist (Optional)</th>
                      <th className="py-2.5 px-3 text-right">Price (QR)</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Haircut & Blowdry"
                            value={item.service}
                            onChange={(e) => handleItemChange(idx, "service", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Stylist name"
                            value={item.staff}
                            onChange={(e) => handleItemChange(idx, "staff", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, "price", parseFloat(e.target.value) || 0)}
                            className="w-24 border border-gray-300 rounded-lg p-1.5 text-xs text-right text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value, 10) || 1)}
                            className="w-16 border border-gray-300 rounded-lg p-1.5 text-xs text-center text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                          />
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          QR {(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 font-bold text-xs"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary Row */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-xs font-bold uppercase text-gray-500">Total Invoice Amount:</span>
              <span className="text-2xl font-black text-slate-900">QR {totalInvoiceAmount.toFixed(2)}</span>
            </div>

            {/* Form Submit Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("view")}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="bg-[#5c54b6] hover:bg-[#4b439c] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {creating ? <FaSpinner className="animate-spin text-sm" /> : <FaPlus />}
                <span>Save Invoice to Database</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Detail Modal for View / Print */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          companyName={companyName}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
