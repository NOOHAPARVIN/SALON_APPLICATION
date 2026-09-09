import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Stripe Webhook handler.
 *
 * Listens for `checkout.session.completed` events and updates the
 * corresponding booking(s) in Supabase to `payment_status: "paid"`
 * and `status: "confirmed"`. Also sends a WhatsApp confirmation.
 *
 * Setup:
 *   1. In the Stripe Dashboard → Developers → Webhooks, create an
 *      endpoint pointing to https://<your-domain>/api/webhooks/stripe
 *   2. Select the `checkout.session.completed` event.
 *   3. Copy the Signing Secret and add it to .env.local as STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  // If Stripe is not configured, return early with a helpful message
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe Webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not configured. Webhook ignored.");
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as any,
  });

  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  // Only handle checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    // Acknowledge other event types without processing
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Ignore sessions that weren't paid
  if (session.payment_status !== "paid") {
    console.log(`[Stripe Webhook] Session ${session.id} is not paid (status: ${session.payment_status}). Skipping.`);
    return NextResponse.json({ received: true });
  }

  // --- SaaS SUBSCRIPTION PAYMENT LOGIC ---
  if (session.mode === "subscription" && session.client_reference_id) {
    const companyId = session.client_reference_id;
    console.log(`[Stripe Webhook] Processing SaaS Subscription for company: ${companyId}`);
    
    try {
      // Find the owner of this company
      // Supabase admin allows us to list users or we can just fetch all owners from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'owner');
        
      // Since we don't have company_id reliably in profiles, we might need to fetch users
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && users) {
        const owner = users.find(u => 
          u.user_metadata?.company_id === companyId && 
          (u.user_metadata?.role === 'owner' || profiles?.find(p => p.id === u.id))
        );
        
        if (owner) {
          await supabase.auth.admin.updateUserById(owner.id, {
            user_metadata: {
              ...owner.user_metadata,
              subscription_status: 'active',
              plan_tier: 'premium',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string
            }
          });
          console.log(`[Stripe Webhook] Successfully activated subscription for owner ${owner.id}`);
        }
      }
      return NextResponse.json({ received: true, type: "saas_subscription" });
    } catch (err) {
      console.error("[Stripe Webhook] Failed to update SaaS subscription:", err);
      return NextResponse.json({ error: "Failed to process subscription" }, { status: 500 });
    }
  }
  // --- END SAAS LOGIC ---

  const metadata = session.metadata || {};

  // Resolve booking IDs from metadata
  let bookingIds: number[] = [];
  if (metadata.booking_ids) {
    bookingIds = metadata.booking_ids.split(",").map(Number).filter((n) => !isNaN(n));
  } else if (metadata.booking_id) {
    const id = parseInt(metadata.booking_id, 10);
    if (!isNaN(id)) bookingIds = [id];
  }

  if (bookingIds.length === 0) {
    console.warn("[Stripe Webhook] No booking IDs found in session metadata:", metadata);
    return NextResponse.json({ received: true, warning: "No booking IDs in metadata" });
  }

  console.log(`[Stripe Webhook] Processing payment for booking IDs: ${bookingIds.join(", ")}`);

  try {
    // Update bookings: mark as paid and confirmed
    const { data: bookings, error: dbError } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        status: "confirmed",
      })
      .in("id", bookingIds)
      .select();

    if (dbError) {
      console.error("[Stripe Webhook] DB update error:", dbError);
      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.warn("[Stripe Webhook] No bookings found for IDs:", bookingIds);
      return NextResponse.json({ received: true, warning: "Bookings not found" });
    }

    // Send WhatsApp confirmation (use first booking as reference)
    const booking = bookings[0];
    if (booking.phone) {
      let grandTotal = 0;
      const servicesList: string[] = [];

      for (const b of bookings) {
        grandTotal += Number(b.total) || 0;
        servicesList.push(b.service_name || "Salon Treatment");
      }

      const whatsappMsg = `✅ *Rospa Salon - Payment Confirmed!* 🌟

Dear ${booking.name},

Thank you! We have received your payment, and your booking has been successfully confirmed.

📅 *Date:* ${booking.appointment_date || ""}
⏰ *Time:* ${(booking.start_time || "").substring(0, 5)}
💰 *Amount Paid:* QR ${grandTotal}
💳 *Payment:* Card (Paid Online)
📌 *Status:* CONFIRMED

*Services Booked:*
${servicesList.map((s) => `• ${s}`).join("\n")}

We look forward to giving you a luxury pampering session!
📍 Rospa Salon`;

      try {
        const result = await sendWhatsAppMessage(String(booking.phone), whatsappMsg);
        console.log("[Stripe Webhook] WhatsApp confirmation:", result.success ? "SENT" : "FAILED", result.error || "");
      } catch (err) {
        // WhatsApp failure should not fail the webhook — payment is already confirmed
        console.error("[Stripe Webhook] WhatsApp error (non-fatal):", err);
      }
    }

    console.log(`[Stripe Webhook] Successfully confirmed ${bookings.length} booking(s).`);
    return NextResponse.json({ received: true, confirmed: bookingIds });

  } catch (err: any) {
    console.error("[Stripe Webhook] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
