import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const now = new Date();
    // Assuming timezone offset +03:00 for the region (Middle East)
    const localNow = new Date(now.getTime() + 3 * 3600 * 1000);
    const todayStr = localNow.toISOString().split("T")[0];
    
    const tomorrow = new Date(localNow.getTime() + 24 * 3600 * 1000);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "confirmed")
      .in("appointment_date", [todayStr, tomorrowStr]);

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: true, message: "No confirmed bookings found for today/tomorrow." });
    }

    // Fetch all companies to map company_id to settings
    const { data: companies } = await supabase.from('companies').select('id, name, settings');
    const companyMap = new Map();
    if (companies) {
      for (const c of companies) {
        companyMap.set(c.id, c);
      }
    }

    const results = [];

    for (const b of bookings) {
      const isSessionService = b.service_name?.toLowerCase().includes("premium hydra facial");
      const notes = b.notes || "";
      
      let shouldSend = false;
      let reminderTag = "";
      let message = "";

      if (b.appointment_date === tomorrowStr && isSessionService) {
        if (!notes.includes("[Session Reminder Sent]")) {
          shouldSend = true;
          reminderTag = "[Session Reminder Sent]";
          const sessionMatch = notes.match(/\[Session (\d+)\]/);
          const sessionText = sessionMatch ? ` (Session ${sessionMatch[1]})` : "";
          message = `Hi ${b.name || "there"}, this is a reminder for your upcoming Premium Hydra Facial${sessionText} appointment tomorrow at ${b.start_time.substring(0, 5)}. We look forward to seeing you!`;
        }
      } else if (b.appointment_date === todayStr) {
        if (!notes.includes("[2HR Reminder Sent]")) {
          // Check if start_time is within 2 hours
          const [h, m] = (b.start_time || "00:00").split(":");
          // Create local date object for the appointment time
          const appointmentTime = new Date(`${todayStr}T${h}:${m}:00+03:00`);
          const diffHours = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          // If appointment is within the next 2.25 hours (allowing 15 min buffer for the 15min cron interval)
          if (diffHours > 0 && diffHours <= 2.25) {
            shouldSend = true;
            reminderTag = "[2HR Reminder Sent]";
            message = `Hi ${b.name || "there"}, just a friendly reminder that you have an appointment for ${b.service_name} today at ${b.start_time.substring(0, 5)}. See you soon!`;
          }
        }
      }

      if (shouldSend && b.phone) {
        try {
          // Send via our centralized WhatsApp engine
          const companyInfo = companyMap.get(b.company_id);
          const twilioSenderNumber = companyInfo?.settings?.twilio_phone_number;
          
          await sendWhatsAppMessage(b.phone, message, b.branch, twilioSenderNumber);
          
          // Update notes to prevent duplicate sending
          const newNotes = `${notes}\n${reminderTag}`.trim();
          await supabase
            .from("bookings")
            .update({ notes: newNotes })
            .eq("id", b.id);
            
          results.push({ id: b.id, type: reminderTag });
        } catch (e: any) {
          console.error(`Failed to send reminder to ${b.phone}:`, e.message);
        }
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (err: any) {
    console.error("Reminder cron error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
