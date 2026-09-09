import { NextResponse } from "next/server";
import twilio from "twilio";
import { sendWhatsAppSchema, formatZodError } from "@/lib/validations";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: Request) {
  const body = await req.json();

  // Validate input
  const parsed = sendWhatsAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { phone, message } = body;

  try {
    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
      to: `whatsapp:${phone}`,
      body: message,
    });

    return NextResponse.json({ success: true, sid: msg.sid });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}