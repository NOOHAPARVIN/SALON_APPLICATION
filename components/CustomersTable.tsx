"use client";

import { useEffect, useState } from "react";
import { FaSearch, FaSpinner, FaUsers, FaUserCircle, FaCrown, FaStar } from "react-icons/fa";

export default function CustomersTable({ branch = 'rospa' }: { branch?: 'rospa' | 'elan' | 'all' }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`/api/bookings?branch=${branch}`);
        const data = await res.json();
        
        if (data.bookings) {
          // Aggregate bookings by customer
          const customerMap = new Map();

          data.bookings.forEach((b: any) => {
            // Ignore internal blocks
            if (b.category === "Leave" || b.category === "Busy") return;
            // Only count confirmed, completed, or paid for revenue & visits
            // But let's track everyone who booked. 
            // We'll calculate spent only for completed/paid, but visits for all non-cancelled.
            if (b.status === "cancelled") return;

            const nameKey = (b.customer?.name || "Walk-in").trim().toLowerCase();
            const phoneKey = (b.customer?.phone || "").trim();
            
            // Use phone as primary identifier, fallback to name if no phone
            const uniqueId = phoneKey ? phoneKey : nameKey;

            if (!customerMap.has(uniqueId)) {
              customerMap.set(uniqueId, {
                id: uniqueId,
                name: b.customer?.name || "Walk-in",
                phone: b.customer?.phone || "No phone",
                visits: 0,
                totalSpent: 0,
                lastVisit: null,
              });
            }

            const cust = customerMap.get(uniqueId);
            cust.visits += 1;
            
            // Only sum revenue if it's completed or paid
            if (b.status === "completed" || b.payment_status === "paid") {
              cust.totalSpent += (Number(b.total) || Number(b.price) || 0);
            }

            // Update last visit date
            const bDate = new Date(b.appointment_date);
            if (!cust.lastVisit || bDate > cust.lastVisit) {
              cust.lastVisit = bDate;
            }
          });

          // Convert map to array and sort by total spent (descending)
          const aggregatedCustomers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
          setCustomers(aggregatedCustomers);
        }
      } catch (err) {
        console.error("Failed to fetch customer data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [branch]);

  const filteredCustomers = customers.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.phone).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLoyaltyBadge = (visits: number, spent: number) => {
    if (spent >= 1500 || visits >= 10) {
      return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><FaCrown className="text-purple-500" /> VIP</span>;
    } else if (spent >= 500 || visits >= 3) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><FaStar className="text-blue-500" /> Loyal</span>;
    } else if (visits === 1) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">New</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">Regular</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col w-full h-full text-slate-800 font-['Montserrat']">
      
      {/* TOOLBAR */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
        <h2 className="text-xl font-bold text-slate-800">Customer CRM</h2>
        
        <div className="relative w-full md:w-72">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <FaSpinner className="animate-spin text-4xl text-[#d4af37] mb-4" />
            <p className="font-semibold">Loading customer database...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <FaUsers className="text-5xl text-gray-200 mb-4" />
            <p className="font-semibold text-lg">No customers found</p>
            <p className="text-sm mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Total Visits</th>
                <th className="px-6 py-4">Lifetime Value</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4">Loyalty Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
                        <FaUserCircle />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 capitalize">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{c.visits} Bookings</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#10b981]">QR {c.totalSpent.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">
                      {c.lastVisit ? c.lastVisit.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {getLoyaltyBadge(c.visits, c.totalSpent)}
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
