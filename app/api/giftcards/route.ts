import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { getCompanyIdFromRequest } from '@/lib/companyAuth';
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    
    let query = supabase.from('gift_cards').select('*').order('created_at', { ascending: false });

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (branch && branch !== 'all') {
      if (branch === 'rospa') {
        query = query.or('branch.eq.rospa,branch.is.null');
      } else {
        query = query.eq('branch', branch);
      }
    }

    let { data: giftcards, error } = await query;

    if (error && error.message && error.message.includes("branch")) {
      console.warn("branch column missing in gift_cards table, falling back to base query");
      let fallbackQuery = supabase.from('gift_cards').select('*').order('created_at', { ascending: false });
      if (companyId) {
        fallbackQuery = fallbackQuery.eq('company_id', companyId);
      }
      const res = await fallbackQuery;
      giftcards = res.data || [];
      error = null;
    }

    if (error) throw error;

    // Fetch associated bookings to get staff_id
    let enrichedGiftcards = giftcards || [];
    if (giftcards && giftcards.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('notes, staff_id')
        .ilike('notes', '%Code: GC-%');
      
      if (bookings) {
        enrichedGiftcards = giftcards.map(gc => {
          const b = bookings.find(b => b.notes && b.notes.includes(`Code: ${gc.coupon_code}`));
          return { ...gc, staff_id: b?.staff_id || null };
        });
      }
    }

    return NextResponse.json({ success: true, giftcards: enrichedGiftcards });
  } catch (error: any) {
    console.error('Error fetching gift cards:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (!companyId) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const urlBranch = searchParams.get("branch");

    const body = await req.json();
    const { amount, purchaser_name, purchaser_phone, recipient_name, recipient_phone, message, services, date, time, branch: bodyBranch } = body;

    if (!amount || !purchaser_name || !purchaser_phone || !recipient_name || !recipient_phone) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const targetBranch = bodyBranch || urlBranch || (String(companyId) === "1" ? "rospa" : "elan");

    // Generate unique code (e.g. GC-ABCD-1234)
    const code = `GC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate a booking if date/time are provided
    let bookingDateStr = "";
    if (date && time && Array.isArray(services) && services.length > 0 && services[0].name) {
      const addMinutes = (timeStr: string, minsToAdd: number) => {
        const [h, m] = timeStr.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        d.setMinutes(d.getMinutes() + minsToAdd);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      };

      const bookingsToInsert = services.map(s => {
        const end_time = addMinutes(time, s.duration_minutes || 30) + ":00";
        return {
          company_id: companyId,
          branch: targetBranch,
          name: recipient_name,
          customer_name: recipient_name,
          phone: recipient_phone,
          appointment_date: date,
          start_time: `${time}:00`,
          end_time: end_time,
          service_name: s.name || "Gift Card Service",
          staff_id: s.staff_id ? Number(s.staff_id) : null,
          total: s.price || 0,
          duration_minutes: s.duration_minutes || 30,
          status: "confirmed",
          payment_status: "unpaid",
          booking_source: "admin",
          notes: `Gift Card Booking from ${purchaser_name}. Code: ${code} ${message || ''}`
        };
      });
      
      const { error: bookingErr } = await supabase.from('bookings').insert(bookingsToInsert);
      if (bookingErr) throw bookingErr;
      
      bookingDateStr = `\n\n📅 *Appointment Details*\nDate: ${date}\nTime: ${time}\nServices: ${services.map(s => s.name).join(", ")}`;
    }

    // Save the services list into the gift_cards table if it has that field, or just save the first service_name
    const mainServiceName = (Array.isArray(services) && services.length > 0 && services[0].name) 
        ? services.map(s => s.name).join(", ") 
        : null;

    const insertPayload: any = {
      company_id: companyId,
      branch: targetBranch,
      coupon_code: code,
      price: amount,
      service_name: mainServiceName,
      purchaser_name,
      purchaser_phone,
      recipient_name,
      recipient_phone,
      message: message || "",
      status: "active",
    };

    let { data: newCard, error: insertError } = await supabase
      .from("gift_cards")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError && insertError.message && insertError.message.includes("branch")) {
      delete insertPayload.branch;
      const retryResult = await supabase
        .from("gift_cards")
        .insert(insertPayload)
        .select()
        .single();
      newCard = retryResult.data;
      insertError = retryResult.error;
    }

    if (insertError) throw insertError;

    // Send WhatsApp notification
    const branchName = String(companyId) === "1" ? "rospa" : "elan";
    const whatsappMsg = `🎁 *A Gift Card Just For You!* 🎁\n\nHi ${recipient_name},\n\n${purchaser_name} has sent you a *QR ${amount}* Gift Card for ${branchName === "rospa" ? "Rospa Salon" : "Elan Men's Salon"}!${bookingDateStr}\n\n*Code:* ${code}\n\n${message ? `*Message:* "${message}"\n\n` : ''}Show this code at the reception. We can't wait to see you!`;

    sendWhatsAppMessage(recipient_phone, whatsappMsg, branchName).catch(err => {
      console.error("Failed to send WhatsApp for newly issued gift card:", err);
    });

    return NextResponse.json({ success: true, giftcard: newCard });
  } catch (error: any) {
    console.error('Error creating gift card:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
