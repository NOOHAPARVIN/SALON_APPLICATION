import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const staff = searchParams.get("staff");
    const date = searchParams.get("date");

    if (!companyId || !staff || !date) {
      return NextResponse.json(
        { success: false, error: "Missing companyId, staff, or date parameter" },
        { status: 400 }
      );
    }

    // 1. Define all possible time slots for salon appointments
    // TODO: Ideally this would read from company settings (business hours)
    const allSlots: string[] = [];
    for (let hour = 9; hour < 21; hour++) {
      allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    }

    // 2. Fetch bookings for this date that are not cancelled
    // WARNING: Only fetch what is absolutely necessary. Never expose customer details.
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("time, services, start_time")
      .eq("company_id", companyId)
      .eq("appointment_date", date)
      .neq("status", "cancelled");

    if (error) throw error;

    // 3. Filter bookings to identify timeslots where the requested staff member is already booked
    const bookedSlots: string[] = [];

    if (bookings) {
      for (const booking of bookings) {
        const services = Array.isArray(booking.services) ? booking.services : [];
        
        // Check if this booking contains a service assigned to the requested staff member
        const isStaffBooked = services.some(
          (s: any) => s.staff?.toLowerCase() === staff.toLowerCase()
        );

        if (isStaffBooked) {
          const t = booking.start_time || booking.time;
          if (t) {
            // Normalize time to HH:MM
            bookedSlots.push(t.substring(0, 5));
          }
        }
      }
    }

    // 4. Return the time slots that are not booked
    const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

    return NextResponse.json({ success: true, availableSlots });
  } catch (error: any) {
    console.error("Error in public availability API:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
