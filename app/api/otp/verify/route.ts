import { NextResponse } from "next/server";
import { verifySignedOTPToken, createVerifiedProofToken } from "@/lib/otp";
import { formatPhoneNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code, token } = body;

    if (!phone || !code || !token) {
      return NextResponse.json(
        { success: false, error: "Please enter the OTP code." },
        { status: 400 }
      );
    }

    const cleanPhone = formatPhoneNumber(phone);
    const verification = verifySignedOTPToken(cleanPhone, code, token);

    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || "Invalid OTP code" },
        { status: 400 }
      );
    }

    const verifiedToken = createVerifiedProofToken(cleanPhone);

    return NextResponse.json({
      success: true,
      verifiedToken,
      message: "Phone number successfully verified!",
    });
  } catch (error: any) {
    console.error("[OTP Verify Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
