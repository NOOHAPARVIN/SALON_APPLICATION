"use client";

import React, { useState, useRef, useEffect } from "react";
import BarChartViewSelector from "./BarChartViewSelector";

export default function ActivityTab({ advancedData, allTimeframes }: { advancedData: any, allTimeframes?: any }) {
  const [chartView, setChartView] = useState(advancedData?.viewMode || 'day');
  const currentAdvanced = allTimeframes?.[chartView] || advancedData;
  const { appointments, clients, newClients, retainedPct, rebookedPct, chartData } = currentAdvanced.activity;

  const maxHours = Math.max(...(chartData || []).map((d: any) => d.availableHours || 1), 144);

  const getCurrentPeriodKey = (mode: string) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    if (mode === 'day') return `${yyyy}-${mm}-${dd}`;
    if (mode === 'month') return `${yyyy}-${mm}`;
    if (mode === 'year') return `${yyyy}`;
    if (mode === 'week') {
      const dCopy = new Date(now);
      dCopy.setHours(0,0,0,0);
      dCopy.setDate(dCopy.getDate() - dCopy.getDay()); 
      return `${dCopy.getFullYear()}-${String(dCopy.getMonth()+1).padStart(2,'0')}-${String(dCopy.getDate()).padStart(2,'0')}`;
    }
    return `${yyyy}-${mm}-${dd}`;
  };

  const currentKey = getCurrentPeriodKey(chartView);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentElementRef = useRef<HTMLDivElement>(null);

  // Auto-center current day / month bar in the scrollable chart container
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current && currentElementRef.current) {
        const container = scrollContainerRef.current;
        const element = currentElementRef.current;

        const containerWidth = container.clientWidth;
        const elementLeft = element.offsetLeft;
        const elementWidth = element.clientWidth;

        const targetScrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: "smooth"
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [chartView, chartData, currentKey]);

  return (
    <div className="animate-fade-in space-y-8">

      {/* Big and Clear Appointment Volume & Productivity Chart at bottom of Activity Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Appointment Volume & Productivity ({chartView.toUpperCase()})</h3>
            <p className="text-xs text-gray-400">Hours booked vs completed vs available capacity</p>
          </div>
          <BarChartViewSelector currentView={chartView} onViewChange={setChartView} />
        </div>

        <div ref={scrollContainerRef} className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex justify-between items-end gap-6 h-[380px] relative pb-12 border-b border-gray-100 min-w-[950px] pl-14 pr-4">
            {/* Y Axis Grid Lines */}
            {[144, 126, 108, 90, 72, 54, 36, 18, 0].map(val => (
              <div key={val} className="absolute left-0 right-0 h-px border-t border-dashed border-gray-200 z-0" style={{ bottom: `${(val / maxHours) * 300 + 48}px` }}>
                <span className="absolute left-1 -top-2.5 text-[10px] text-gray-400 font-bold bg-white px-1">{val} hrs</span>
              </div>
            ))}

            {(chartData || []).map((d: any, i: number) => {
              const availH = Math.max(d.availableHours || 0, 1);
              const availHeight = (availH / maxHours) * 300;
              const isCurrent = d.date === currentKey;
              const currentBadge = chartView === 'day' ? '(Today)' : chartView === 'week' ? '(This Wk)' : chartView === 'month' ? '(This Mo)' : '(This Yr)';

              // Calculate stacked heights
              const complH = ((d.completedHours || 0) / maxHours) * 300;
              const confH = ((d.bookedHours || 0) / maxHours) * 300;

              return (
                <div key={i} ref={isCurrent ? currentElementRef : null} className="flex flex-col items-center flex-1 h-full justify-end relative z-10 px-2">
                  {/* Bar Stack Container */}
                  <div className="w-8 sm:w-10 max-w-[40px] flex flex-col justify-end group cursor-pointer relative" style={{ height: '300px' }}>
                    {/* Tooltip */}
                    {((d.completedHours || 0) > 0 || (d.bookedHours || 0) > 0) && (
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] px-3 py-2 rounded-xl whitespace-nowrap z-30 pointer-events-none shadow-xl text-center border border-slate-700">
                        <p className="font-bold text-indigo-300 border-b border-slate-700 pb-1 mb-1">{d.label} • Total: {((d.completedHours || 0) + (d.bookedHours || 0)).toFixed(1)} hrs ({d.bookings || 0} bookings)</p>
                        {(d.completedHours || 0) > 0 && <p className="text-[#417637] font-semibold">Completed: {(d.completedHours || 0).toFixed(1)} hrs ({d.completedBookings || 0} bookings)</p>}
                        {(d.bookedHours || 0) > 0 && <p className="text-[#5c54b6] font-semibold">Scheduled: {(d.bookedHours || 0).toFixed(1)} hrs ({d.confirmedBookings || 0} bookings)</p>}
                        <p className="text-gray-400 mt-0.5">Avail Cap: {d.availableHours || 0} hrs</p>
                      </div>
                    )}

                    {/* Outline / Available Bar */}
                    <div className="w-full border border-gray-200 bg-white flex flex-col justify-end overflow-hidden rounded-t-md shadow-sm" style={{ height: `${availHeight}px` }}>
                      {/* Stacked contents from bottom up */}
                      {(d.bookedHours || 0) > 0 && <div className="w-full bg-[#5c54b6] shrink-0" style={{ height: `${confH}px` }} />}
                      {(d.completedHours || 0) > 0 && <div className="w-full bg-[#417637] shrink-0" style={{ height: `${complH}px` }} />}
                    </div>
                  </div>

                  {/* X Axis Label */}
                  <div className="absolute -bottom-10 flex flex-col items-center">
                    <span className={`text-[10px] font-bold mt-2 block whitespace-nowrap ${isCurrent ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full' : 'text-gray-500'}`}>
                      {d.label} {isCurrent ? currentBadge : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-8 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-white" />
            <span className="text-xs font-bold text-gray-500">Available Cap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#417637]" />
            <span className="text-xs font-bold text-gray-500">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#5c54b6]" />
            <span className="text-xs font-bold text-gray-500">Scheduled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
