"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { useModal } from "@/components/ModalContext";
import { FaCalendarAlt, FaSignOutAlt, FaUser, FaClock, FaMoneyBillWave, FaHistory, FaStar } from "react-icons/fa";

export default function ProfilePage() {
  const { showAlert, showConfirm } = useModal();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    getUserAndBookings();
  }, []);

  async function getUserAndBookings() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);

    // Get phone number to look up bookings
    const phoneStr = user.user_metadata?.phone || "";
    const phoneNum = parseInt(String(phoneStr).replace(/\D/g, ""), 10);

    if (phoneNum) {
      const { data: userBookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("phone", phoneNum)
        .order("appointment_date", { ascending: false });

      if (!error && userBookings) {
        setBookings(userBookings);
      }
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  const handleCancelBooking = (bookingId: string) => {
    showConfirm("Cancel Appointment", "Are you sure you want to cancel this appointment?", async () => {
      try {
        const res = await fetch(`/api/bookings?id=${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled", cancel_reason: "" }),
        });
        const data = await res.json();
        if (data.success) {
          showAlert("Success", "Appointment cancelled successfully.", "success");
          getUserAndBookings();
        } else {
          showAlert("Error", "Failed to cancel: " + data.error, "error");
        }
      } catch (err) {
        showAlert("Error", "Error cancelling appointment.", "error");
      }
    }, "warning");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071f17] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#d4af37] font-semibold tracking-widest uppercase text-sm">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const groupedBookings = bookings.reduce((acc: any[], b: any) => {
    if (b.group_id) {
      const existing = acc.find(x => x.group_id === b.group_id);
      if (existing) {
        existing.services.push(b);
        existing.total += (b.price || b.total || 0);
        return acc;
      }
    } else {
      const existing = acc.find(x => !x.group_id && x.appointment_date === b.appointment_date && x.phone === b.phone);
      if (existing) {
        existing.services.push(b);
        existing.total += (b.price || b.total || 0);
        return acc;
      }
    }
    
    acc.push({
      ...b,
      services: [b],
      total: b.price || b.total || 0
    });
    return acc;
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = groupedBookings.filter(b => b.appointment_date >= today);
  const pastBookings = groupedBookings.filter(b => b.appointment_date < today);

  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  // Images removed as per user request

  return (
    <div className="min-h-screen bg-[#051610] font-sans text-white pb-20">
      
      {/* Header Area */}
      <div className="bg-[#0b2b20] border-b border-[#d4af37]/20 pt-20 pb-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#f9d976] p-1.5 shadow-[0_10px_30px_rgba(212,175,55,0.4)] z-10 relative">
                <div className="w-full h-full bg-[#071f17] rounded-full flex items-center justify-center text-6xl text-[#d4af37]">
                  <FaUser />
                </div>
              </div>
              <div className="pb-2 z-10">
                <h1 className="text-4xl font-bold text-white drop-shadow-lg font-serif">
                  {user?.user_metadata?.full_name || "Valued Client"}
                </h1>
                <p className="text-[#d4af37] font-semibold tracking-widest text-sm uppercase mt-1 drop-shadow-md">
                  Exclusive Member
                </p>
              </div>
            </div>
          </div>
        </div>
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0a1e16] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Profile Details</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Email Address</p>
                <p className="text-gray-200">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Phone Number</p>
                <p className="text-gray-200">{user?.user_metadata?.phone}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Member Since</p>
                <p className="text-gray-200">{new Date(user?.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 rounded-2xl p-6 shadow-xl text-center">
            <FaStar className="text-4xl text-[#d4af37] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#d4af37] mb-2">VIP Rewards</h3>
            <p className="text-gray-300 text-sm mb-4">Book more appointments to unlock exclusive luxury perks and discounts.</p>
            <div className="w-full bg-black/40 rounded-full h-2 mb-2">
              <div className="bg-[#d4af37] h-2 rounded-full" style={{ width: `${Math.min(100, bookings.length * 10)}%` }}></div>
            </div>
            <p className="text-xs text-gray-400">{bookings.length} / 10 bookings for next tier</p>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="lg:col-span-2">
          
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/10 pb-px">
            <button 
              onClick={() => setActiveTab("upcoming")}
              className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "upcoming" 
                  ? "text-[#d4af37] border-[#d4af37]" 
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button 
              onClick={() => setActiveTab("past")}
              className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "past" 
                  ? "text-[#d4af37] border-[#d4af37]" 
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              Past ({pastBookings.length})
            </button>
          </div>

          {/* Bookings List */}
          {displayedBookings.length === 0 ? (
            <div className="bg-[#0a1e16] border border-white/5 rounded-2xl p-12 text-center shadow-xl">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[#d4af37] text-3xl">
                {activeTab === "upcoming" ? <FaCalendarAlt /> : <FaHistory />}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                No {activeTab} bookings
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {activeTab === "upcoming" 
                  ? "You don't have any upcoming appointments. Treat yourself to a relaxing salon experience today!"
                  : "You haven't completed any appointments yet."}
              </p>
              {activeTab === "upcoming" && (
                <Link href="/booking" className="inline-block bg-white/10 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10">
                  Book an Appointment
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedBookings.map((booking) => {
                const dateObj = new Date(booking.appointment_date);
                const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                
                let statusColor = "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
                if (booking.status === "confirmed") statusColor = "text-green-400 bg-green-400/10 border-green-400/20";
                if (booking.status === "cancelled") statusColor = "text-red-400 bg-red-400/10 border-red-400/20";
                if (booking.status === "completed") statusColor = "text-[#d4af37] bg-[#d4af37]/10 border-[#d4af37]/20";

                return (
                  <div 
                    key={booking.id} 
                    className="group bg-[#0a1e16] border border-white/5 rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:border-[#d4af37]/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300"
                  >
                    
                    {/* Booking Info */}
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${statusColor}`}>
                          {booking.status}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest">#{booking.id}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white font-serif">
                        {booking.services.length > 1 ? `${booking.services.length} Services Package` : (booking.service_name || booking.category)}
                      </h3>
                      
                      {booking.services.length > 1 && (
                        <div className="mt-2 space-y-1">
                          {booking.services.map((s: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-400">
                              • {s.service_name} <span className="text-[#d4af37]">({s.start_time?.substring(0,5)})</span>
                            </p>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-gray-400">
                        <div className="flex items-center gap-1.5 text-gray-200">
                          <FaCalendarAlt className="text-[#d4af37]" />
                          {formattedDate}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-200">
                          <FaClock className="text-[#d4af37]" />
                          {booking.start_time?.substring(0,5)} {booking.services.length === 1 && booking.end_time ? `- ${booking.end_time.substring(0,5)}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="p-5 bg-black/20 sm:border-l border-white/5 flex flex-col justify-center items-start sm:items-end sm:min-w-[140px]">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Total</p>
                      <div className="flex items-center gap-1.5 text-xl font-bold text-[#d4af37] mb-2">
                        <span className="text-sm">QR</span> {booking.total || booking.price}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${booking.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                        <p className="text-xs font-semibold text-white capitalize">{booking.payment_method}</p>
                      </div>

                      {activeTab === "upcoming" && booking.status !== "cancelled" && (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="mt-auto px-3 py-1.5 border border-red-500/30 text-red-400 text-xs font-bold rounded hover:bg-red-500/10 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {booking.status === "cancelled" && booking.cancel_reason && (
                        <p className="text-[10px] text-red-400/80 mt-2 text-right italic">
                          Reason: {booking.cancel_reason}
                        </p>
                      )}
                    </div>
                    
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}