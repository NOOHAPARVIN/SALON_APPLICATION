import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staff = searchParams.get("staff");
    const date = searchParams.get("date");

    if (!staff || !date) {
      return NextResponse.json(
        { error: "Missing staff or date parameter" },
        { status: 400 }
      );
    }

    // 1. Define all possible time slots for salon appointments
    const allSlots: string[] = [];
    for (let hour = 9; hour < 21; hour++) {
      allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    }

    // 2. Fetch bookings for this date that are not cancelled
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("time, services, status")
      .eq("date", date)
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

        if (isStaffBooked && booking.time) {
          bookedSlots.push(booking.time);
        }
      }
    }

    // 4. Return the time slots that are not booked
    const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

    return NextResponse.json(availableSlots);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch availability" },
      { status: 500 }
    );
  }
}