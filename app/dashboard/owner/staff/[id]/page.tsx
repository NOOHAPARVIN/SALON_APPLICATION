import { createClient as createAdminClient } from "@supabase/supabase-js";
import StaffProfileEditor from "@/components/StaffProfileEditor";
import { FaUserTie, FaPhone, FaEnvelope, FaStar, FaCalendarCheck, FaHistory, FaMoneyBillWave, FaArrowLeft, FaClock, FaCoins } from "react-icons/fa";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SpecificStaffDashboard({ params }: { params: { id: string } }) {
  const staffId = parseInt(params.id, 10);
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (isNaN(staffId)) {
    return notFound();
  }

  // 1. Fetch Staff Data
  const { data: staff, error: staffError } = await supabaseAdmin
    .from('staff')
    .select('*')
    .eq('id', staffId)
    .single();

  if (staffError || !staff) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h1 className="text-2xl font-bold mb-2">Staff Member Not Found</h1>
        <Link href="/dashboard/owner/staff" className="text-[#ff6b35] hover:underline">
          &larr; Back to Staff Directory
        </Link>
      </div>
    );
  }

  // 2. Fetch Bookings Data for this Staff Member
  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('staff_id', staffId)
    .order('appointment_date', { ascending: true });

  const allBookings = bookings || [];

  // Fetch Services for Editor
  const { data: servicesData } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('company_id', staff.company_id || '00000000-0000-0000-0000-000000000000')
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  const dbServices = servicesData || [];

  // 3. Process Metrics
  const today = new Date().toISOString().split("T")[0];

  const upcomingBookings = allBookings.filter(
    (b: any) => (b.status === "confirmed" || b.status === "pending") && b.appointment_date >= today
  );

  const completedBookings = allBookings.filter(
    (b: any) => b.status === "completed" || (b.status !== "cancelled" && b.appointment_date < today)
  );

  const totalRevenue = completedBookings.reduce((sum: number, b: any) => sum + (Number(b.total) || 0), 0);
  
  // Calculate tips if the column exists, otherwise it will be 0
  const totalTips = completedBookings.reduce((sum: number, b: any) => sum + (Number(b.tips) || 0), 0);


  // 4. Formatting
  const role = staff.role || "stylist";
  const roleColors: Record<string, string> = {
    stylist: "#ff6b35",
    receptionist: "#2972ff",
    manager: "#00d284",
  };
  const color = roleColors[role] || "#ff6b35";
  
  const name = staff.name
    || (staff.first_name ? `${staff.first_name || ""} ${staff.last_name || ""}`.trim() : null)
    || staff.email?.split("@")[0]
    || "Staff Member";

  return (
    <div className="p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back Navigation */}
        <Link 
          href="/dashboard/owner/staff" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#ff6b35] transition-colors"
        >
          <FaArrowLeft /> Back to Staff
        </Link>

        {/* Profile Header Card - Editable */}
        <StaffProfileEditor staff={staff} name={name} color={color} role={role} dbServices={dbServices} />

        {/* Analytics & Work So Far */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#2972ff]/10 text-[#2972ff]">
              <FaCalendarCheck className="text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{upcomingBookings.length}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase">Upcoming Appointments</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#00d284]/10 text-[#00d284]">
              <FaHistory className="text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{completedBookings.length}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase">Completed Appointments</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#ff6b35]/10 text-[#ff6b35]">
              <FaMoneyBillWave className="text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">QR {totalRevenue}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase">Revenue Generated</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-500/10 text-yellow-500">
              <FaCoins className="text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">QR {totalTips}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase">Tips Collection</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FaClock className="text-[#ff6b35]" /> Coming Appointments
            </h2>
          </div>
          
          {upcomingBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FaCalendarCheck className="text-4xl text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-slate-600">No upcoming appointments</p>
              <p className="text-sm">This staff member is completely free.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3 border-b border-gray-100">Date & Time</th>
                    <th className="px-6 py-3 border-b border-gray-100">Customer</th>
                    <th className="px-6 py-3 border-b border-gray-100">Service</th>
                    <th className="px-6 py-3 border-b border-gray-100">Duration</th>
                    <th className="px-6 py-3 border-b border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {upcomingBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors text-slate-700 text-sm">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex flex-col">
                          <span>{new Date(booking.appointment_date).toLocaleDateString()}</span>
                          <span className="text-xs text-slate-400">{booking.start_time?.substring(0, 5)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{booking.customer_name || "Guest"}</span>
                          {booking.phone && <span className="text-xs text-slate-400">{booking.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold">
                          {booking.service_name || "General Service"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {booking.duration_minutes ? `${booking.duration_minutes} mins` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          booking.status === 'confirmed' ? 'bg-[#d1fae5] text-[#059669]' : 'bg-[#fef3c7] text-[#d97706]'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
