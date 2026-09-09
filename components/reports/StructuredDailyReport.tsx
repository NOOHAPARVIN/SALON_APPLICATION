"use client";

import React, { useState, useMemo, useEffect } from "react";
import { FaPrint, FaFileExcel, FaPlus, FaTrash, FaCalendarAlt, FaUserCheck, FaCheckCircle, FaClock, FaPaperPlane, FaSearch, FaHistory, FaSpinner, FaExclamationCircle } from "react-icons/fa";
import * as XLSX from "xlsx";
import { useBranch } from "@/lib/BranchContext";

export interface BookingReportItem {
  id: string | number;
  total: number;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  tip?: number;
  is_advance?: boolean;
  appointment_date?: string;
  created_at?: string;
}

export interface ExpenseItem {
  id: string;
  particulars: string;
  amount: number;
  remarks: string;
}

interface StructuredDailyReportProps {
  branch?: string;
  companyName?: string;
  rawBookings?: BookingReportItem[];
  giftCards?: any[];
  userRole?: string;
}

export default function StructuredDailyReport({
  branch = "all",
  companyName = "ROSPA SALON",
  rawBookings = [],
  giftCards = [],
  userRole = "receptionist",
}: StructuredDailyReportProps) {
  // Dynamically resolve company name & branches from BranchContext
  let companyBranches: string[] = [];
  let activeCompanyName = companyName;

  try {
    const branchCtx = useBranch();
    if (branchCtx?.companies && branchCtx?.currentCompanyId) {
      const activeComp = branchCtx.companies.find((c: any) => String(c.id) === String(branchCtx.currentCompanyId));
      if (activeComp?.name) {
        activeCompanyName = activeComp.name;
      }
    } else if (branch === "elan" || companyName.toUpperCase().includes("ELAN")) {
      activeCompanyName = "Elan Gents Salon";
    }

    if (branchCtx?.branchesForCurrentCompany?.length > 0) {
      companyBranches = branchCtx.branchesForCurrentCompany.map((b) => b.name);
    }
  } catch (e) {
    // Fallback if rendered outside provider
  }

  if (companyBranches.length === 0) {
    if (branch === "elan" || activeCompanyName.toUpperCase().includes("ELAN")) {
      companyBranches = ["Elan Gents Salon"];
    } else {
      companyBranches = ["B Block", "Rospa Salon - Mirqab", "Main Salon"];
    }
  }

  // State for view mode (day, week, month)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [locationName, setLocationName] = useState<string>(
    companyBranches[0] || "Main Location"
  );

  // Sync locationName if company branches update
  useEffect(() => {
    if (companyBranches.length > 0 && !companyBranches.includes(locationName) && locationName !== "All Locations") {
      setLocationName(companyBranches[0]);
    }
  }, [companyBranches, locationName]);

  // Submission & Verification State
  const [reportStatus, setReportStatus] = useState<"draft" | "submitted" | "verified">("draft");
  const [submittedBy, setSubmittedBy] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [verifiedBy, setVerifiedBy] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [apiMessage, setApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // History & Date Search State
  const [savedReportsHistory, setSavedReportsHistory] = useState<any[]>([]);

  // Manual inputs for Section D & Signatures
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [tipsPaymentCash, setTipsPaymentCash] = useState<number>(0);
  const [cashDeposited, setCashDeposited] = useState<number>(0);
  const [openingRemarks, setOpeningRemarks] = useState<string>("");
  const [cashDepositedRemarks, setCashDepositedRemarks] = useState<string>("");
  
  const [receptionistName, setReceptionistName] = useState<string>("Duty Receptionist");
  const [accountantName, setAccountantName] = useState<string>("Accountant / Manager");

  // Dynamic Expenses list for Section C
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: "1", particulars: "Tea & Refreshments", amount: 0, remarks: "" },
    { id: "2", particulars: "Laundry", amount: 0, remarks: "" },
  ]);

  // Filter bookings based on selectedDate and viewMode
  const filteredData = useMemo(() => {
    const refDate = new Date(selectedDate);
    
    // Day boundaries
    const startOfDay = new Date(refDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(refDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Week boundaries (Sunday to Saturday)
    const dayOfWeek = refDate.getDay();
    const startOfWeek = new Date(refDate);
    startOfWeek.setDate(refDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Month boundaries
    const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const checkDateInRange = (dStr: string) => {
      if (!dStr) return false;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return false;

      if (viewMode === "day") {
        return d >= startOfDay && d <= endOfDay;
      } else if (viewMode === "week") {
        return d >= startOfWeek && d <= endOfWeek;
      } else {
        return d >= startOfMonth && d <= endOfMonth;
      }
    };

    const targetBookings = rawBookings.filter((b) => {
      const bDate = b.appointment_date || b.created_at || "";
      return checkDateInRange(bDate);
    });

    const targetGiftCards = giftCards.filter((g) => {
      const gDate = g.created_at || "";
      return checkDateInRange(gDate);
    });

    return {
      bookings: targetBookings,
      giftCards: targetGiftCards,
      startDateStr: viewMode === "day"
        ? startOfDay.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : viewMode === "week"
        ? `${startOfWeek.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${endOfWeek.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
        : startOfMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    };
  }, [rawBookings, giftCards, selectedDate, viewMode]);

  // Section A Editable State (Revenue Details)
  const [revenueState, setRevenueState] = useState({
    services: 0,
    servicesRemarks: "Completed services",
    advance: 0,
    advanceRemarks: "Advance booking deposits",
    couponSales: 0,
    couponSalesRemarks: "Gift card & coupon sales",
    tipsCollectionCard: 0,
    tipsCollectionCardRemarks: "Tips collected via card",
  });

  // Section B Editable State (Collection Details)
  const [collectionState, setCollectionState] = useState({
    cash: 0,
    cashRemarks: "Cash received",
    card: 0,
    cardRemarks: "POS Card payments",
    fawran: 0,
    fawranRemarks: "QR / Fawran / Online",
    couponRedeem: 0,
    couponRedeemRemarks: "Redeemed vouchers",
    advanceSettlement: 0,
    advanceSettlementRemarks: "Adjusted deposits",
    pendingCollection: 0,
    pendingCollectionRemarks: "Uncollected balances",
  });

  // Auto-populate default calculated figures from live database whenever period/date updates
  useEffect(() => {
    let services = 0;
    let advance = 0;
    let couponSales = 0;
    let tipsCollectionCard = 0;

    filteredData.bookings.forEach((b) => {
      const isPaid = b.status === "completed" || b.payment_status === "paid" || b.payment_status === "completed";
      const amt = Number(b.total || 0);

      if (b.is_advance) {
        advance += amt;
      } else if (isPaid) {
        services += amt;
      }

      if (b.payment_method?.toLowerCase() === "card" || b.payment_method?.toLowerCase() === "online") {
        tipsCollectionCard += Number(b.tip || 0);
      }
    });

    filteredData.giftCards.forEach((g) => {
      const s = (g.status || "").toLowerCase();
      if (s === "paid" || s === "redeemed" || s === "active") {
        couponSales += Number(g.price || g.amount || 0);
      }
    });

    setRevenueState({
      services,
      servicesRemarks: "Completed services",
      advance,
      advanceRemarks: "Advance booking deposits",
      couponSales,
      couponSalesRemarks: "Gift card & coupon sales",
      tipsCollectionCard,
      tipsCollectionCardRemarks: "Tips collected via card",
    });

    let cash = 0;
    let card = 0;
    let fawran = 0;
    let couponRedeem = 0;
    let advanceSettlement = 0;
    let pendingCollection = 0;

    filteredData.bookings.forEach((b) => {
      const isPaid = b.status === "completed" || b.payment_status === "paid" || b.payment_status === "completed";
      const amt = Number(b.total || 0);
      const method = (b.payment_method || "").toLowerCase();

      if (isPaid) {
        if (method === "cash") {
          cash += amt;
        } else if (method === "card" || method === "pos") {
          card += amt;
        } else if (method === "fawran" || method === "online" || method === "qr" || method === "bank_transfer") {
          fawran += amt;
        } else if (method === "coupon" || method === "giftcard" || method === "voucher") {
          couponRedeem += amt;
        } else if (method === "advance") {
          advanceSettlement += amt;
        } else {
          card += amt;
        }
      } else if (b.status !== "cancelled") {
        pendingCollection += amt;
      }
    });

    setCollectionState({
      cash,
      cashRemarks: "Cash received",
      card,
      cardRemarks: "POS Card payments",
      fawran,
      fawranRemarks: "QR / Fawran / Online",
      couponRedeem,
      couponRedeemRemarks: "Redeemed vouchers",
      advanceSettlement,
      advanceSettlementRemarks: "Adjusted deposits",
      pendingCollection,
      pendingCollectionRemarks: "Uncollected balances",
    });
  }, [filteredData]);

  // Fetch Report History (List of all submitted/verified report dates)
  const fetchReportHistory = async () => {
    try {
      const res = await fetch("/api/reports/daily?listAll=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setSavedReportsHistory(data.history);
      }
    } catch (e) {
      console.error("Error fetching daily report history:", e);
    }
  };

  // Fetch Saved Daily Report for selected Date & Location from Database
  const fetchSavedReportForDate = async (targetDate: string) => {
    try {
      const res = await fetch(`/api/reports/daily?date=${targetDate}&branch=${locationName}`);
      const data = await res.json();

      if (data.success && data.exists && data.report) {
        const r = data.report;
        setReportStatus(r.status || "submitted");
        setSubmittedBy(r.submittedBy || "Receptionist");
        setSubmittedAt(r.submittedAt ? new Date(r.submittedAt).toLocaleString() : null);
        setVerifiedBy(r.verifiedBy || null);
        setVerifiedAt(r.verifiedAt ? new Date(r.verifiedAt).toLocaleString() : null);

        if (r.receptionistName) setReceptionistName(r.receptionistName);
        if (r.accountantName) setAccountantName(r.accountantName);

        if (r.revenue) {
          setRevenueState({
            services: Number(r.revenue.services || 0),
            servicesRemarks: r.revenue.servicesRemarks || "Completed services",
            advance: Number(r.revenue.advance || 0),
            advanceRemarks: r.revenue.advanceRemarks || "Advance booking deposits",
            couponSales: Number(r.revenue.couponSales || 0),
            couponSalesRemarks: r.revenue.couponSalesRemarks || "Gift card & coupon sales",
            tipsCollectionCard: Number(r.revenue.tipsCollectionCard || 0),
            tipsCollectionCardRemarks: r.revenue.tipsCollectionCardRemarks || "Tips collected via card",
          });
        }

        if (r.collection) {
          setCollectionState({
            cash: Number(r.collection.cash || 0),
            cashRemarks: r.collection.cashRemarks || "Cash received",
            card: Number(r.collection.card || 0),
            cardRemarks: r.collection.cardRemarks || "POS Card payments",
            fawran: Number(r.collection.fawran || 0),
            fawranRemarks: r.collection.fawranRemarks || "QR / Fawran / Online",
            couponRedeem: Number(r.collection.couponRedeem || 0),
            couponRedeemRemarks: r.collection.couponRedeemRemarks || "Redeemed vouchers",
            advanceSettlement: Number(r.collection.advanceSettlement || 0),
            advanceSettlementRemarks: r.collection.advanceSettlementRemarks || "Adjusted deposits",
            pendingCollection: Number(r.collection.pendingCollection || 0),
            pendingCollectionRemarks: r.collection.pendingCollectionRemarks || "Uncollected balances",
          });
        }

        if (Array.isArray(r.expenses) && r.expenses.length > 0) {
          setExpenses(r.expenses);
        } else {
          setExpenses([
            { id: "1", particulars: "Tea & Refreshments", amount: 0, remarks: "" },
            { id: "2", particulars: "Laundry", amount: 0, remarks: "" },
          ]);
        }

        if (r.cashReport) {
          setOpeningBalance(Number(r.cashReport.openingBalance || 0));
          setTipsPaymentCash(Number(r.cashReport.tipsPayment || 0));
          setCashDeposited(Number(r.cashReport.deposited || 0));
          setOpeningRemarks(r.cashReport.openingRemarks || "");
          setCashDepositedRemarks(r.cashReport.depositedRemarks || "");
        } else {
          setOpeningBalance(0);
          setTipsPaymentCash(0);
          setCashDeposited(0);
          setOpeningRemarks("");
          setCashDepositedRemarks("");
        }
      } else {
        // Reset status to draft & clear all manual inputs/expenses for unsubmitted dates (Fresh report)
        setReportStatus("draft");
        setSubmittedBy(null);
        setSubmittedAt(null);
        setVerifiedBy(null);
        setVerifiedAt(null);
        setExpenses([
          { id: "1", particulars: "Tea & Refreshments", amount: 0, remarks: "" },
          { id: "2", particulars: "Laundry", amount: 0, remarks: "" },
        ]);
        setOpeningBalance(0);
        setTipsPaymentCash(0);
        setCashDeposited(0);
        setOpeningRemarks("");
        setCashDepositedRemarks("");
        setReceptionistName("Duty Receptionist");
        setAccountantName("Accountant / Manager");
      }
    } catch (e) {
      console.error("Error fetching saved daily report:", e);
    }
  };

  useEffect(() => {
    setApiMessage(null);
    fetchSavedReportForDate(selectedDate);
    fetchReportHistory();
  }, [selectedDate, locationName]);

  const totalRevenue = useMemo(() => {
    return revenueState.services + revenueState.advance + revenueState.couponSales + revenueState.tipsCollectionCard;
  }, [revenueState]);

  const totalCollection = useMemo(() => {
    return (
      collectionState.cash +
      collectionState.card +
      collectionState.fawran +
      collectionState.couponRedeem +
      collectionState.advanceSettlement +
      collectionState.pendingCollection
    );
  }, [collectionState]);

  // Section C Computations: Expense Details
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [expenses]);

  // Section D Computations: Cash Report Reconciliation
  const cashReport = useMemo(() => {
    const cashCollection = collectionState.cash;
    const cashExpenses = totalExpenses;
    const tipsPayment = tipsPaymentCash;
    const deposited = cashDeposited;

    const closingBalance = openingBalance + cashCollection - cashExpenses - tipsPayment - deposited;

    return {
      openingBalance,
      cashCollection,
      cashExpenses,
      tipsPayment,
      deposited,
      closingBalance,
    };
  }, [openingBalance, collectionState.cash, totalExpenses, tipsPaymentCash, cashDeposited]);

  // Expense Handlers
  const handleAddExpense = () => {
    setExpenses([
      ...expenses,
      { id: Date.now().toString(), particulars: "", amount: 0, remarks: "" },
    ]);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleUpdateExpense = (id: string, field: keyof ExpenseItem, value: any) => {
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  // Submit Daily Report (Receptionist action)
  const handleSubmitReport = async () => {
    setSubmitting(true);
    setApiMessage(null);
    try {
      const payload = {
        date: selectedDate,
        branch: locationName,
        revenue: { ...revenueState, total: totalRevenue },
        collection: { ...collectionState, total: totalCollection },
        expenses,
        cashReport,
        receptionistName,
        accountantName,
      };

      const res = await fetch("/api/reports/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setReportStatus("submitted");
        setSubmittedBy(receptionistName);
        setSubmittedAt(new Date().toLocaleString());
        setApiMessage({ type: "success", text: `Daily report for ${selectedDate} submitted successfully to database!` });
        await fetchReportHistory();
      } else {
        setApiMessage({ type: "error", text: data.error || "Failed to submit report." });
      }
    } catch (e: any) {
      setApiMessage({ type: "error", text: e.message || "Network error while submitting report." });
    } finally {
      setSubmitting(false);
    }
  };

  // Mark as Verified (Owner action)
  const handleVerifyReport = async () => {
    setVerifying(true);
    setApiMessage(null);
    try {
      const payload = {
        date: selectedDate,
        branch: locationName,
        verifiedBy: accountantName || "Owner / Manager",
        status: "verified",
      };

      const res = await fetch("/api/reports/daily", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setReportStatus("verified");
        setVerifiedBy(payload.verifiedBy);
        setVerifiedAt(new Date().toLocaleString());
        setApiMessage({ type: "success", text: `Daily report for ${selectedDate} MARKED AS VERIFIED!` });
        await fetchReportHistory();
      } else {
        setApiMessage({ type: "error", text: data.error || "Failed to verify report." });
      }
    } catch (e: any) {
      setApiMessage({ type: "error", text: e.message || "Network error while verifying report." });
    } finally {
      setVerifying(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${activeCompanyName.toUpperCase()} - ${viewMode.toUpperCase()} STATEMENT REPORT (${filteredData.startDateStr})`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    const title = `${activeCompanyName.toUpperCase()} - ${viewMode.toUpperCase()} STATEMENT REPORT`;
    
    const rows = [
      [title],
      [`Location: ${locationName}`, `Date / Period: ${filteredData.startDateStr}`],
      [`Status: ${reportStatus.toUpperCase()}`, `Submitted By: ${submittedBy || "Receptionist"}`],
      [],
      ["A. Revenue Details"],
      ["Particulars", "Amount (QAR)", "Remarks"],
      ["Services", revenueState.services, revenueState.servicesRemarks],
      ["Advance", revenueState.advance, revenueState.advanceRemarks],
      ["Coupon Sales", revenueState.couponSales, revenueState.couponSalesRemarks],
      ["Tips Collection in Card", revenueState.tipsCollectionCard, revenueState.tipsCollectionCardRemarks],
      ["TOTAL REVENUE", totalRevenue, ""],
      [],
      ["B. Collection Details"],
      ["Particulars", "Amount (QAR)", "Remarks"],
      ["Cash", collectionState.cash, collectionState.cashRemarks],
      ["Card", collectionState.card, collectionState.cardRemarks],
      ["Fawran", collectionState.fawran, collectionState.fawranRemarks],
      ["Coupon Redeem", collectionState.couponRedeem, collectionState.couponRedeemRemarks],
      ["Advance Settlement", collectionState.advanceSettlement, collectionState.advanceSettlementRemarks],
      ["Pending for Collection", collectionState.pendingCollection, collectionState.pendingCollectionRemarks],
      ["TOTAL COLLECTIONS", totalCollection, ""],
      [],
      ["C. Expense Details"],
      ["Particulars", "Amount (QAR)", "Remarks"],
      ...expenses.map((e) => [e.particulars || "Expense", e.amount, e.remarks]),
      ["TOTAL EXPENSES", totalExpenses, ""],
      [],
      ["D. Cash Report"],
      ["Particulars", "Amount (QAR)", "Remarks"],
      ["Opening Balance", cashReport.openingBalance, openingRemarks],
      ["Add: Cash Collection", cashReport.cashCollection, "Cash Collections from Section B"],
      ["Less: Cash Expenses", cashReport.cashExpenses, "Total Expenses from Section C"],
      ["Less: Tips Payment", cashReport.tipsPayment, "Cash Tips Paid Out"],
      ["Less: Cash Deposited / Given", cashReport.deposited, cashDepositedRemarks],
      ["CLOSING BALANCE", cashReport.closingBalance, "Net Cash Handled"],
      [],
      [],
      ["Prepared By:", receptionistName, "Verified By:", accountantName],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 35 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Statement");

    const cleanCompName = activeCompanyName.replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `${cleanCompName}_${viewMode.toUpperCase()}_Report_${selectedDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Screen Controls Header (Hidden on Print) */}
      <div className="print:hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FaUserCheck className="text-[#5c54b6]" />
              Official Financial Statement Report
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              Structured Daily, Weekly, and Monthly revenue, collections, expenses, submission, and owner verification.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Switcher (Owner & Super Admin Only) */}
            {(userRole === "owner" || userRole === "super_admin") && (
              <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-semibold">
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    viewMode === "day" ? "bg-[#5c54b6] text-white shadow-sm" : "text-gray-600 hover:text-slate-900"
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    viewMode === "week" ? "bg-[#5c54b6] text-white shadow-sm" : "text-gray-600 hover:text-slate-900"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    viewMode === "month" ? "bg-[#5c54b6] text-white shadow-sm" : "text-gray-600 hover:text-slate-900"
                  }`}
                >
                  Monthly
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors shadow-sm cursor-pointer"
            >
              <FaPrint /> Print / PDF
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
            >
              <FaFileExcel /> Export Excel
            </button>
          </div>
        </div>

        {/* Date Search & Saved History Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <FaSearch className="text-[#5c54b6]" /> Search Report by Date:
            </span>

            {/* Date Search Input */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-700 shadow-sm">
              <FaCalendarAlt className="text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none bg-transparent font-semibold cursor-pointer"
              />
            </div>

            {/* Saved Reports History Selector */}
            {savedReportsHistory.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">or pick saved:</span>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-[#5c54b6]"
                >
                  <option value="">-- History Saved Reports --</option>
                  {savedReportsHistory.map((item) => (
                    <option key={item.id} value={item.date}>
                      {item.date} [{item.status.toUpperCase()}] ({item.submitted_by})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Submission & Verification Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Receptionist Submit Button (Shown ONLY in Receptionist Portal) */}
            {!(userRole === "owner" || userRole === "super_admin") && (
              <button
                onClick={handleSubmitReport}
                disabled={submitting}
                className="flex items-center gap-2 bg-[#5c54b6] hover:bg-[#4b439c] text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? <FaSpinner className="animate-spin text-xs" /> : <FaPaperPlane className="text-xs" />}
                <span>{reportStatus === "draft" ? "Submit Daily Report" : "Update Submitted Report"}</span>
              </button>
            )}

            {/* Owner Mark as Verified Button (Shown ONLY in Owner Portal) */}
            {(userRole === "owner" || userRole === "super_admin") && (
              <button
                onClick={handleVerifyReport}
                disabled={verifying || reportStatus === "verified"}
                className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer ${
                  reportStatus === "verified"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {verifying ? <FaSpinner className="animate-spin text-xs" /> : <FaCheckCircle className="text-xs" />}
                <span>{reportStatus === "verified" ? "Verified by Owner" : "Mark as Verified"}</span>
              </button>
            )}
          </div>
        </div>

        {/* API Notification Alert */}
        {apiMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            apiMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            <FaExclamationCircle className="text-sm" />
            <span>{apiMessage.text}</span>
          </div>
        )}
      </div>

      {/* Status Banner Bar (Printed & Screen) */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs font-bold ${
        reportStatus === "verified"
          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
          : reportStatus === "submitted"
          ? "bg-amber-50 text-amber-900 border-amber-200"
          : "bg-gray-50 text-gray-700 border-gray-200"
      }`}>
        <div className="flex items-center gap-2.5">
          {reportStatus === "verified" ? (
            <FaCheckCircle className="text-emerald-600 text-lg" />
          ) : reportStatus === "submitted" ? (
            <FaClock className="text-amber-600 text-lg" />
          ) : (
            <FaHistory className="text-gray-400 text-lg" />
          )}
          <div>
            <p className="font-extrabold uppercase tracking-wider text-sm">
              Status: {reportStatus === "verified" ? "VERIFIED BY OWNER" : reportStatus === "submitted" ? "SUBMITTED - PENDING OWNER VERIFICATION" : "DRAFT / LIVE DATA"}
            </p>
            {submittedAt && (
              <p className="text-[11px] font-medium opacity-80 mt-0.5">
                Submitted by <span className="font-bold">{submittedBy}</span> on {submittedAt}
              </p>
            )}
            {verifiedAt && (
              <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                Verified by <span className="font-bold">{verifiedBy}</span> on {verifiedAt}
              </p>
            )}
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${
          reportStatus === "verified" ? "bg-emerald-600 text-white" : reportStatus === "submitted" ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-700"
        }`}>
          ● {reportStatus}
        </span>
      </div>

      {/* Structured Document Container (Target for Display & Print) */}
      <div className="bg-white p-6 md:p-10 rounded-2xl border border-gray-200 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-slate-900 font-sans">
        
        {/* Document Header */}
        <div className="text-center border-b border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
            {viewMode === "day" ? "Daily Report" : viewMode === "week" ? "Weekly Report" : "Monthly Report"}
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">{activeCompanyName.toUpperCase()}</p>
          
          <div className="flex justify-between items-center mt-6 text-sm font-medium border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">Location:</span>
              <select
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="border-b border-dotted border-gray-400 outline-none px-2 py-0.5 font-semibold text-slate-800 bg-transparent cursor-pointer print:border-none print:appearance-none text-sm"
              >
                {companyBranches.map((bName) => (
                  <option key={bName} value={bName}>
                    {bName}
                  </option>
                ))}
                {companyBranches.length > 1 && <option value="All Locations">All Locations</option>}
              </select>
            </div>
            <div>
              <span className="font-bold text-gray-700">Date: </span>
              <span className="font-semibold text-slate-800">{filteredData.startDateStr}</span>
            </div>
          </div>
        </div>

        {/* SECTION A: REVENUE DETAILS */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-800 mb-2">A. Revenue Details:</h3>
          <table className="w-full border-collapse border border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-800 text-left">
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/2">Particulars</th>
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/4 text-right">Amount (QAR)</th>
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Services</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={revenueState.services || ""}
                    onChange={(e) => setRevenueState({ ...revenueState, services: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={revenueState.servicesRemarks}
                    onChange={(e) => setRevenueState({ ...revenueState, servicesRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Advance</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={revenueState.advance || ""}
                    onChange={(e) => setRevenueState({ ...revenueState, advance: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={revenueState.advanceRemarks}
                    onChange={(e) => setRevenueState({ ...revenueState, advanceRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Coupon Sales</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={revenueState.couponSales || ""}
                    onChange={(e) => setRevenueState({ ...revenueState, couponSales: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={revenueState.couponSalesRemarks}
                    onChange={(e) => setRevenueState({ ...revenueState, couponSalesRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Tips Collection in Card</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={revenueState.tipsCollectionCard || ""}
                    onChange={(e) => setRevenueState({ ...revenueState, tipsCollectionCard: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={revenueState.tipsCollectionCardRemarks}
                    onChange={(e) => setRevenueState({ ...revenueState, tipsCollectionCardRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-800 px-3 py-2">Total</td>
                <td className="border border-gray-800 px-3 py-2 text-right">{totalRevenue.toFixed(2)}</td>
                <td className="border border-gray-800 px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION B: COLLECTION DETAILS */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-800 mb-2">B. Collection Details:</h3>
          <table className="w-full border-collapse border border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-800 text-left">
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/2">Particulars</th>
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/4 text-right">Amount (QAR)</th>
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Cash</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionState.cash || ""}
                    onChange={(e) => setCollectionState({ ...collectionState, cash: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={collectionState.cashRemarks}
                    onChange={(e) => setCollectionState({ ...collectionState, cashRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Card</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionState.card || ""}
                    onChange={(e) => setCollectionState({ ...collectionState, card: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={collectionState.cardRemarks}
                    onChange={(e) => setCollectionState({ ...collectionState, cardRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Fawran</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionState.fawran || ""}
                    onChange={(e) => setCollectionState({ ...collectionState, fawran: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={collectionState.fawranRemarks}
                    onChange={(e) => setCollectionState({ ...collectionState, fawranRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Coupon Redeem</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionState.couponRedeem || ""}
                    onChange={(e) => setCollectionState({ ...collectionState, couponRedeem: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={collectionState.couponRedeemRemarks}
                    onChange={(e) => setCollectionState({ ...collectionState, couponRedeemRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Advance Settlement</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionState.advanceSettlement || ""}
                    onChange={(e) => setCollectionState({ ...collectionState, advanceSettlement: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={collectionState.advanceSettlementRemarks}
                    onChange={(e) => setCollectionState({ ...collectionState, advanceSettlementRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Pending for Collection</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionState.pendingCollection || ""}
                    onChange={(e) => setCollectionState({ ...collectionState, pendingCollection: parseFloat(e.target.value) || 0 })}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    value={collectionState.pendingCollectionRemarks}
                    onChange={(e) => setCollectionState({ ...collectionState, pendingCollectionRemarks: e.target.value })}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-800 px-3 py-2">Total</td>
                <td className="border border-gray-800 px-3 py-2 text-right">{totalCollection.toFixed(2)}</td>
                <td className="border border-gray-800 px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION C: EXPENSE DETAILS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-800">C. Expense Details:</h3>
            <button
              onClick={handleAddExpense}
              className="print:hidden text-xs font-semibold text-[#5c54b6] hover:text-purple-800 flex items-center gap-1"
            >
              <FaPlus size={10} /> Add Expense Row
            </button>
          </div>
          <table className="w-full border-collapse border border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-800 text-left">
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/2">Particulars</th>
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/4 text-right">Amount (QAR)</th>
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="group">
                  <td className="border border-gray-800 px-3 py-1.5">
                    <input
                      type="text"
                      list="expense-particulars-list"
                      placeholder="Expense item name..."
                      value={expense.particulars}
                      onChange={(e) => handleUpdateExpense(expense.id, "particulars", e.target.value)}
                      className="w-full outline-none bg-transparent font-medium"
                    />
                    <datalist id="expense-particulars-list">
                      <option value="Laundry" />
                      <option value="Tea & Refreshments" />
                      <option value="Cleaning & Towel Service" />
                      <option value="Salon Supplies" />
                      <option value="Water & Electricity" />
                      <option value="Staff Snacks & Meals" />
                      <option value="Maintenance & Repairs" />
                      <option value="Courier & Transport" />
                    </datalist>
                  </td>
                  <td className="border border-gray-800 px-3 py-1.5 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={expense.amount || ""}
                      onChange={(e) => handleUpdateExpense(expense.id, "amount", parseFloat(e.target.value) || 0)}
                      className="w-full outline-none bg-transparent text-right font-semibold"
                    />
                  </td>
                  <td className="border border-gray-800 px-3 py-1.5 relative">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={expense.remarks}
                        onChange={(e) => handleUpdateExpense(expense.id, "remarks", e.target.value)}
                        className="w-full outline-none bg-transparent text-xs text-gray-600"
                      />
                      {expenses.length > 1 && (
                        <button
                          onClick={() => handleRemoveExpense(expense.id)}
                          className="print:hidden text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove item"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-800 px-3 py-2">Total</td>
                <td className="border border-gray-800 px-3 py-2 text-right">{totalExpenses.toFixed(2)}</td>
                <td className="border border-gray-800 px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION D: CASH REPORT */}
        <div className="mb-8">
          <h3 className="text-base font-bold text-slate-800 mb-2">D. Cash Report:</h3>
          <table className="w-full border-collapse border border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-800 text-left">
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/2">Particulars</th>
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/4 text-right">Amount (QAR)</th>
                <th className="border border-gray-800 px-3 py-2 font-bold w-1/4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Opening Balance</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingBalance || ""}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full outline-none bg-transparent text-right font-semibold"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    placeholder="Remarks..."
                    value={openingRemarks}
                    onChange={(e) => setOpeningRemarks(e.target.value)}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Add: Cash Collection</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right font-semibold">{cashReport.cashCollection.toFixed(2)}</td>
                <td className="border border-gray-800 px-3 py-1.5 text-xs text-gray-600">Auto from Section B Cash</td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Less: Cash Expenses</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right font-semibold text-red-600">({cashReport.cashExpenses.toFixed(2)})</td>
                <td className="border border-gray-800 px-3 py-1.5 text-xs text-gray-600">Auto from Section C Total</td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Less: Tips Payment</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tipsPaymentCash || ""}
                    onChange={(e) => setTipsPaymentCash(parseFloat(e.target.value) || 0)}
                    className="w-full outline-none bg-transparent text-right font-semibold text-red-600"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5 text-xs text-gray-600">Cash tips handed out</td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-3 py-1.5 font-medium">Less: Cash Deposited / Given</td>
                <td className="border border-gray-800 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashDeposited || ""}
                    onChange={(e) => setCashDeposited(parseFloat(e.target.value) || 0)}
                    className="w-full outline-none bg-transparent text-right font-semibold text-red-600"
                  />
                </td>
                <td className="border border-gray-800 px-3 py-1.5">
                  <input
                    type="text"
                    placeholder="Bank deposit / handed to owner..."
                    value={cashDepositedRemarks}
                    onChange={(e) => setCashDepositedRemarks(e.target.value)}
                    className="w-full outline-none bg-transparent text-xs text-gray-600"
                  />
                </td>
              </tr>
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-800">
                <td className="border border-gray-800 px-3 py-2 text-base">Closing Balance</td>
                <td className="border border-gray-800 px-3 py-2 text-right text-base font-extrabold text-slate-900">
                  {cashReport.closingBalance.toFixed(2)}
                </td>
                <td className="border border-gray-800 px-3 py-2 text-xs text-gray-700">Net physical cash on hand</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FOOTER SIGNATURES */}
        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-gray-200 mt-12">
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-8">Prepared By:</p>
            <input
              type="text"
              value={receptionistName}
              onChange={(e) => setReceptionistName(e.target.value)}
              className="w-full border-b border-gray-800 outline-none font-semibold text-slate-800 pb-1 bg-transparent"
              placeholder="Receptionist Name"
            />
            <p className="text-xs text-gray-500 mt-1 font-medium">Receptionist / Duty Staff</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-8">Verified By:</p>
            <input
              type="text"
              value={accountantName}
              onChange={(e) => setAccountantName(e.target.value)}
              className="w-full border-b border-gray-800 outline-none font-semibold text-slate-800 pb-1 bg-transparent"
              placeholder="Accountant / Manager Name"
            />
            <p className="text-xs text-gray-500 mt-1 font-medium">Accountant / Salon Owner</p>
          </div>
        </div>

      </div>

      {/* Global CSS for Paper Printing */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          nav, header, sidebar, .print\\:hidden {
            display: none !important;
          }
          input {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
