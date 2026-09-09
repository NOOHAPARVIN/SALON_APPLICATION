import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import Stripe from "stripe";
import { z } from "zod";
import { formatZodError } from "@/lib/validations";

const confirmGiftSchema = z.object({
  gift_id: z.string().or(z.number()),
  sessionId: z.string(),
  booking_id: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = confirmGiftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { gift_id, sessionId, booking_id: mockBookingId } = parsed.data;

    const isMock = sessionId.startsWith("mock_session_") || !process.env.STRIPE_SECRET_KEY;
    let paymentVerified = false;
    let bookingId = mockBookingId;

    if (isMock) {
      console.log(`[Stripe Verification] Bypassing verification for mock session: ${sessionId}`);
      paymentVerified = true;
    } else {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2023-10-16" as any,
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status === "paid") {
          paymentVerified = true;
          if (session.metadata?.booking_id) {
            bookingId = session.metadata.booking_id;
          }
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

    // 1. Update the gift card status in the database to paid
    const { data: giftCards, error: dbError } = await supabase
      .from("gift_cards")
      .update({ status: "paid" })
      .eq("id", gift_id)
      .select();

    if (dbError) throw dbError;

    if (!giftCards || giftCards.length === 0) {
      return NextResponse.json(
        { success: false, error: "Gift card not found in database." },
        { status: 404 }
      );
    }

    const gift = giftCards[0];

    // 2. Update the booking status to confirmed and paid
    let bookingDateStr = "";
    if (bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .update({ 
          status: "confirmed",
          payment_status: "paid"
        })
        .eq("id", bookingId)
        .select()
        .single();
        
      if (!bookingError && booking) {
        bookingDateStr = `\n📅 *Date:* ${booking.appointment_date}\n⏰ *Time:* ${booking.start_time?.substring(0,5)}`;
      }
    }

    // 3. Send WhatsApp receipt to the purchaser
    const purchaserMsg = `✅ *Rospa Salon - Gift Purchase Confirmed!* 🌟

Dear ${gift.purchaser_name},

Thank you! We have received your payment. Your gift card and appointment for ${gift.recipient_name} is confirmed and will be sent to them shortly.

🎁 *Gift Service:* ${gift.service_name}${bookingDateStr}
💰 *Amount Paid:* QR ${gift.price}
💳 *Payment:* Card (Paid Online)

Thank you for choosing Rospa Salon to share your love! 💖
📍 Rospa Salon`;

    try {
      await sendWhatsAppMessage(String(gift.purchaser_phone), purchaserMsg, gift.branch);
      console.log("[Gift Confirm] WhatsApp sent to purchaser");
    } catch (err) {
      console.error("[Gift Confirm] Error sending WhatsApp to purchaser:", err);
    }

    // 4. Send WhatsApp greeting to the recipient
    const customMessage = gift.message ? `\nThey also left you a special message:\n_"${gift.message}"_\n` : "";
    
    const recipientMsg = `🎉 *A Special Gift For You!* 🎀

Dear ${gift.recipient_name},

You have received a luxury salon gift from *${gift.purchaser_name}*! 💝
${customMessage}
🎁 *Your Experience:* ${gift.service_name}${bookingDateStr}
🎟️ *Coupon Code:* ${gift.coupon_code}

*Your appointment has already been scheduled for this time!* Just show this coupon code at the reception when you arrive.

We can't wait to pamper you! ✨
📍 Rospa Salon`;

    try {
      await sendWhatsAppMessage(String(gift.recipient_phone), recipientMsg, gift.branch);
      console.log("[Gift Confirm] WhatsApp sent to recipient");
    } catch (err) {
      console.error("[Gift Confirm] Error sending WhatsApp to recipient:", err);
    }

    return NextResponse.json({
      success: true,
      gift,
    });
  } catch (error: any) {
    console.error("[Confirm Gift API] Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm gift payment" },
      { status: 500 }
    );
  }
}
