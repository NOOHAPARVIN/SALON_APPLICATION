import React from "react";
import { FaUsers, FaCalendarCheck, FaMoneyBillWave } from "react-icons/fa";

export default function OverviewTab({ data, advancedData, allTimeframes }: { data: any, advancedData?: any, allTimeframes?: any }) {
  const totalRevenue = typeof advancedData?.business?.sales === "number" ? advancedData.business.sales : (data?.totalRevenue || 0);
  const cashSales = advancedData?.business?.cashSales ?? 0;
  const cardSales = advancedData?.business?.cardSales ?? 0;
  const totalBookings = typeof advancedData?.activity?.appointments === "number" ? advancedData.activity.appointments : (data?.totalAppointments || 0);
  const totalClients = typeof advancedData?.activity?.clients === "number" ? advancedData.activity.clients : (data?.totalClients || 0);
  const avgValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  const topServices = advancedData?.topServices || data.topServices || [];
  const topStylists = advancedData?.topStylists || data.topStylists || [];
  const viewModeLabel = (advancedData?.viewMode || 'year').toUpperCase();

  return (
    <>
      {/* Master KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10">
              <FaMoneyBillWave className="text-emerald-500 text-base" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              By {viewModeLabel}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">QR {Number(totalRevenue || 0).toLocaleString('en-US')}</p>
          <p className="text-xs font-semibold text-gray-400 mt-1">Total Revenue</p>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><span className="text-green-500">💵</span> Cash: QR {Number(cashSales || 0).toLocaleString('en-US')}</span>
            <span className="flex items-center gap-1"><span className="text-indigo-500">💳</span> Card: QR {Number(cardSales || 0).toLocaleString('en-US')}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-500/10">
              <FaCalendarCheck className="text-orange-500 text-base" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              By {viewModeLabel}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{Number(totalBookings || 0).toLocaleString('en-US')}</p>
          <p className="text-xs font-semibold text-gray-400 mt-1">Total Bookings</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-500">
            <span>Avg Value: <span className="text-slate-700">QR {avgValue}</span></span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10">
              <FaUsers className="text-blue-500 text-base" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              By {viewModeLabel}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{Number(totalClients || 0).toLocaleString('en-US')}</p>
          <p className="text-xs font-semibold text-gray-400 mt-1">Unique Clients</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-500">
            <span className="text-emerald-600">● Active Base</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/10">
              <FaMoneyBillWave className="text-purple-500 text-base" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              By {viewModeLabel}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{Number(advancedData?.business?.giftCardsSold ?? data.totalGiftCardsSold ?? 0).toLocaleString('en-US')}</p>
          <p className="text-xs font-semibold text-gray-400 mt-1">Gift Cards Sold</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-500">
            <span className="text-purple-600">● In Revenue</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/60 shadow-sm p-5 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10">
              <FaMoneyBillWave className="text-amber-600 text-base" />
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
              LIABILITY
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">QR {Number(advancedData?.business?.tipsLiability || 0).toLocaleString('en-US')}</p>
          <p className="text-xs font-semibold text-amber-700 mt-1">Staff Tips (Liability)</p>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-100 text-[10px] font-bold text-amber-800">
            <span>● Account: Staff Tips Payable</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Stylists */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Top Stylists</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md">By {viewModeLabel}</span>
          </div>
          <div className="space-y-4">
            {topStylists.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No stylist data available yet.</p>
            ) : (
              topStylists.map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#ff6b35] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.bookings} appts</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-[#ff6b35] rounded-full" style={{ width: `${Math.min((s.bookings / 100) * 100, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-yellow-500 font-semibold">★ {s.rating}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Services Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Top Performing Services</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md">By {viewModeLabel}</span>
          </div>
          {topServices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No service data available yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Service</th>
                  <th className="text-left px-6 py-3">Bookings</th>
                  <th className="text-left px-6 py-3">Revenue</th>
                  <th className="text-left px-6 py-3">Popularity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topServices.map((s: any) => (
                  <tr key={s.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-700 text-sm">{s.name}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">{s.count}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-slate-700">QR {s.revenue.toLocaleString('en-US')}</td>
                    <td className="px-6 py-3.5 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-2 bg-gradient-to-r from-[#ff6b35] to-[#ffc107] rounded-full" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{s.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
