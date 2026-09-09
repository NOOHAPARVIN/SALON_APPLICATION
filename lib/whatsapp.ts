import axios from "axios";

/**
 * Normalizes a phone number to standard E.164 format.
 * If the number does not have a country code:
 * - If it's an 8-digit number, prepends Qatar country code (+974).
 * - Otherwise, tries to prepend '+'.
 */
export function formatPhoneNumber(phone: string): string {
  // Preserve original to check for prefix indicators
  const original = phone.trim();
  const clean = original.replace(/\s+/g, "").replace(/\D/g, "");

  if (!clean) {
    console.warn("[formatPhoneNumber] Empty phone number after cleaning:", phone);
    return "";
  }
  
  if (original.startsWith("+")) {
    return "+" + clean;
  }
  
  if (original.startsWith("00")) {
    return "+" + clean.slice(2);
  }

  // Handle Qatar number format specifically
  if (clean.length === 8 && /^[3567]/.test(clean)) {
    return "+974" + clean;
  }

  // If already starts with Qatar country code
  if (clean.startsWith("974") && clean.length === 11) {
    return "+" + clean;
  }

  // General fallback - assume it needs a +
  return "+" + clean;
}

export interface WhatsAppResult {
  success: boolean;
  sid?: string;
  error?: string;
  warning?: string;
  loggedMessage?: string;
}

/**
 * Sends a WhatsApp message using Twilio's WhatsApp API.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER
 * to be set in environment variables for actual delivery.
 */
export async function sendWhatsAppMessage(to: string, message: string, branch?: string, twilioSenderNumber?: string): Promise<WhatsAppResult> {
  const cleanNumber = formatPhoneNumber(to);

  if (!cleanNumber) {
    console.error("[WhatsApp API] Invalid phone number provided:", to);
    return {
      success: false,
      error: "Invalid phone number: " + to,
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  const isValidNumber = (val?: string) => !!val && !val.includes("...") && !val.includes("Replace") && !val.includes("your-");

  let rawFrom = (isValidNumber(twilioSenderNumber) ? twilioSenderNumber : undefined) || 
                (isValidNumber(process.env.TWILIO_WHATSAPP_NUMBER) ? process.env.TWILIO_WHATSAPP_NUMBER : undefined) || 
                "whatsapp:+14155238886";
  
  if (!twilioSenderNumber) {
    if (branch?.toLowerCase() === "elan" && isValidNumber(process.env.TWILIO_WHATSAPP_NUMBER_ELAN)) {
      rawFrom = process.env.TWILIO_WHATSAPP_NUMBER_ELAN!;
    } else if (branch?.toLowerCase() === "rospa" && isValidNumber(process.env.TWILIO_WHATSAPP_NUMBER_ROSPA)) {
      rawFrom = process.env.TWILIO_WHATSAPP_NUMBER_ROSPA!;
    }
  }

  // Ensure 'From' always has the whatsapp: prefix
  const from = rawFrom.startsWith("whatsapp:") ? rawFrom : `whatsapp:${rawFrom}`;
  // Ensure 'To' always has the whatsapp: prefix
  const toFormatted = `whatsapp:${cleanNumber}`;

  console.log(`\n================== [WHATSAPP SEND] ==================`);
  console.log(`Branch: ${branch || "default"}`);
  console.log(`To: ${toFormatted}`);
  console.log(`From: ${from}`);
  console.log(`Account SID: ${accountSid ? accountSid.substring(0, 8) + "..." : "NOT SET"}`);
  console.log(`Auth Token: ${authToken ? "****configured****" : "NOT SET"}`);
  console.log(`Message:\n${message}`);
  console.log(`=====================================================\n`);

  if (!accountSid || !authToken) {
    console.warn("[WhatsApp API] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured. Message NOT sent.");
    return {
      success: false,
      error: "Twilio credentials not configured. WhatsApp message was not sent.",
      loggedMessage: message,
    };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append("To", toFormatted);
    params.append("From", from);
    params.append("Body", message);

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const res = await axios.post(url, params, {
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("[WhatsApp API] Message sent successfully via Twilio. SID:", res.data.sid, "Status:", res.data.status);
    return { success: true, sid: res.data.sid };
  } catch (error: any) {
    const twilioError = error.response?.data;
    const errCode = twilioError?.code;
    const errMsg = twilioError?.message || error.message;

    console.error("[WhatsApp API] Twilio sending failed:");
    console.error("  Status:", error.response?.status);
    console.error("  Error Code:", errCode);
    console.error("  Message:", errMsg);
    console.error("  Full response:", JSON.stringify(twilioError, null, 2));

    // Provide user-friendly error messages for common Twilio errors
    let friendlyError = errMsg;
    if (errCode === 21608) {
      friendlyError = "The recipient has not opted in to receive WhatsApp messages. They need to send the join code to the Twilio Sandbox number first.";
    } else if (errCode === 21211) {
      friendlyError = "Invalid phone number format. Please check the phone number.";
    } else if (errCode === 20003) {
      friendlyError = "Twilio authentication failed. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.";
    } else if (errCode === 63007) {
      friendlyError = "WhatsApp message delivery failed. The number may not be registered on WhatsApp.";
    }

    return {
      success: false,
      error: friendlyError,
    };
  }
}

/**
 * Sends a regular SMS message using Twilio's SMS API.
 */
export async function sendSMSMessage(to: string, message: string, fromNumber?: string): Promise<WhatsAppResult> {
  const cleanNumber = formatPhoneNumber(to);

  if (!cleanNumber) {
    console.error("[SMS API] Invalid phone number provided:", to);
    return {
      success: false,
      error: "Invalid phone number: " + to,
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  // Extract number without 'whatsapp:' prefix for SMS
  const isValidNumber = (val?: string) => !!val && !val.includes("...") && !val.includes("Replace") && !val.includes("your-");
  const rawFrom = (isValidNumber(fromNumber) ? fromNumber : undefined) || 
                (isValidNumber(process.env.TWILIO_PHONE_NUMBER) ? process.env.TWILIO_PHONE_NUMBER : undefined) || 
                (isValidNumber(process.env.TWILIO_WHATSAPP_NUMBER) ? process.env.TWILIO_WHATSAPP_NUMBER : undefined) || 
                "+14155238886";
  const from = rawFrom.replace(/^whatsapp:/i, "");
  const toFormatted = cleanNumber.replace(/^whatsapp:/i, "");

  console.log(`\n================== [SMS SEND] ==================`);
  console.log(`To: ${toFormatted}`);
  console.log(`From: ${from}`);
  console.log(`Message:\n${message}`);
  console.log(`================================================\n`);

  if (!accountSid || !authToken) {
    console.warn("[SMS API] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured. SMS NOT sent.");
    return {
      success: false,
      error: "Twilio credentials not configured. SMS was not sent.",
      loggedMessage: message,
    };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append("To", toFormatted);
    params.append("From", from);
    params.append("Body", message);

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const res = await axios.post(url, params, {
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("[SMS API] SMS sent successfully via Twilio. SID:", res.data.sid, "Status:", res.data.status);
    return { success: true, sid: res.data.sid };
  } catch (error: any) {
    const twilioError = error.response?.data;
    const errMsg = twilioError?.message || error.message;

    console.error("[SMS API] Twilio sending failed:", errMsg);
    let friendlyError = errMsg;
    if (twilioError?.code === 21606 || (errMsg && errMsg.includes("Mismatch between the 'From' number"))) {
      friendlyError = "Twilio SMS number is not configured on this account. Please select WhatsApp to receive your OTP.";
    }

    return {
      success: false,
      error: friendlyError,
    };
  }
}

/**
 * Helper to dispatch an OTP code via either WhatsApp or SMS.
 */
export async function sendOTPMessage(
  to: string,
  code: string,
  channel: "whatsapp" | "sms" = "whatsapp",
  branch?: string
): Promise<WhatsAppResult> {
  const brandName = branch?.toLowerCase() === "elan" ? "Elan Beauty" : "Rospa Salon";
  const message = `🔒 *${brandName} Verification Code*\n\nYour OTP is: *${code}*\n\nPlease enter this code to verify your phone number and confirm your booking. Valid for 10 minutes.`;

  if (channel === "sms") {
    const smsMessage = `${brandName}: Your verification code is ${code}. Valid for 10 minutes.`;
    return sendSMSMessage(to, smsMessage);
  } else {
    return sendWhatsAppMessage(to, message, branch);
  }
}

