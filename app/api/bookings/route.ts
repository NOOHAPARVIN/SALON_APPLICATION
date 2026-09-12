import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { checkStaffAvailability, resolveAndVerifyStaff, addMinutes, checkStaffQualification } from "@/lib/bookingValidation";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";
import { NextResponse } from "next/server";
import { createBookingSchema, updateBookingSchema, formatZodError } from "@/lib/validations";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: Request) {
  try {
    // SECURITY ENFORCEMENT: Only authenticated users can list bookings
    const { createClient } = await import('@/utils/supabase/server');
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const branch = searchParams.get("branch");
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) {
      return Response.json({ success: false, error: compError }, { status: 400 });
    }

    let query = supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (start && end) {
      // Fetch bookings where the appointment_date is within the range
      query = query.gte("appointment_date", start).lte("appointment_date", end);
    }
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (branch && branch !== 'all') {
      query = query.eq('branch', branch);
    }

    let { data: bookings, error } = await query;

    if (error && error.message && error.message.includes("branch")) {
      console.warn("branch column missing in bookings table, falling back to base query");
      let fallbackQuery = supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (start && end) {
        fallbackQuery = fallbackQuery.gte("appointment_date", start).lte("appointment_date", end);
      }
      if (companyId) {
        fallbackQuery = fallbackQuery.eq("company_id", companyId);
      }
      const res = await fallbackQuery;
      bookings = res.data || [];
      error = null;
    }

    if (error) throw error;

    // Map database rows to expected nested structure for the frontend
    const mappedBookings = (bookings || []).map((b: any) => {
      let parsedServices = [];
      try {
        if (b.services) {
          parsedServices = typeof b.services === "string" ? JSON.parse(b.services) : b.services;
        }
      } catch (e) {
        console.error("Failed to parse services:", e);
        // Fallback to array if it is a plain text representation
        parsedServices = [{ category: b.category || "Service", service: b.service_name || b.services, staff: "", price: b.total || 0 }];
      }

      return {
        ...b,
        customer: {
          name: b.name,
          phone: b.phone ? String(b.phone) : "",
        },
        services: parsedServices,
      };
    });

    return Response.json({
      bookings: mappedBookings,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || error,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ success: false, error: formatZodError(parsed.error) }, { status: 400 });
    }

    const services = Array.isArray(body.services) ? body.services : [];
    if (services.length === 0) {
      return Response.json({ success: false, error: "No services selected" }, { status: 400 });
    }

    // Preserve the original phone string for WhatsApp before converting to int for DB
    const originalPhone = body.customer?.phone ? String(body.customer.phone).trim() : "";

    // Clean phone number and parse to integer for database int8 type
    const phoneVal = originalPhone
      ? parseInt(originalPhone.replace(/\D/g, ""), 10)
      : null;

    const date = body.date;
    const time = body.time; // Format "HH:MM"

    if (!date || !time) {
      return Response.json({ success: false, error: "Missing date or time" }, { status: 400 });
    }

    const resolvedServices: any[] = [];

    for (const s of services) {
      try {
        // Support service-specific times, or fall back to overall booking times
        const sStartVal = s.start_time || time;
        const sStart = sStartVal.length === 5 ? `${sStartVal}:00` : sStartVal;
        
        const sDuration = Number(s.duration_minutes) || 30;
        
        let sEnd = s.end_time || "";
        if (!sEnd) {
          sEnd = addMinutes(sStartVal, sDuration);
        } else if (sEnd.length === 5) {
          sEnd = `${sEnd}:00`;
        }

        const inMemoryBookings = resolvedServices.map((r) => ({
          staffId: r.staffId,
          startTime: r.start_time,
          endTime: r.end_time,
        }));

        const resolved = await resolveAndVerifyStaff(
          s.service,
          s.staff,
          date,
          sStart,
          sEnd,
          undefined, // excludeBookingId is undefined for new bookings
          inMemoryBookings
        );

        resolvedServices.push({
          ...s,
          staffId: resolved.id,
          staffName: resolved.name,
          start_time: sStart,
          end_time: sEnd,
          duration_minutes: sDuration,
          price: s.price !== undefined ? Number(s.price) : 0,
          notes: s.notes || "",
        });
      } catch (err: any) {
        // Return exactly "Staff is not available for this time" if availability check fails
        if (err.message === "Staff is not available for this time") {
          return Response.json({ success: false, error: "Staff is not available for this time" }, { status: 400 });
        }
        return Response.json({ success: false, error: err.message }, { status: 400 });
      }
    }

    // Insert separate rows into Booking for each service
    const groupId = body.group_id || crypto.randomUUID(); // Group ID for multi-service bookings
    
    const { companyId, error: compError } = await getCompanyIdFromRequest(req, body.branch);
    if (compError) {
      return Response.json({ success: false, error: compError }, { status: 400 });
    }

    const rawNotes = body.notes || body.note || null;
    const customerNotes = rawNotes;

    const bookingsToInsert = resolvedServices.map((rs) => ({
      group_id: groupId,
      name: body.customer?.name,
      customer_name: body.customer?.name,
      phone: phoneVal,
      appointment_date: date,
      start_time: rs.start_time,
      end_time: rs.end_time,
      duration_minutes: rs.duration_minutes,
      staff_id: rs.staffId,
      service_id: body.service_id || null,
      category: rs.category,
      service_name: rs.service,
      price: rs.price || 0,
      payment_method: body.payment,
      payment_status: body.payment_status || (body.payment === "card" || body.payment === "online" ? "pending" : "unpaid"),
      created_by: body.created_by || "website",
      total: rs.price || 0,
      notes: customerNotes,
      status: body.status || "pending",
      booking_source: body.booking_source || "website",
      tips: body.tipped_staff_id 
              ? (String(rs.staffId) === String(body.tipped_staff_id) ? (body.tips !== undefined ? Number(body.tips) : 0) : 0) 
              : (body.tips !== undefined ? Number(body.tips) : 0),
      branch: body.branch || 'rospa',
      company_id: companyId || '00000000-0000-0000-0000-000000000000', // Default to Rospa if null
    }));

    let { data: insertedBookings, error } = await supabase
      .from("bookings")
      .insert(bookingsToInsert)
      .select();

    if (error && error.message && error.message.includes("branch")) {
      console.warn("Branch column missing in bookings, retrying without branch");
      const retryBookings = bookingsToInsert.map(({ branch, ...rest }) => rest);
      const fallbackResult = await supabase.from("bookings").insert(retryBookings).select();
      insertedBookings = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;
    if (!insertedBookings || insertedBookings.length === 0) {
      throw new Error("Failed to insert bookings in database");
    }

    // Use first inserted booking as the primary reference
    const primaryBooking = insertedBookings[0];
    const bookingIdsStr = insertedBookings.map((b) => b.id).join(",");

    // Stripe checkout integration
    let checkoutUrl = "";
    // Fetch company settings for dynamic white-labeling
    let senderName = "Salon";
    let twilioSenderNumber: string | undefined;
    if (companyId) {
      const { data: companyData } = await supabase.from('companies').select('name, settings').eq('id', companyId).single();
      if (companyData) {
        senderName = companyData.settings?.sender_name || companyData.name || "Salon";
        twilioSenderNumber = companyData.settings?.twilio_phone_number;
      }
    }

    if (body.payment === "online") {
      const { origin } = new URL(req.url);
      checkoutUrl = `${origin}/booking/payment?booking_id=${primaryBooking.id}&total=${body.total || 0}`;
    } else if (body.payment === "card") {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2023-10-16" as any,
        });
        const { origin } = new URL(req.url);

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "qar",
                product_data: {
                  name: `${senderName} Booking`,
                  description: services.map((s: any) => s.service).join(", "),
                },
                unit_amount: Math.round((body.total || 0) * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${origin}/booking/success?booking_id=${primaryBooking.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/booking/cancelled?booking_id=${primaryBooking.id}`,
          metadata: {
            booking_id: String(primaryBooking.id),
            booking_ids: bookingIdsStr,
          },
        });
        checkoutUrl = session.url || "";
      } else {
        console.warn("[Stripe] STRIPE_SECRET_KEY is missing. Generating simulated checkout URL.");
        const { origin } = new URL(req.url);
        checkoutUrl = `${origin}/booking/success?booking_id=${primaryBooking.id}&session_id=mock_session_${Date.now()}`;
      }
    }

    // Send WhatsApp or SMS booking confirmation for ALL payment types (summarizing all services)
    if (originalPhone) {
      const whatsappMsg = `🌟 *${senderName} - Booking Confirmed* 🌟\n\nDear ${body.customer?.name},\n\nThank you for booking with us! Here are your appointment details:\n\n📅 *Date:* ${date}\n⏰ *Time:* ${time}\n*Services:*\n${resolvedServices.map((rs: any) => `  • ${rs.service} (with ${rs.staffName})`).join("\n")}\n\nWe look forward to seeing you!\n📍 ${senderName}`;

      try {
        if (body.channel === "sms") {
          const smsMsg = `${senderName}: Dear ${body.customer?.name}, your booking on ${date} at ${time} is confirmed! Services: ${resolvedServices.map((rs: any) => rs.service).join(", ")}. See you soon!`;
          const { sendSMSMessage } = await import("@/lib/whatsapp");
          const result = await sendSMSMessage(originalPhone, smsMsg, twilioSenderNumber);
          console.log("[Booking POST] SMS send result:", result.success ? "SENT" : "FAILED", result.error || "");
        } else {
          const result = await sendWhatsAppMessage(originalPhone, whatsappMsg, body.branch, twilioSenderNumber);
          console.log("[Booking POST] WhatsApp send result:", result.success ? "SENT" : "FAILED", result.error || "");
        }
      } catch (err) {
        console.error("[Booking POST] Error sending confirmation notification:", err);
      }
    }

    return Response.json({
      success: true,
      booking: {
        ...primaryBooking,
        customer: {
          name: primaryBooking.name,
          phone: originalPhone,
        },
      },
      checkoutUrl: checkoutUrl || undefined,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || error,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);

    if (compError) {
      return Response.json({ success: false, error: compError }, { status: 400 });
    }

    if (!id) {
      return Response.json(
        { success: false, error: "Missing booking ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate input
    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ success: false, error: formatZodError(parsed.error) }, { status: 400 });
    }
    
    // Forced hot-reload comment to pick up new validation schema
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.name !== undefined) {
      updateData.name = body.name;
      updateData.customer_name = body.name;
    }
    if (body.customer_name !== undefined) updateData.customer_name = body.customer_name;
    if (body.phone !== undefined) {
      updateData.phone = body.phone ? parseInt(String(body.phone).replace(/\D/g, ""), 10) : null;
    }
    if (body.appointment_date !== undefined) {
      updateData.appointment_date = body.appointment_date;
    }
    if (body.start_time !== undefined) {
      updateData.start_time = body.start_time;
    }
    if (body.end_time !== undefined) updateData.end_time = body.end_time;
    if (body.staff_id !== undefined) updateData.staff_id = body.staff_id ? Number(body.staff_id) : null;
    if (body.service_id !== undefined) updateData.service_id = body.service_id ? Number(body.service_id) : null;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.service_name !== undefined) updateData.service_name = body.service_name;
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.duration_minutes !== undefined) updateData.duration_minutes = Number(body.duration_minutes);
    if (body.total !== undefined) {
      updateData.total = Number(body.total);
      updateData.price = Number(body.total);
    }
    if (body.payment_method !== undefined) {
      updateData.payment_method = body.payment_method;
    }
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;
    if (body.booking_source !== undefined) updateData.booking_source = body.booking_source;
    if (body.created_by !== undefined) updateData.created_by = body.created_by;
    if (body.tips !== undefined) updateData.tips = Number(body.tips);
    if (body.cancel_reason !== undefined) updateData.cancel_reason = body.cancel_reason;
    if (body.refund_amount !== undefined) updateData.refund_amount = Number(body.refund_amount);
    if (body.refund_reason !== undefined) updateData.refund_reason = body.refund_reason;

    // Fetch existing booking for conflict checking and WhatsApp notification
    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", parseInt(id, 10))
      .single();

    if (fetchError) throw fetchError;

    // If staff_id or start_time is updated, resolve staff_name and sync services JSON array
    let newStaffName: string | undefined;
    if (body.staff_id !== undefined && body.staff_id !== null) {
      const { data: staffMember } = await supabase
        .from("staff")
        .select("name")
        .eq("id", Number(body.staff_id))
        .maybeSingle();
      if (staffMember?.name) {
        newStaffName = staffMember.name;
      }
    }

    if (existingBooking.services && (newStaffName || body.start_time || body.end_time)) {
      try {
        let servList = typeof existingBooking.services === "string" 
          ? JSON.parse(existingBooking.services) 
          : existingBooking.services;
        
        if (Array.isArray(servList) && servList.length > 0) {
          servList = servList.map((s: any, idx: number) => {
            if (idx === 0) {
              return {
                ...s,
                ...(newStaffName ? { staff: newStaffName, staff_id: Number(body.staff_id) } : {}),
                ...(body.start_time ? { start_time: body.start_time } : {}),
                ...(body.end_time ? { end_time: body.end_time } : {}),
              };
            }
            return s;
          });
          updateData.services = typeof existingBooking.services === "string" ? JSON.stringify(servList) : servList;
        }
      } catch (e) {
        console.error("Error updating services JSON in PATCH:", e);
      }
    }

    // Check for staff qualification (whether staff is assigned to perform the service)
    const checkStaff = updateData.staff_id !== undefined ? updateData.staff_id : existingBooking.staff_id;
    const checkDate = updateData.appointment_date !== undefined ? updateData.appointment_date : existingBooking.appointment_date;
    const checkStart = updateData.start_time !== undefined ? updateData.start_time : existingBooking.start_time;
    const checkEnd = updateData.end_time !== undefined ? updateData.end_time : existingBooking.end_time;
    const checkStatus = updateData.status !== undefined ? updateData.status : existingBooking.status;
    const checkService = updateData.service_name !== undefined ? updateData.service_name : existingBooking.service_name;
    const checkCategory = updateData.category !== undefined ? updateData.category : existingBooking.category;

    if (!body.ignore_qualification && checkStaff && checkService) {
      try {
        const qualCheck = await checkStaffQualification(Number(checkStaff), checkService, checkCategory);
        if (!qualCheck.qualified) {
          return Response.json({
            success: false,
            error: qualCheck.reason || `${qualCheck.staffName} cannot perform this service.`,
          }, { status: 400 });
        }
      } catch (err: any) {
        console.error("Qualification check error:", err);
      }
    }

    if (!body.ignore_availability && checkStaff && checkDate && checkStart && checkEnd && ["confirmed", "pending", "arrived"].includes(checkStatus)) {
      try {
        const isAvailable = await checkStaffAvailability(
          Number(checkStaff),
          checkDate,
          checkStart,
          checkEnd,
          parseInt(id, 10)
        );

        if (!isAvailable) {
          // Fetch staff name to include in error
          const { data: staffData } = await supabase.from("staff").select("name").eq("id", Number(checkStaff)).single();
          const staffName = staffData?.name || "Staff";
          
          return Response.json({
            success: false,
            error: `${staffName} is not available for this time`,
          }, { status: 400 });
        }
      } catch (err: any) {
        return Response.json({
          success: false,
          error: err.message || "Staff is not available for this time",
        }, { status: 400 });
      }
    }

    // Perform the database update
    let query = supabase
      .from("bookings")
      .update(updateData)
      .eq("id", parseInt(id, 10));

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: booking, error } = await query
      .select()
      .single();

    if (error) throw error;

    // Auto-redeem gift card if checked out
    if (updateData.status === "completed" && booking?.notes && booking.notes.includes("Code: GC-")) {
      const match = booking.notes.match(/Code: (GC-[A-Z0-9-]+)/);
      if (match && match[1]) {
        await supabase.from("gift_cards").update({ status: "redeemed" }).eq("coupon_code", match[1]);
      }
    }

    // Automatically sync completion or payment status, or time changes to other services booked in the same transaction
    if (updateData.status === "completed" || updateData.payment_status === "paid" || updateData.status === "cancelled" || updateData.appointment_date || updateData.start_time) {
      const syncData: any = {};
      if (updateData.status !== undefined) syncData.status = updateData.status;
      if (updateData.payment_status !== undefined) syncData.payment_status = updateData.payment_status;
      if (updateData.payment_method !== undefined) syncData.payment_method = updateData.payment_method;
      if (updateData.cancel_reason !== undefined) syncData.cancel_reason = updateData.cancel_reason;
      
      let timeShiftMinutes = 0;
      let isTimeShifted = false;
      if (updateData.start_time && updateData.start_time !== existingBooking.start_time) {
        const parseMins = (t: string) => {
          if (!t) return 0;
          const p = t.split(":");
          return parseInt(p[0]||"0", 10) * 60 + parseInt(p[1]||"0", 10);
        };
        timeShiftMinutes = parseMins(updateData.start_time) - parseMins(existingBooking.start_time);
        isTimeShifted = true;
      }

      // We only sync if there is a group_id or if we fall back to fuzzy match.
      if (!body.ignore_sync && (Object.keys(syncData).length > 0 || updateData.appointment_date || isTimeShifted)) {
        let query = supabase
          .from("bookings")
          .select("*")
          .neq("id", parseInt(id, 10));

        if (existingBooking.group_id) {
          query = query.eq("group_id", existingBooking.group_id);
        } else if (existingBooking.appointment_date) {
          // Fallback for older bookings without group_id
          query = query.eq("appointment_date", existingBooking.appointment_date);
          if (existingBooking.phone) {
            query = query.eq("phone", existingBooking.phone);
          } else if (existingBooking.name) {
            query = query.eq("name", existingBooking.name);
          }
        } else {
          // No way to identify group, abort sync
          query = null as any; 
        }

        if (query) {
          const { data: relatedBookings } = await query;

          if (relatedBookings && relatedBookings.length > 0) {
            for (const related of relatedBookings) {
              const rowUpdate: any = { ...syncData };
              if (updateData.appointment_date) {
                rowUpdate.appointment_date = updateData.appointment_date;
              }
              if (isTimeShifted && related.start_time && related.end_time) {
                const parseMins = (t: string) => {
                  if (!t) return 0;
                  const p = t.split(":");
                  return parseInt(p[0]||"0", 10) * 60 + parseInt(p[1]||"0", 10);
                };
                const formatMins = (m: number) => {
                  const validM = ((m % 1440) + 1440) % 1440;
                  const h = Math.floor(validM / 60);
                  const mins = validM % 60;
                  return `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
                };
                
                const oldStartMins = parseMins(related.start_time);
                const oldEndMins = parseMins(related.end_time);
                
                rowUpdate.start_time = formatMins(oldStartMins + timeShiftMinutes);
                rowUpdate.end_time = formatMins(oldEndMins + timeShiftMinutes);
              }
              
              await supabase.from("bookings").update(rowUpdate).eq("id", related.id);
            }
          }
        }
      }
    }

    // Automatically redeem Gift Card if booking is paid or completed
    if (updateData.status === "completed" || updateData.payment_status === "paid") {
      const notes = booking.notes || "";
      const gcMatch = notes.match(/Code:\s*(GC-[A-Z0-9]+-[0-9]+)/i);
      if (gcMatch && gcMatch[1]) {
        await supabase
          .from("gift_cards")
          .update({ status: "redeemed" })
          .eq("coupon_code", gcMatch[1].toUpperCase())
          .eq("status", "active");
      }
    }

    // Send WhatsApp status update if status changed
    if (booking && booking.phone && body.status !== undefined && body.status !== existingBooking.status) {
      let statusMsg = "";
      const dateStr = booking.appointment_date || booking.date || "";
      const timeStr = booking.start_time || booking.time || "";

      // Fetch company settings for dynamic white-labeling
      let senderName = "Salon";
      let twilioSenderNumber: string | undefined;
      if (companyId) {
        const { data: companyData } = await supabase.from('companies').select('name, settings').eq('id', companyId).single();
        if (companyData) {
          senderName = companyData.settings?.sender_name || companyData.name || "Salon";
          twilioSenderNumber = companyData.settings?.twilio_phone_number;
        }
      }

      if (body.status === "confirmed") {
        statusMsg = `✅ *${senderName} - Booking Confirmed!*

Dear ${booking.name},

Your appointment on ${dateStr} at ${timeStr.substring(0, 5)} has been confirmed!

💰 *Total:* QR ${booking.total || 0}

We look forward to welcoming you!
📍 ${senderName}`;
      } else if (body.status === "cancelled") {
        statusMsg = `❌ *${senderName} - Booking Cancelled*

Dear ${booking.name},

Your appointment on ${dateStr} at ${timeStr.substring(0, 5)} has been cancelled. If you believe this is an error or wish to reschedule, please contact us.

📍 ${senderName}`;
      } else if (body.status === "completed") {
        statusMsg = `🌸 *${senderName} - Appointment Completed*

Dear ${booking.name},

Thank you for visiting ${senderName}! We hope you loved your experience. We look forward to seeing you again soon!

📍 ${senderName}`;
      }

      if (statusMsg) {
        try {
          const result = await sendWhatsAppMessage(String(booking.phone), statusMsg, booking.branch, twilioSenderNumber);
          console.log("[Booking PATCH] WhatsApp status update result:", result.success ? "SENT" : "FAILED", result.error || "");
        } catch (err) {
          console.error("[Booking PATCH] Error sending status WhatsApp:", err);
        }
      }
    }

    const mappedBooking = booking
      ? {
          ...booking,
          customer: {
            name: booking.name,
            phone: booking.phone ? String(booking.phone) : "",
          },
        }
      : null;

    return Response.json({
      success: true,
      booking: mappedBooking,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || error,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { success: false, error: "Missing booking ID" },
        { status: 400 }
      );
    }

    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) {
      return Response.json({ success: false, error: compError }, { status: 400 });
    }

    let query = supabase
      .from("bookings")
      .delete()
      .eq("id", parseInt(id, 10));

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { error } = await query;

    if (error) throw error;

    return Response.json({
      success: true,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || error,
    });
  }
}
