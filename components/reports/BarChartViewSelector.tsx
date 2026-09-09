"use client";

import React from "react";

export default function BarChartViewSelector({
  currentView,
  onViewChange,
}: {
  currentView: string;
  onViewChange: (view: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200/80 rounded-xl p-1 shadow-inner overflow-x-auto max-w-full">
      {["day", "week", "month", "year"].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onViewChange(v)}
          className={`px-3 py-1 rounded-lg capitalize text-[11px] transition-all whitespace-nowrap cursor-pointer ${
            currentView === v
              ? "bg-[#5c54b6] text-white shadow-sm font-extrabold scale-[1.02]"
              : "text-gray-500 hover:text-slate-800 hover:bg-white/70 font-semibold"
          }`}
        >
          {v} View
        </button>
      ))}
    </div>
  );
}
