import { supabaseAdmin as supabase } from "./supabaseAdmin";

/**
 * Helper to add minutes to a time string (e.g. "14:00" + 30 -> "14:30:00")
 */
export function addMinutes(timeStr: string, mins: number): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}:00`;
}

/**
 * Checks if a staff member is available for a given time slot.
 * Returns true if available, false if busy.
 * Excludes a specific booking ID (useful during updates/drag-and-drop).
 */
export async function checkStaffAvailability(
  staffId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: number,
  inMemoryBookings?: { staffId: number; startTime: string; endTime: string }[]
): Promise<boolean> {
  if (!staffId || !date || !startTime || !endTime) {
    return false;
  }

  // Normalize times by removing seconds if present, e.g. "14:00:00" -> "14:00"
  const formatTime = (t: string) => t.substring(0, 5);
  const newStart = formatTime(startTime);
  const newEnd = formatTime(endTime);

  // Check against in-memory bookings from the same request
  if (inMemoryBookings && inMemoryBookings.length > 0) {
    for (const b of inMemoryBookings) {
      if (b.staffId === staffId) {
        const existStart = formatTime(b.startTime);
        const existEnd = formatTime(b.endTime);
        if (newStart < existEnd && existStart < newEnd) {
          return false; // Overlap with another service in the same request
        }
      }
    }
  }

  // Fetch all confirmed or pending bookings for this staff member on this date
  let query = supabase
    .from("bookings")
    .select("id, start_time, end_time, status, category")
    .eq("appointment_date", date)
    .eq("staff_id", staffId)
    .in("status", ["confirmed", "pending", "arrived"]);

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error("[checkStaffAvailability] DB Error:", error);
    throw error;
  }

  if (!bookings || bookings.length === 0) {
    return true; // No DB bookings, staff is available
  }

  // Check for time overlap
  for (const b of bookings) {
    if (b.category === "Leave") {
      return false; // Full day leave
    }

    if (!b.start_time || !b.end_time) continue;
    
    const existStart = formatTime(b.start_time);
    const existEnd = formatTime(b.end_time);

    // If it's a full day block created as 00:00 to 00:00
    if (existStart === "00:00" && existEnd === "00:00") {
      return false;
    }

    if (newStart < existEnd && existStart < newEnd) {
      return false; // Overlap detected!
    }
  }

  return true;
}

/**
 * Resolves the staff ID for a service booking.
 * If a specific staff name is provided, finds them and verifies availability.
 * If no staff name is provided, finds the first available staff member qualified for the service.
 */
export async function resolveAndVerifyStaff(
  serviceName: string,
  staffName: string | undefined,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: number,
  inMemoryBookings?: { staffId: number; startTime: string; endTime: string }[]
): Promise<{ id: number; name: string }> {
  const cleanStaffName = staffName ? staffName.trim() : "";
  const serviceNameLower = serviceName.trim().toLowerCase();

  if (cleanStaffName && cleanStaffName.toLowerCase() !== "any staff") {
    // Look up the specific staff member
    const { data: staffMember, error } = await supabase
      .from("staff")
      .select("id, name")
      .ilike("name", cleanStaffName)
      .maybeSingle();

    if (error || !staffMember) {
      throw new Error(`Staff member "${staffName}" not found`);
    }

    const isAvailable = await checkStaffAvailability(
      staffMember.id,
      date,
      startTime,
      endTime,
      excludeBookingId,
      inMemoryBookings
    );
    if (!isAvailable) {
      throw new Error(`${staffMember.name} is not available for this time`);
    }

    return { id: staffMember.id, name: staffMember.name };
  } else {
    // Find all staff members to filter case-insensitively in JS
    const { data: allStaff, error } = await supabase
      .from("staff")
      .select("id, name, services");

    if (error || !allStaff || allStaff.length === 0) {
      throw new Error(`No staff members found in the database`);
    }

    // Fetch category from database to match frontend filtering logic
    let categoryLower = "";
    const { data: serviceData } = await supabase
      .from("services")
      .select("category")
      .ilike("name", serviceName)
      .maybeSingle();

    if (serviceData && serviceData.category) {
      categoryLower = serviceData.category.trim().toLowerCase();
    }

    const qualifiedStaff = allStaff.filter(s => {
       if (!s.services || !Array.isArray(s.services)) return false;
       return s.services.some((serv: string) => {
         const servL = serv.trim().toLowerCase();
         return servL === serviceNameLower || (categoryLower && servL === categoryLower);
       });
    });

    if (qualifiedStaff.length === 0) {
      throw new Error(`No staff members are qualified for service "${serviceName}"`);
    }

    // Find the first available staff member
    for (const s of qualifiedStaff) {
      const isAvailable = await checkStaffAvailability(
        s.id,
        date,
        startTime,
        endTime,
        excludeBookingId,
        inMemoryBookings
      );
      if (isAvailable) {
        return { id: s.id, name: s.name }; // Return the first available qualified staff member
      }
    }

    // If we checked all and none are available
    throw new Error("Staff is not available for this time");
  }
}

/**
 * Verifies if a staff member is qualified / assigned to perform a specific service or category.
 */
export async function checkStaffQualification(
  staffId: number,
  serviceName?: string,
  serviceCategory?: string
): Promise<{ qualified: boolean; staffName: string; reason?: string }> {
  if (!staffId || !serviceName) {
    return { qualified: true, staffName: "Staff" };
  }

  const servLower = serviceName.trim().toLowerCase();
  const catLower = (serviceCategory || "").trim().toLowerCase();

  // Busy/Leave/Break entries don't require specific service qualification
  if (
    servLower === "busy" ||
    servLower === "busy block" ||
    servLower === "leave" ||
    servLower === "break" ||
    catLower === "busy" ||
    catLower === "leave"
  ) {
    return { qualified: true, staffName: "Staff" };
  }

  const { data: staffMember, error } = await supabase
    .from("staff")
    .select("id, name, services")
    .eq("id", staffId)
    .maybeSingle();

  if (error || !staffMember) {
    return { qualified: true, staffName: "Staff" };
  }

  const staffName = staffMember.name || "Staff";
  let staffServices: string[] = Array.isArray(staffMember.services)
    ? staffMember.services
    : typeof staffMember.services === "string"
    ? JSON.parse(staffMember.services || "[]")
    : [];

  const defaultStaffServicesMap: Record<string, string[]> = {
    "jocelyn": ["Haircut", "Coloring", "Protein", "Waxing", "Keratin Protein Treatment", "Hair Care", "Hair"],
    "feriel": ["Manicure", "Nail Art", "Gel Polish", "Gel Polish Removal", "Classic Eyelash Extensions", "Volume Lash Extensions", "Gel extentions", "Nails & Spa", "Nails"],
    "reham": ["Hair Spa", "Full Body Relaxing Massage", "Deep Tissue Massage", "Thai Massage", "Any Facial", "Hot Oil Massage", "Moroccan Bath", "Footspa", "Massage", "Spa"],
    "ramsi": ["Any Facial", "Kanpeki Korean Facial", "Premium Hydra Facial", "Anti-aging Hydra Facial", "Full Body Waxing", "Half Leg Waxing", "Half Arms Waxing", "Full Face Wax", "Eyebrows Wax", "Forehead Wax", "Chin Wax", "Belly Wax", "Back Wax", "Chest Wax", "Hairspa", "Facials", "Facial"],
    "zara": ["Manicure", "Pedicure", "Gel extentions", "Gel polish", "Pedicure and Manicure", "Gel polish Removal", "Nails & Spa", "Nails"],
    "kopila": ["Hair Spa", "Hairspa", "Footspa"],
    "rebecca": ["Haircut", "Coloring", "Hair Spa", "massage", "Protein", "Kanpeki Korean Facial", "Any Facial", "Hot Oil Massage", "Full Body Relaxing Massage", "Relaxing Foot Reflexology", "Waxing", "Hairspa", "Footspa", "Keratin Protein Treatment", "Hair Care", "Hair"],
    "yashodha": ["Hair Spa", "Pedicure", "Classic Eyelash Extensions", "Volume Lash Extensions", "Relaxing Foot Reflexology", "Hairspa", "Footspa", "Manicure", "Pedicure and Manicure", "Nails & Spa", "Nails"],
    "maggy": ["Full Body Relaxing Massage", "Deep Tissue Massage", "Thai Massage", "Hot Oil Massage", "Moroccan Bath", "Footspa", "Massage"],
    "nancy": ["Full Body Relaxing Massage", "Deep Tissue Massage", "Thai Massage", "Hot Oil Massage", "Waxing", "Footspa", "Massage"],
    "sajal": ["hair", "Hair Spa", "Hairspa", "Hair Care", "Hair"],
    "brahim": ["Hair Care", "Hair", "Combo", "Any haircut", "Beard setting", "Kids haircut"],
    "leopoldo": ["Massages", "Deep tissue massage", "Relaxing massage", "Thai massage", "Signature massage", "Foot massage", "Massage"]
  };

  if (staffServices.length === 0) {
    const sNameKey = staffName.trim().toLowerCase();
    staffServices = defaultStaffServicesMap[sNameKey] || [];
  }

  if (staffServices.length === 0) {
    return { qualified: true, staffName };
  }

  let categoryToCheck = catLower;
  if (!categoryToCheck) {
    const { data: serviceData } = await supabase
      .from("services")
      .select("category")
      .ilike("name", serviceName.trim())
      .maybeSingle();
    if (serviceData?.category) {
      categoryToCheck = serviceData.category.trim().toLowerCase();
    }
  }

  const isQualified = staffServices.some((serv: string) => {
    if (typeof serv !== "string") return false;
    const sLower = serv.trim().toLowerCase();

    // 1. Exact service name match (e.g. "Haircut" === "Haircut")
    if (servLower && sLower === servLower) return true;

    // 2. Exact category name match (e.g. "Hair Care", "Nails & Spa", "Facials", "Massage")
    if (categoryToCheck && sLower === categoryToCheck) return true;

    // 3. Standardized category equivalence matching (strictly identical to Bookingmodal dropdown filter)
    if (categoryToCheck === "hair care" || categoryToCheck === "hair") {
      if (sLower === "hair care" || sLower === "hair") return true;
    }
    if (categoryToCheck === "nails & spa" || categoryToCheck === "nails") {
      if (sLower === "nails & spa" || sLower === "nails") return true;
    }
    if (categoryToCheck === "facials" || categoryToCheck === "facial") {
      if (sLower === "facials" || sLower === "facial") return true;
    }
    if (categoryToCheck === "massage") {
      if (sLower === "massage" || sLower === "massages") return true;
    }
    if (categoryToCheck === "eye lashes" || categoryToCheck === "lashes") {
      if (sLower === "eye lashes" || sLower === "lashes") return true;
    }
    if (categoryToCheck === "waxing" || categoryToCheck === "wax") {
      if (sLower === "waxing" || sLower === "wax") return true;
    }
    if (categoryToCheck === "moroccan bath" || categoryToCheck === "bath") {
      if (sLower === "moroccan bath" || sLower === "bath") return true;
    }

    return false;
  });

  if (!isQualified) {
    return {
      qualified: false,
      staffName,
      reason: `${staffName} is not assigned to perform "${serviceName}". Please assign this service to a qualified stylist from the dropdown list.`,
    };
  }

  return { qualified: true, staffName };
}

