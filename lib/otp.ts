import crypto from "crypto";
import { formatPhoneNumber } from "./whatsapp";

const OTP_SECRET = process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "salon-otp-secret-key-2026";

export function generateOTP(): string {
  // Generate a cryptographically secure 6-digit numeric OTP
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

export function createSignedOTPToken(phone: string, code: string, expiresInMinutes: number = 10): string {
  const normalizedPhone = formatPhoneNumber(phone);
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  
  const payload = JSON.stringify({
    phone: normalizedPhone,
    code,
    expiresAt,
  });

  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export function verifySignedOTPToken(
  phone: string,
  userCode: string,
  token: string
): { success: boolean; error?: string } {
  try {
    if (!token || !userCode || !phone) {
      return { success: false, error: "Missing verification parameters" };
    }

    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) {
      return { success: false, error: "Malformed verification token" };
    }

    const expectedSignature = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(payloadB64)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return { success: false, error: "Invalid token signature" };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    const normalizedPhone = formatPhoneNumber(phone);

    if (payload.phone !== normalizedPhone) {
      return { success: false, error: "Phone number mismatch" };
    }

    if (Date.now() > payload.expiresAt) {
      return { success: false, error: "OTP has expired. Please request a new code." };
    }

    if (String(payload.code).trim() !== String(userCode).trim()) {
      return { success: false, error: "Incorrect OTP code. Please try again." };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to verify OTP" };
  }
}

export function createVerifiedProofToken(phone: string): string {
  const normalizedPhone = formatPhoneNumber(phone);
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity for booking submission

  const payload = JSON.stringify({
    phone: normalizedPhone,
    verified: true,
    expiresAt,
  });

  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}
