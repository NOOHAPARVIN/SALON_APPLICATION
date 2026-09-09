import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Helper to format time "10:00:00" -> "10:00 AM"
function formatTime(timeStr: string) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// Helper to format date "2026-10-24" -> "Oct 24, 2026"
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function StylistDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let bookings: any[] = [];
  let staffName = "Stylist";

  if (user?.email) {
    // 1. Find the staff record by email
    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, name')
      .eq('email', user.email)
      .single();

    if (staff) {
      staffName = staff.name || staffName;
      // 2. Fetch upcoming bookings for this staff member
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('staff_id', staff.id)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });
        
      if (data) {
        bookings = data.filter((b: any) => b.category !== "Leave" && b.category !== "Busy" && b.status !== "cancelled");
      }
    }
  }

  return (
    <div className="p-4 md:p-8 font-['Montserrat']">
      <h1 className="text-3xl font-bold text-[var(--color-gold)] mb-6 font-['Playfair_Display']">My Schedule</h1>
      <p className="text-[var(--color-text-main)] mb-8">Welcome back, {staffName}. Here are your upcoming appointments.</p>

      <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] p-6 shadow-lg shadow-black/5">
        <div className="flex justify-between items-center mb-6">
          <p className="text-[var(--color-text-muted)] text-sm">
            {bookings.length > 0 
              ? "Your real-time schedule from the database." 
              : "You have no upcoming appointments scheduled."}
          </p>
          <span className="text-sm font-semibold text-[var(--color-gold)]">
            Total Upcoming: {bookings.length}
          </span>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div 
                key={booking.id}
                className="p-4 border border-[var(--color-border)] rounded-xl flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0 bg-white/50 backdrop-blur-sm transition-all hover:border-[var(--color-gold)] hover:shadow-md"
              >
                <div>
                  <p className="font-bold text-[var(--color-text-main)] text-lg">
                    {formatDate(booking.appointment_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm font-medium text-[var(--color-text-main)]">{booking.service_name}</p>
                    <span className="text-xs text-[var(--color-text-muted)] px-2 py-0.5 bg-black/5 rounded">Client: {booking.customer_name || booking.name || "Unknown"}</span>
                  </div>
                </div>
                
                <span className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border ${
                  booking.status?.toLowerCase() === 'completed' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : booking.status?.toLowerCase() === 'pending'
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    : 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)]/30'
                }`}>
                  {booking.status || 'Confirmed'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-[var(--color-border)] rounded-xl bg-white/30">
            <p className="text-[var(--color-text-muted)]">No appointments scheduled for today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
