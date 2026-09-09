"use client";

import React, { useState } from "react";
import { FaFileExcel, FaMoneyBillWave, FaCalendarCheck, FaUsers, FaChartLine, FaGift, FaHandHoldingUsd, FaFileAlt, FaTable, FaReceipt } from "react-icons/fa";
import * as XLSX from "xlsx";
import ReportsLocationFilter from "./ReportsLocationFilter";
import StructuredDailyReport from "./StructuredDailyReport";
import TransactionSummaryReport from "./TransactionSummaryReport";
import { useBranch } from "@/lib/BranchContext";

interface RevenueSummaryProps {
  advancedData?: any;
  allTimeframes?: {
    day?: any;
    week?: any;
    month?: any;
    year?: any;
  };
  currentBranch?: string;
  currentStaff?: string;
  currentService?: string;
  staffList?: { id: number | string; name: string }[];
  servicesList?: { id?: number | string; name: string; title?: string }[];
  userRole?: string;
}

export default function RevenueSummary({ 
  advancedData, 
  allTimeframes, 
  currentBranch = "all", 
  currentStaff = "all",
  currentService = "all",
  staffList = [],
  servicesList = [],
  userRole = "receptionist"
}: RevenueSummaryProps) {
  const [reportTab, setReportTab] = useState<"transaction" | "matrix">("transaction");
  const [activeTimeframe, setActiveTimeframe] = useState<"day" | "week" | "month" | "year" | "comparison">("month");
  const [hideEmptyRows, setHideEmptyRows] = useState<boolean>(false);

  // Retrieve current active timeframe data
  const selectedData = activeTimeframe === "comparison" 
    ? (allTimeframes?.month || advancedData) 
    : (allTimeframes?.[activeTimeframe] || advancedData);

  const totalSales = selectedData?.business?.sales || 0;
  const cashSales = selectedData?.business?.cashSales || 0;
  const cardSales = selectedData?.business?.cardSales || 0;
  const giftCardsSold = selectedData?.business?.giftCardsSold || 0;
  const tipsLiability = selectedData?.business?.tipsLiability || 0;
  const appointments = selectedData?.activity?.appointments || 0;
  const clients = selectedData?.activity?.clients || 0;
  const avgBookingValue = appointments > 0 ? Math.round(totalSales / appointments) : 0;
  const chartData = selectedData?.business?.chartData || [];

  let companyName = "ROSPA SALON";
  const branchCtx = useBranch();
  if (branchCtx?.companies && branchCtx?.currentCompanyId) {
    const activeCompany = branchCtx.companies.find((c: any) => String(c.id) === String(branchCtx.currentCompanyId));
    if (activeCompany?.name) {
      companyName = activeCompany.name;
    } else if (currentBranch === 'elan') {
      companyName = "Elan Gents Salon";
    }
  } else if (currentBranch === 'elan') {
    companyName = "Elan Gents Salon";
  }

  // Handle Excel (.xlsx) Download
  const handleDownloadExcel = () => {
    const timeLabel = activeTimeframe.toUpperCase();
    const dateStr = new Date().toISOString().split("T")[0];

    // Sheet 1: Executive Revenue Summary
    const executiveSummaryData = [
      [`${companyName.toUpperCase()} - REVENUE SUMMARY REPORT`],
      [`Generated Date: ${new Date().toLocaleString()}`],
      [`Timeframe Scope: ${timeLabel}`],
      [`Location Filter: ${currentBranch === "all" ? "All Locations" : currentBranch}`],
      [`Staff Filter: ${currentStaff === "all" ? "All Staff" : currentStaff}`],
      [`Service Filter: ${currentService === "all" ? "All Services" : currentService}`],
      [],
      ["METRIC", "DAY", "WEEK", "MONTH", "YEAR"],
      [
        "Total Revenue (QR)",
        allTimeframes?.day?.business?.sales || 0,
        allTimeframes?.week?.business?.sales || 0,
        allTimeframes?.month?.business?.sales || 0,
        allTimeframes?.year?.business?.sales || 0,
      ],
      [
        "Cash Sales (QR)",
        allTimeframes?.day?.business?.cashSales || 0,
        allTimeframes?.week?.business?.cashSales || 0,
        allTimeframes?.month?.business?.cashSales || 0,
        allTimeframes?.year?.business?.cashSales || 0,
      ],
      [
        "Card Sales (QR)",
        allTimeframes?.day?.business?.cardSales || 0,
        allTimeframes?.week?.business?.cardSales || 0,
        allTimeframes?.month?.business?.cardSales || 0,
        allTimeframes?.year?.business?.cardSales || 0,
      ],
      [
        "Total Bookings",
        allTimeframes?.day?.activity?.appointments || 0,
        allTimeframes?.week?.activity?.appointments || 0,
        allTimeframes?.month?.activity?.appointments || 0,
        allTimeframes?.year?.activity?.appointments || 0,
      ],
      [
        "Average Ticket Value (QR)",
        (allTimeframes?.day?.activity?.appointments || 0) > 0 ? Math.round((allTimeframes?.day?.business?.sales || 0) / allTimeframes?.day?.activity?.appointments) : 0,
        (allTimeframes?.week?.activity?.appointments || 0) > 0 ? Math.round((allTimeframes?.week?.business?.sales || 0) / allTimeframes?.week?.activity?.appointments) : 0,
        (allTimeframes?.month?.activity?.appointments || 0) > 0 ? Math.round((allTimeframes?.month?.business?.sales || 0) / allTimeframes?.month?.activity?.appointments) : 0,
        (allTimeframes?.year?.activity?.appointments || 0) > 0 ? Math.round((allTimeframes?.year?.business?.sales || 0) / allTimeframes?.year?.activity?.appointments) : 0,
      ],
      [
        "Gift Cards Sold",
        allTimeframes?.day?.business?.giftCardsSold || 0,
        allTimeframes?.week?.business?.giftCardsSold || 0,
        allTimeframes?.month?.business?.giftCardsSold || 0,
        allTimeframes?.year?.business?.giftCardsSold || 0,
      ],
      [
        "Staff Tips Liability (QR)",
        allTimeframes?.day?.business?.tipsLiability || 0,
        allTimeframes?.week?.business?.tipsLiability || 0,
        allTimeframes?.month?.business?.tipsLiability || 0,
        allTimeframes?.year?.business?.tipsLiability || 0,
      ],
    ];

    // Sheet 2: Period Financial Ledger
    const ledgerHeader = ["Date / Period", "Total Revenue (QR)", "Cash Sales (QR)", "Card Sales (QR)", "Total Bookings", "Completed Bookings", "Avg Booking Value (QR)"];
    const ledgerRows = chartData.map((row: any) => {
      const rowSales = row.sales || 0;
      const rowCash = row.cashSales || 0;
      const rowCard = row.cardSales || 0;
      const rowBookings = row.bookings || 0;
      const rowCompleted = row.completedBookings || 0;
      const rowAvg = rowBookings > 0 ? Math.round(rowSales / rowBookings) : 0;

      return [
        row.label || row.date,
        rowSales,
        rowCash,
        rowCard,
        rowBookings,
        rowCompleted,
        rowAvg
      ];
    });

    // Subtotal Row for Ledger
    const totalRevenueLedger = chartData.reduce((acc: number, r: any) => acc + (r.sales || 0), 0);
    const totalCashLedger = chartData.reduce((acc: number, r: any) => acc + (r.cashSales || 0), 0);
    const totalCardLedger = chartData.reduce((acc: number, r: any) => acc + (r.cardSales || 0), 0);
    const totalBookingsLedger = chartData.reduce((acc: number, r: any) => acc + (r.bookings || 0), 0);
    const totalCompletedLedger = chartData.reduce((acc: number, r: any) => acc + (r.completedBookings || 0), 0);
    const overallAvg = totalBookingsLedger > 0 ? Math.round(totalRevenueLedger / totalBookingsLedger) : 0;

    const ledgerTotalRow = ["TOTAL", totalRevenueLedger, totalCashLedger, totalCardLedger, totalBookingsLedger, totalCompletedLedger, overallAvg];

    const ledgerData = [ledgerHeader, ...ledgerRows, [], ledgerTotalRow];

    // Sheet 3: Top Services & Top Stylists
    const topServices = selectedData?.topServices || [];
    const topStylists = selectedData?.topStylists || [];

    const topServicesData = [
      ["TOP PERFORMING SERVICES"],
      ["Service Name", "Bookings Count", "Revenue (QR)", "Popularity %"],
      ...topServices.map((s: any) => [s.name, s.count, s.revenue, `${s.pct}%`]),
      [],
      ["TOP PERFORMING STYLISTS"],
      ["Stylist Name", "Completed Bookings", "Revenue (QR)", "Rating"],
      ...topStylists.map((s: any) => [s.name, s.bookings, s.revenue, `Rating: ${s.rating}`]),
    ];

    // Create Workbook
    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(executiveSummaryData);
    const wsLedger = XLSX.utils.aoa_to_sheet(ledgerData);
    const wsTopPerformers = XLSX.utils.aoa_to_sheet(topServicesData);

    // Auto-fit column widths
    wsSummary["!cols"] = [{ wch: 28 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    wsLedger["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 22 }];
    wsTopPerformers["!cols"] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Revenue Summary");
    XLSX.utils.book_append_sheet(wb, wsLedger, `${timeLabel} Ledger`);
    XLSX.utils.book_append_sheet(wb, wsTopPerformers, "Top Performers");

    // Write file & trigger download
    const filePrefix = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `${filePrefix}_Revenue_Summary_${timeLabel}_${dateStr}.xlsx`);
  };

  const rawBookings = advancedData?.month?.allBookings || advancedData?.allBookings || advancedData?.completed || [];
  const rawGiftCards = advancedData?.month?.allGiftCards || advancedData?.allGiftCards || [];

  return (
    <div className="space-y-6">
      {/* Top Report View Selector Tabs (Print Hidden) */}
      <div className="print:hidden bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
        <button
          onClick={() => setReportTab("transaction")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            reportTab === "transaction"
              ? "bg-[#5c54b6] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FaReceipt /> Transaction Summary
        </button>

        <button
          onClick={() => setReportTab("matrix")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            reportTab === "matrix"
              ? "bg-[#5c54b6] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FaTable /> Revenue Ledger & Analytics
        </button>
      </div>

      {reportTab === "transaction" ? (
        <TransactionSummaryReport
          branch={currentBranch}
          companyName={companyName}
          rawBookings={rawBookings}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Title & Actions Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5c54b6]/10 text-[#5c54b6] flex items-center justify-center font-bold text-sm">
                  <FaChartLine />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Period Revenue Ledger & Analytics</h2>
                <span className="bg-emerald-500/10 text-emerald-600 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                  ● Live Financial Ledger
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Comprehensive revenue analytics by daily, weekly, monthly, and yearly breakdowns with Excel report download.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
          {/* Location, Staff & Service Filters */}
          <ReportsLocationFilter 
            currentBranch={currentBranch} 
            currentStaff={currentStaff} 
            currentService={currentService}
            view={activeTimeframe === "comparison" ? "month" : activeTimeframe} 
            staffList={staffList} 
            servicesList={servicesList}
          />

          {/* Timeframe selector pills */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200">
            <button
              onClick={() => setActiveTimeframe("day")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTimeframe === "day"
                  ? "bg-[#5c54b6] text-white shadow-sm"
                  : "text-gray-600 hover:text-slate-900"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveTimeframe("week")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTimeframe === "week"
                  ? "bg-[#5c54b6] text-white shadow-sm"
                  : "text-gray-600 hover:text-slate-900"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setActiveTimeframe("month")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTimeframe === "month"
                  ? "bg-[#5c54b6] text-white shadow-sm"
                  : "text-gray-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveTimeframe("year")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTimeframe === "year"
                  ? "bg-[#5c54b6] text-white shadow-sm"
                  : "text-gray-600 hover:text-slate-900"
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => setActiveTimeframe("comparison")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTimeframe === "comparison"
                  ? "bg-[#5c54b6] text-white shadow-sm"
                  : "text-gray-600 hover:text-slate-900"
              }`}
            >
              All Periods
            </button>
          </div>

          {/* Download Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
            title="Download Revenue Summary in Excel (.xlsx) format"
          >
            <FaFileExcel className="text-sm" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Period Ledger Table */}
      {(() => {
        const displayChartData = hideEmptyRows
          ? chartData.filter((r: any) => (r.sales || 0) > 0 || (r.bookings || 0) > 0)
          : chartData;

        return (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-800 capitalize">
                {activeTimeframe === "comparison" ? "Monthly" : activeTimeframe} Revenue Ledger Breakdown
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hideEmptyRows}
                    onChange={(e) => setHideEmptyRows(e.target.checked)}
                    className="rounded text-[#5c54b6] focus:ring-0 cursor-pointer"
                  />
                  <span>Hide empty periods (QR 0)</span>
                </label>
                <span className="font-semibold text-gray-500">
                  {displayChartData.length} Period {displayChartData.length === 1 ? "Row" : "Rows"}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Period / Date</th>
                    <th className="py-3 px-4 text-right">Revenue (QR)</th>
                    <th className="py-3 px-4 text-right">Cash Sales</th>
                    <th className="py-3 px-4 text-right">Card Sales</th>
                    <th className="py-3 px-4 text-right">Total Bookings</th>
                    <th className="py-3 px-4 text-right">Completed Appts</th>
                    <th className="py-3 px-4 text-right">Avg Value / Appt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayChartData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400">
                        No breakdown data available for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    displayChartData.map((row: any, idx: number) => {
                      const rSales = row.sales || 0;
                      const rCash = row.cashSales || 0;
                      const rCard = row.cardSales || 0;
                      const rBookings = row.bookings || 0;
                      const rCompleted = row.completedBookings || 0;
                      const rAvg = rBookings > 0 ? Math.round(rSales / rBookings) : 0;

                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-800">{row.label || row.date}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">QR {rSales.toLocaleString("en-US")}</td>
                          <td className="py-3 px-4 text-right text-gray-600">QR {rCash.toLocaleString("en-US")}</td>
                          <td className="py-3 px-4 text-right text-gray-600">QR {rCard.toLocaleString("en-US")}</td>
                          <td className="py-3 px-4 text-right text-slate-700 font-medium">{rBookings}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{rCompleted}</td>
                          <td className="py-3 px-4 text-right text-slate-700">QR {rAvg}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {chartData.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td className="py-3 px-4">TOTAL</td>
                      <td className="py-3 px-4 text-right text-emerald-700 text-sm">
                        QR {chartData.reduce((sum: number, r: any) => sum + (r.sales || 0), 0).toLocaleString("en-US")}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        QR {chartData.reduce((sum: number, r: any) => sum + (r.cashSales || 0), 0).toLocaleString("en-US")}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        QR {chartData.reduce((sum: number, r: any) => sum + (r.cardSales || 0), 0).toLocaleString("en-US")}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        {chartData.reduce((sum: number, r: any) => sum + (r.bookings || 0), 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700">
                        {chartData.reduce((sum: number, r: any) => sum + (r.completedBookings || 0), 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        QR {
                          chartData.reduce((sum: number, r: any) => sum + (r.bookings || 0), 0) > 0
                            ? Math.round(
                                chartData.reduce((sum: number, r: any) => sum + (r.sales || 0), 0) /
                                chartData.reduce((sum: number, r: any) => sum + (r.bookings || 0), 0)
                              )
                            : 0
                        }
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        );
      })()}
    </div>
    )}
  </div>
);
}
