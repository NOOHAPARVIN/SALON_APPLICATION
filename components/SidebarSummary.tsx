"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useBranch } from "@/lib/BranchContext";
import { FaChartPie, FaMoneyBillWave, FaCalendarCheck, FaUserTie, FaBuilding, FaSpinner } from "react-icons/fa";

export default function SidebarSummary() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { currentBranch, setCurrentBranch, branchesForCurrentCompany, currentCompanyId } = useBranch();

  // Read search params or context defaults
  const paramBranch = searchParams.get("branch") || currentBranch || "all";
  const paramStaff = searchParams.get("staff") || "all";

  const [selectedStaff, setSelectedStaff] = useState<string>(paramStaff);
  const [selectedView, setSelectedView] = useState<"day" | "week" | "month" | "year">("month");

  const [summaryData, setSummaryData] = useState<any>(null);
  const [staffList, setStaffList] = useState<{ id: string | number; name: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Sync selectedStaff if param changes
  useEffect(() => {
    if (paramStaff !== selectedStaff) {
      setSelectedStaff(paramStaff);
    }
  }, [paramStaff]);

  // Fetch summary data whenever branch, staff, view, or companyId changes
  useEffect(() => {
    let isSubscribed = true;
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        query.set("branch", paramBranch);
        query.set("staff", selectedStaff);
        query.set("view", selectedView);
        if (currentCompanyId) {
          query.set("companyId", currentCompanyId);
        }

        const res = await fetch(`/api/reports/summary?${query.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch summary");
        const json = await res.json();

        if (isSubscribed && json.success) {
          setSummaryData(json.summary);
          setStaffList(json.staffList || []);
        }
      } catch (err) {
        console.error("SidebarSummary fetch error:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchSummary();
    return () => {
      isSubscribed = false;
    };
  }, [paramBranch, selectedStaff, selectedView, currentCompanyId]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranch = e.target.value;
    setCurrentBranch(newBranch);
    setSelectedStaff("all");

    // Sync URL if on dashboard route
    if (pathname.startsWith("/dashboard")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("branch", newBranch);
      params.set("staff", "all");
      params.set("view", selectedView);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStaff = e.target.value;
    setSelectedStaff(newStaff);

    // Sync URL if on dashboard route
    if (pathname.startsWith("/dashboard")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("branch", paramBranch);
      params.set("staff", newStaff);
      params.set("view", selectedView);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleViewChange = (view: "day" | "week" | "month" | "year") => {
    setSelectedView(view);
    if (pathname.startsWith("/dashboard")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", view);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const sales = summaryData?.totalSales || 0;
  const cash = summaryData?.cashSales || 0;
  const card = summaryData?.cardSales || 0;
  const appts = summaryData?.appointments || 0;
  const completed = summaryData?.completedBookings || 0;

  return (
    <div className="mx-2 my-4 bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <FaChartPie className="text-[#ff6b35] text-xs" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Quick Summary
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium cursor-pointer transition-colors"
        >
          {isCollapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="space-y-2">
            {/* Location Filter */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
              <FaBuilding className="text-slate-400 text-xs shrink-0" />
              <select
                value={paramBranch}
                onChange={handleBranchChange}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none w-full cursor-pointer truncate"
              >
                <option value="all" className="bg-slate-900 text-white">All Locations</option>
                {branchesForCurrentCompany.map((b) => (
                  <option key={b.id} value={b.slug} className="bg-slate-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Staff Filter */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
              <FaUserTie className="text-slate-400 text-xs shrink-0" />
              <select
                value={selectedStaff}
                onChange={handleStaffChange}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none w-full cursor-pointer truncate"
              >
                <option value="all" className="bg-slate-900 text-white">All Staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={String(s.id)} className="bg-slate-900 text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timeframe Pills */}
          <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
            {(["day", "week", "month", "year"] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`py-1 rounded font-bold capitalize transition-colors cursor-pointer text-center ${
                  selectedView === view
                    ? "bg-[#5c54b6] text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Metrics Section */}
          {loading ? (
            <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-2">
              <FaSpinner className="animate-spin text-sm" />
              <span>Updating summary...</span>
            </div>
          ) : (
            <div className="space-y-2 pt-1 border-t border-slate-800">
              {/* Total Revenue */}
              <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/40">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Revenue</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  QR {Number(sales).toLocaleString("en-US")}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-700/30">
                  <span>💵 Cash: QR {Number(cash).toLocaleString("en-US")}</span>
                  <span>💳 Card: QR {Number(card).toLocaleString("en-US")}</span>
                </div>
              </div>

              {/* Bookings */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 font-semibold">Bookings</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{appts}</div>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 font-semibold">Completed</div>
                  <div className="text-sm font-bold text-sky-400 mt-0.5">{completed}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
