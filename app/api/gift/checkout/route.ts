import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import Stripe from "stripe";
import { z } from "zod";
import { formatZodError } from "@/lib/validations";
import { resolveAndVerifyStaff, addMinutes } from "@/lib/bookingValidation";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";

const giftCardSchema = z.object({
  service_id: z.string().or(z.number()),
  service_name: z.string().min(1, "Service name is required"),
  price: z.number().min(1, "Price must be greater than 0"),
  purchaser_name: z.string().min(1, "Purchaser name is required"),
  purchaser_phone: z.string().min(6, "Valid purchaser phone is required"),
  recipient_name: z.string().min(1, "Recipient name is required"),
  recipient_phone: z.string().min(6, "Valid recipient phone is required"),
  message: z.string().optional(),
  branch: z.string().optional().default("rospa"),
  date: z.string().min(1, "Appointment date is required"),
  time: z.string().min(1, "Appointment time is required"),
  staff_id: z.string().optional(),
  staff_name: z.string().optional(),
});

function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'GIFT-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = giftCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const couponCode = generateCouponCode();

    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) {
      return NextResponse.json({ success: false, error: compError }, { status: 400 });
    }

    // 1. Fetch service details to get category and duration
    let category = "Service";
    let duration = 30;
    const { data: serviceData } = await supabase
      .from("services")
      .select("category, duration_minutes")
      .eq("id", Number(data.service_id))
      .single();
    
    if (serviceData) {
      category = serviceData.category;
      duration = serviceData.duration_minutes || 30;
    }

    const sStart = data.time.length === 5 ? `${data.time}:00` : data.time;
    const sEnd = addMinutes(sStart, duration);

    // 2. Resolve staff and check availability
    let resolvedStaff;
    try {
      resolvedStaff = await resolveAndVerifyStaff(data.service_name, data.staff_name || "", data.date, sStart, sEnd);
    } catch (err: any) {
      if (err.message === "Staff is not available for this time") {
        return NextResponse.json({ success: false, error: "Staff is not available for this time" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    // 3. Insert into bookings table as pending
    const groupId = crypto.randomUUID();
    const phoneVal = data.recipient_phone ? parseInt(data.recipient_phone.replace(/\D/g, ""), 10) : null;
    
    const { data: insertedBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert([{
        group_id: groupId,
        name: data.recipient_name,
        customer_name: data.recipient_name,
        phone: phoneVal,
        appointment_date: data.date,
        start_time: sStart,
        end_time: sEnd,
        duration_minutes: duration,
        staff_id: resolvedStaff.id,
        service_id: Number(data.service_id),
        category: category,
        service_name: data.service_name,
        price: data.price,
        payment_method: "online",
        payment_status: "pending",
        created_by: "website",
        total: data.price,
        notes: `GIFT from ${data.purchaser_name}. Msg: ${data.message || 'None'}`,
        status: "pending",
        booking_source: "website",
        branch: data.branch,
        company_id: companyId || '00000000-0000-0000-0000-000000000000',
      }])
      .select()
      .single();

    if (bookingError) {
      console.error("DB Error inserting booking:", bookingError);
      throw new Error("Failed to save appointment in database.");
    }

    // 4. Insert into gift_cards table
    const { data: insertedCard, error } = await supabase
      .from("gift_cards")
      .insert([
        {
          coupon_code: couponCode,
          service_name: data.service_name,
          price: data.price,
          purchaser_name: data.purchaser_name,
          purchaser_phone: data.purchaser_phone,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          message: data.message || "",
          status: "pending",
          branch: data.branch,
          company_id: companyId || '00000000-0000-0000-0000-000000000000',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("DB Error inserting gift card:", error);
      throw new Error("Failed to save gift card in database.");
    }

    // 5. Stripe checkout integration
    let checkoutUrl = "";
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
                name: `Gift Card: ${data.service_name}`,
                description: `A gift for ${data.recipient_name} from ${data.purchaser_name}`,
              },
              unit_amount: Math.round(data.price * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/gift/success?gift_id=${insertedCard.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/gift?cancelled=true`,
        metadata: {
          gift_card_id: String(insertedCard.id),
          booking_id: String(insertedBooking.id),
          type: "gift_card"
        },
      });
      checkoutUrl = session.url || "";
    } else {
      const { origin } = new URL(req.url);
      checkoutUrl = `${origin}/booking/payment?booking_id=${insertedBooking.id}&gift_id=${insertedCard.id}&total=${data.price}`;
    }

    return NextResponse.json({
      success: true,
      giftCard: insertedCard,
      booking: insertedBooking,
      checkoutUrl,
    });
  } catch (error: any) {
    console.error("Error in /api/gift/checkout:", error);
    return NextResponse.json(
      { success: false, error: error.message || error },
      { status: 500 }
    );
  }
}
