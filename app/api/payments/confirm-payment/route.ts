import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { confirmPaymentSchema, formatZodError } from "@/lib/validations";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = confirmPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { bookingId, sessionId } = body;

    const isMock = sessionId.startsWith("mock_session_") || !process.env.STRIPE_SECRET_KEY;
    let paymentVerified = false;
    let metadata: any = {};

    if (isMock) {
      console.log(`[Stripe Verification] Bypassing verification for mock session: ${sessionId}`);
      paymentVerified = true;
    } else {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2023-10-16" as any,
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        metadata = session.metadata || {};
        
        if (session.payment_status === "paid") {
          paymentVerified = true;
        } else {
          console.warn(`[Stripe Verification] Session ${sessionId} is unpaid. Status: ${session.payment_status}`);
        }
      } catch (err: any) {
        console.error("[Stripe Verification] Failed to retrieve session from Stripe:", err.message);
        return NextResponse.json(
          { success: false, error: "Failed to verify payment with Stripe: " + err.message },
          { status: 500 }
        );
      }
    }

    if (!paymentVerified) {
      return NextResponse.json(
        { success: false, error: "Payment not completed or verified." },
        { status: 400 }
      );
    }

    // Resolve which booking IDs to confirm
    let bookingIds: number[] = [];
    if (metadata.booking_ids) {
      bookingIds = metadata.booking_ids.split(",").map(Number);
    } else {
      bookingIds = [parseInt(bookingId, 10)];
    }

    // 1. Update the booking status in the database to confirmed for all IDs
    const { data: bookings, error: dbError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .in("id", bookingIds)
      .select();

    if (dbError) throw dbError;

    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { success: false, error: "Bookings not found in database." },
        { status: 404 }
      );
    }

    // Use the first booking as reference
    const booking = bookings[0];

    // 2. Map services from all booking records to compile a single unified list
    const servicesList: any[] = [];
    let grandTotal = 0;

    for (const b of bookings) {
      grandTotal += Number(b.total) || 0;
      let parsed = [];
      try {
        if (b.services) {
          parsed = typeof b.services === "string" ? JSON.parse(b.services) : b.services;
        }
      } catch (e) {
        console.error("Failed to parse booking services for WhatsApp:", e);
      }
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        servicesList.push(...parsed);
      } else {
        servicesList.push({ service: b.service_name || "Salon Treatment", staff: "Any Staff" });
      }
    }

    // 3. Send WhatsApp booking confirmation (single message summarizing all services)
    if (booking.phone) {
      const whatsappMsg = `✅ *Rospa Salon - Payment Confirmed!* 🌟

Dear ${booking.name},

Thank you! We have received your payment, and your booking has been successfully confirmed.

📅 *Date:* ${booking.appointment_date || booking.date}
⏰ *Time:* ${(booking.start_time || booking.time || "").substring(0, 5)}
💰 *Amount Paid:* QR ${grandTotal}
💳 *Payment:* Card (Paid Online)
📌 *Status:* CONFIRMED

*Services Booked:*
${servicesList.map((s: any) => `• ${s.service} (with ${s.staff || "Any Staff"})`).join("\n")}

We look forward to giving you a luxury pampering session!
📍 Rospa Salon`;

      try {
        const result = await sendWhatsAppMessage(String(booking.phone), whatsappMsg);
        console.log("[Confirm Payment] WhatsApp confirmation result:", result.success ? "SENT" : "FAILED", result.error || "");
      } catch (err) {
        console.error("[Confirm Payment] Error sending WhatsApp confirmation:", err);
      }
    }

    // Attach unified fields so the success page can render them properly
    const unifiedBooking = {
      ...booking,
      date: booking.appointment_date || booking.date,
      time: booking.start_time || booking.time,
      total: grandTotal,
      services: servicesList,
    };

    return NextResponse.json({
      success: true,
      booking: unifiedBooking,
    });
  } catch (error: any) {
    console.error("[Confirm Payment API] Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
