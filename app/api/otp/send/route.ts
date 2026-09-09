import { NextResponse } from "next/server";
import { generateOTP, createSignedOTPToken } from "@/lib/otp";
import { sendOTPMessage, formatPhoneNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, channel = "whatsapp", branch = "rospa" } = body;

    if (!phone || typeof phone !== "string" || phone.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid phone number" },
        { status: 400 }
      );
    }

    const cleanPhone = formatPhoneNumber(phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const selectedChannel = channel === "sms" ? "sms" : "whatsapp";
    const otpCode = generateOTP();
    const token = createSignedOTPToken(cleanPhone, otpCode, 10);

    // Send OTP via chosen channel
    const sendResult = await sendOTPMessage(cleanPhone, otpCode, selectedChannel, branch);

    if (!sendResult.success) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          token,
          channel: selectedChannel,
          message: `Verification code generated for testing:`,
          warning: `DEV OTP: ${otpCode}`,
        });
      }

      return NextResponse.json(
        { success: false, error: sendResult.error || "Failed to send OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      token,
      channel: selectedChannel,
      message: `Verification code sent via ${selectedChannel === "sms" ? "SMS" : "WhatsApp"}!`,
      // For local test convenience when Twilio is not live:
      warning: sendResult.warning || (process.env.NODE_ENV === "development" ? `DEV OTP: ${otpCode}` : undefined),
    });
  } catch (error: any) {
    console.error("[OTP Send Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
