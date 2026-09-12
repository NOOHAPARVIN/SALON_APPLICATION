import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffParam = searchParams.get("staff") || searchParams.get("staff_id");
    const date = searchParams.get("date");
    const serviceParam = searchParams.get("service");
    const serviceDuration = parseInt(searchParams.get("duration") || "30", 10);

    if (!date) {
      return NextResponse.json(
        { error: "Missing date parameter" },
        { status: 400 }
      );
    }

    // 1. Generate 15-minute time slots from 09:00 to 22:00
    const allSlots: string[] = [];
    for (let h = 9; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        allSlots.push(`${hour}:${minute}`);
      }
    }

    // 2. Fetch all staff members from DB
    const { data: allStaff } = await supabase.from("staff").select("id, name, services");

    let targetStaffList: Array<{ id: number; name: string }> = [];

    if (staffParam && staffParam.trim() !== "" && staffParam.toLowerCase() !== "any staff") {
      const cleanStaffParam = staffParam.trim().toLowerCase();
      let staffId: number | null = !isNaN(Number(staffParam)) ? Number(staffParam) : null;

      if (allStaff && allStaff.length > 0) {
        const matched = allStaff.find((s: any) => {
          if (staffId !== null && Number(s.id) === staffId) return true;
          const sNameLower = (s.name || "").trim().toLowerCase();
          return sNameLower === cleanStaffParam || sNameLower.includes(cleanStaffParam) || cleanStaffParam.includes(sNameLower);
        });
        if (matched) {
          targetStaffList = [{ id: Number(matched.id), name: matched.name }];
        } else {
          targetStaffList = [{ id: staffId || 0, name: staffParam.trim() }];
        }
      } else {
        targetStaffList = [{ id: staffId || 0, name: staffParam.trim() }];
      }
    } else {
      // Evaluate all staff members qualified for the service
      if (allStaff && allStaff.length > 0) {
        if (serviceParam && serviceParam.trim() !== "") {
          const servLower = serviceParam.trim().toLowerCase();
          const qualified = allStaff.filter((s: any) => {
            const sServices: string[] = Array.isArray(s.services)
              ? s.services
              : typeof s.services === "string"
              ? JSON.parse(s.services || "[]")
              : [];
            if (sServices.length === 0) return true;
            return sServices.some((serv: string) => {
              if (typeof serv !== "string") return false;
              const sL = serv.trim().toLowerCase();
              return sL === servLower || sL.includes(servLower) || servLower.includes(sL);
            });
          });
          targetStaffList = qualified.length > 0 ? qualified : allStaff;
        } else {
          targetStaffList = allStaff;
        }
      }
    }

    if (targetStaffList.length === 0) {
      return NextResponse.json(allSlots);
    }

    // 3. Fetch active bookings for the specified date
    const { data: rawBookings, error } = await supabase
      .from("bookings")
      .select("*")
      .neq("status", "cancelled")
      .neq("status", "rejected");

    if (error) {
      console.error("[Availability API Error]:", error);
      throw error;
    }

    const bookings = (rawBookings || []).filter((b: any) => {
      const bAppDate = b.appointment_date ? String(b.appointment_date).split("T")[0] : null;
      const bDate = b.date ? String(b.date).split("T")[0] : null;
      return bAppDate === date || bDate === date;
    });

    const toMinutes = (timeStr: string): number | null => {
      if (!timeStr) return null;
      const clean = String(timeStr).trim();
      const parts = clean.split(":").map(Number);
      if (isNaN(parts[0])) return null;
      return parts[0] * 60 + (parts[1] || 0);
    };

    // 4. Calculate available slots across the target staff members
    const availableSlots = allSlots.filter((slot) => {
      const slotMins = toMinutes(slot);
      if (slotMins === null) return false;
      const slotEndMins = slotMins + serviceDuration;

      // Check if at least ONE staff member in targetStaffList is free for this slot
      for (const staffMember of targetStaffList) {
        const staffId = staffMember.id;
        const staffNameLower = staffMember.name.trim().toLowerCase();
        let isStaffOnLeave = false;
        const bookedRanges: Array<{ start: number; end: number }> = [];

        for (const booking of bookings) {
          let isForStaff = false;

          if (staffId !== 0 && booking.staff_id !== null && booking.staff_id !== undefined) {
            if (Number(booking.staff_id) === staffId) {
              isForStaff = true;
            }
          }

          if (!isForStaff && booking.staff_name) {
            const sName = String(booking.staff_name).trim().toLowerCase();
            if (sName === staffNameLower || sName.includes(staffNameLower) || staffNameLower.includes(sName)) {
              isForStaff = true;
            }
          }

          if (!isForStaff && booking.services) {
            let servicesList: any[] = [];
            try {
              servicesList = Array.isArray(booking.services)
                ? booking.services
                : typeof booking.services === "string"
                ? JSON.parse(booking.services)
                : [];
            } catch {
              servicesList = [];
            }

            if (
              servicesList.some((s: any) => {
                if (!s) return false;
                if (staffId !== 0 && s.staff_id && Number(s.staff_id) === staffId) return true;
                if (s.staff) {
                  const sStaffLower = String(s.staff).trim().toLowerCase();
                  return sStaffLower === staffNameLower || sStaffLower.includes(staffNameLower) || staffNameLower.includes(sStaffLower);
                }
                return false;
              })
            ) {
              isForStaff = true;
            }
          }

          if (!isForStaff && (booking.category === "Busy" || booking.category === "Leave" || booking.booking_source === "busy" || booking.booking_source === "leave")) {
            const text = `${booking.name || ""} ${booking.customer_name || ""} ${booking.notes || ""}`.toLowerCase();
            if (text.includes(staffNameLower)) {
              isForStaff = true;
            }
          }

          if (isForStaff) {
            if (
              booking.category === "Leave" ||
              booking.booking_source === "leave" ||
              (booking.start_time === "00:00:00" && booking.end_time === "00:00:00") ||
              (booking.start_time === "00:00" && booking.end_time === "00:00")
            ) {
              isStaffOnLeave = true;
              break;
            }

            const rawStart = booking.start_time || booking.time;
            const startMins = toMinutes(rawStart);
            if (startMins !== null) {
              const rawEndMins = toMinutes(booking.end_time);
              const endMins: number = (rawEndMins !== null && rawEndMins > startMins)
                ? rawEndMins
                : startMins + (booking.duration_minutes || 30);
              bookedRanges.push({ start: startMins, end: endMins });
            }
          }
        }

        if (isStaffOnLeave) continue;

        let hasOverlap = false;
        for (const range of bookedRanges) {
          if (slotMins < range.end && slotEndMins > range.start) {
            hasOverlap = true;
            break;
          }
        }

        if (!hasOverlap) {
          return true; // At least one staff member is available at this time!
        }
      }

      return false; // No staff member is available for this slot
    });

    return NextResponse.json(availableSlots);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch availability" },
      { status: 500 }
    );
  }
}