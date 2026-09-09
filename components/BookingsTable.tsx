"use client";

import { useEffect, useState } from "react";
import { FaSearch, FaSpinner, FaCalendarDay, FaUser, FaCheckCircle, FaRegClock, FaTimesCircle } from "react-icons/fa";

export default function BookingsTable({ branch = 'rospa' }: { branch?: 'rospa' | 'elan' | 'all' }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/bookings?branch=${branch}`);
        const data = await res.json();
        if (data.bookings) {
          // Filter out full day leave or busy blocks if needed, or keep them.
          // Let's keep only actual appointments (status pending, confirmed, completed, cancelled)
          setBookings(data.bookings.filter((b: any) => b.category !== "Leave" && b.category !== "Busy"));
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [branch]);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = b.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.customer?.phone?.includes(searchTerm) ||
                          b.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? b.appointment_date === filterDate : true;
    return matchesSearch && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><FaCheckCircle /> Completed</span>;
      case 'confirmed':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><FaCheckCircle /> Confirmed</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><FaTimesCircle /> Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><FaRegClock /> Pending</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col w-full h-full text-slate-800 font-['Montserrat']">
      
      {/* TOOLBAR */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
        <h2 className="text-xl font-bold text-slate-800">Booking Records</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-48">
            <input 
              type="date"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all text-sm text-slate-600 bg-white"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name, phone or service..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <FaSpinner className="animate-spin text-4xl text-[#d4af37] mb-4" />
            <p className="font-semibold">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <FaCalendarDay className="text-5xl text-gray-200 mb-4" />
            <p className="font-semibold text-lg">No bookings found</p>
            <p className="text-sm mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-bold">
                        {b.customer?.name?.charAt(0)?.toUpperCase() || <FaUser />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 capitalize">{b.customer?.name || "Walk-in"}</p>
                        <p className="text-xs text-gray-400">{b.customer?.phone || "No phone"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{new Date(b.appointment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.start_time?.substring(0, 5) || "--:--"} - {b.end_time?.substring(0, 5) || "--:--"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{b.service_name || "Unknown Service"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">QR {b.total || b.price || 0}{b.tips ? ` + Tip QR ${b.tips}` : ""}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700 capitalize">{b.payment_method || "N/A"}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${b.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-600'}`}>
                      {b.payment_status || "unpaid"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(b.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
