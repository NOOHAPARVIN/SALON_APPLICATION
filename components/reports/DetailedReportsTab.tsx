"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function DetailedReportsTab({ advancedData, branch = "All locations" }: { advancedData: any, branch?: string }) {
  const [reportType, setReportType] = useState("cancelled");
  const [dateFilter, setDateFilter] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentView = searchParams?.get('view') || 'month';

  const cancelledBookings = advancedData.cancelled || [];
  const noShowBookings = advancedData.noShow || [];
  const completedBookings = advancedData.completed || [];

  let displayData = 
    reportType === "cancelled" ? cancelledBookings :
    reportType === "no-show" ? noShowBookings :
    completedBookings;

  if (dateFilter) {
    displayData = displayData.filter((b: any) => {
      if (!b.appointment_date) return false;
      const d = new Date(b.appointment_date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}` === dateFilter;
    });
  }

  const reportTitle = 
    reportType === "cancelled" ? "Cancelled Appointments" :
    reportType === "no-show" ? "No-Show Appointments" :
    "Completed Appointments";

  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newView = e.target.value;
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set('view', newView);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Summary logic for cancellations
  const totalCancelled = cancelledBookings.length;
  const noReasonCount = cancelledBookings.filter((b: any) => !b.cancellation_reason).length;
  const didNotSpecifyCount = cancelledBookings.filter((b: any) => b.cancellation_reason === 'did_not_specify').length;
  const otherCommitmentsCount = cancelledBookings.filter((b: any) => b.cancellation_reason === 'other_commitments').length;

  const noReasonPct = totalCancelled ? ((noReasonCount / totalCancelled) * 100).toFixed(0) : 0;
  const didNotSpecifyPct = totalCancelled ? ((didNotSpecifyCount / totalCancelled) * 100).toFixed(0) : 0;
  const otherPct = totalCancelled ? ((otherCommitmentsCount / totalCancelled) * 100).toFixed(0) : 0;

  return (
    <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[600px] overflow-hidden">
      
      {/* Top Filter Bar */}
      <div className="border-b border-gray-100 p-4 bg-gray-50 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Choose a report</label>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border border-gray-200 rounded-md text-sm p-2 w-56 text-slate-700 bg-white focus:outline-none focus:border-[#5c54b6] cursor-pointer"
          >
            <option value="cancelled">Cancelled appointments</option>
            <option value="completed">Completed appointments</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date range</label>
          <select 
            value={currentView}
            onChange={handleViewChange}
            className="border border-gray-200 rounded-md text-sm p-2 w-32 text-slate-700 bg-white focus:outline-none focus:border-[#5c54b6] cursor-pointer"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Specific Date</label>
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-md text-sm p-2 w-40 text-slate-700 bg-white focus:outline-none focus:border-[#5c54b6] cursor-pointer"
          />
        </div>
        {dateFilter && (
          <div className="mt-5">
            <button 
              onClick={() => setDateFilter("")}
              className="text-xs font-semibold text-gray-500 hover:text-[#5c54b6] transition-colors underline"
            >
              Clear Date
            </button>
          </div>
        )}
      </div>

      <div className="p-8">
        {/* Report Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">{reportTitle}</h2>
          <p className="text-sm font-semibold text-slate-600 mt-1 capitalize">{branch}</p>
          <p className="text-xs text-gray-500 mt-1">
            Data based on your global dashboard filters
          </p>
        </div>

        {/* Cancellation Reasons Summary (Only show if Cancelled is selected) */}
        {reportType === "cancelled" && (
          <div className="mb-10 max-w-xl border-t-2 border-slate-800 pt-2">
            <h3 className="text-sm font-bold text-slate-600 mb-3">Cancellation reasons</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-200 text-slate-700">
                  <th className="text-left py-1.5 px-3 font-bold">Category</th>
                  <th className="text-right py-1.5 px-3 font-bold">Count</th>
                  <th className="text-right py-1.5 px-3 font-bold">Split</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 px-3">No reason specified</td>
                  <td className="text-right py-1.5 px-3">{noReasonCount}</td>
                  <td className="text-right py-1.5 px-3">{noReasonPct}%</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 px-3">Did not specify</td>
                  <td className="text-right py-1.5 px-3">{didNotSpecifyCount}</td>
                  <td className="text-right py-1.5 px-3">{didNotSpecifyPct}%</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 px-3">Other commitments</td>
                  <td className="text-right py-1.5 px-3">{otherCommitmentsCount}</td>
                  <td className="text-right py-1.5 px-3">{otherPct}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed Table */}
        <div className="border-t-2 border-slate-800 pt-2 overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-600 mb-3">{reportTitle} ledger</h3>
          <table className="w-full text-[11px] text-slate-700 min-w-[1000px]">
            <thead>
              <tr className="bg-gray-200 align-bottom">
                <th className="text-left py-2 px-2 font-bold w-20">Date</th>
                <th className="text-left py-2 px-2 font-bold w-24">Customer</th>
                <th className="text-left py-2 px-2 font-bold w-24">Telephone</th>
                <th className="text-left py-2 px-2 font-bold w-24">Location</th>
                {reportType === "cancelled" && <th className="text-left py-2 px-2 font-bold w-24">Reason</th>}
                <th className="text-left py-2 px-2 font-bold w-20">Time Updated</th>
                <th className="text-left py-2 px-2 font-bold w-20">Start</th>
                <th className="text-left py-2 px-2 font-bold w-20">End</th>
                <th className="text-left py-2 px-2 font-bold w-24">Staff member</th>
                <th className="text-left py-2 px-2 font-bold min-w-[120px]">Service booked</th>
                <th className="text-right py-2 px-2 font-bold w-16">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400">No appointments found in this period.</td>
                </tr>
              ) : (
                displayData.map((b: any) => {
                  const date = new Date(b.appointment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const updatedDate = new Date(b.updated_at || b.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-2 align-top">{date}</td>
                      <td className="py-2 px-2 align-top font-medium text-[#5c54b6]">{b.customer_name || 'Unknown'}</td>
                      <td className="py-2 px-2 align-top">{b.phone || '-'}</td>
                      <td className="py-2 px-2 align-top capitalize">{b.branch || 'Rospa'}</td>
                      {reportType === "cancelled" && <td className="py-2 px-2 align-top">{b.cancellation_reason || 'Did not specify'}</td>}
                      <td className="py-2 px-2 align-top">{updatedDate}</td>
                      <td className="py-2 px-2 align-top text-[#5c54b6] font-semibold">{b.start_time || b.appointment_time || '-'}</td>
                      <td className="py-2 px-2 align-top text-[#5c54b6] font-semibold">{b.end_time || '-'}</td>
                      <td className="py-2 px-2 align-top">{b.staff_name || 'System'}</td>
                      <td className="py-2 px-2 align-top">{b.service_name || '-'}</td>
                      <td className="py-2 px-2 align-top text-right font-bold text-slate-800">{b.price || b.total ? `QR ${(b.price || b.total).toFixed(2)}` : '-'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
