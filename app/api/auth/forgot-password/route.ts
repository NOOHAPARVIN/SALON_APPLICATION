import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { forgotPasswordSchema, formatZodError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { email, phone } = body;

    // Validate that the service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Forgot Password] SUPABASE_SERVICE_ROLE_KEY is not configured. Admin API calls will fail.");
      return NextResponse.json(
        { error: "Password reset service is not configured. Please contact salon support." },
        { status: 503 }
      );
    }

    // 1. Fetch users to search for a match
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("[Forgot Password] Supabase Admin listUsers error:", listError);
      throw listError;
    }

    let targetUser: any = null;

    if (email) {
      targetUser = users.find(
        (u: any) => u.email?.toLowerCase() === email.trim().toLowerCase()
      );
    } else if (phone) {
      const normalizedQueryPhone = phone.replace(/\D/g, "");
      targetUser = users.find((u: any) => {
        const userPhone = u.user_metadata?.phone || "";
        return userPhone.replace(/\D/g, "") === normalizedQueryPhone;
      });
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "No registered user found matching the details provided." },
        { status: 404 }
      );
    }

    const userEmail = targetUser.email;
    const userPhone = targetUser.user_metadata?.phone || phone;

    if (!userPhone) {
      return NextResponse.json(
        { error: "This user does not have a phone number configured. Please contact the salon to reset your password." },
        { status: 400 }
      );
    }

    // 2. Generate the recovery link via Supabase Admin API
    const { origin } = new URL(req.url);
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: userEmail,
      options: {
        redirectTo: `${origin}/resetpassword`,
      },
    });

    if (linkError) {
      console.error("[Forgot Password] generateLink error:", linkError);
      throw linkError;
    }

    // The action_link from Supabase points to Supabase's auth server:
    //   https://<project>.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=...
    // This works fine in a browser, but WhatsApp's in-app browser can have issues
    // with the multi-hop redirect chain. We extract the token and build a direct
    // app-side link that verifies the token on the client side.
    const actionLink = linkData.properties.action_link;
    console.log("[Forgot Password] Generated action_link:", actionLink);

    // Extract token_hash and type from the action link
    let resetLink = actionLink; // fallback to the raw link
    try {
      const actionUrl = new URL(actionLink);
      const tokenHash = actionUrl.searchParams.get("token") || actionUrl.searchParams.get("token_hash");
      const type = actionUrl.searchParams.get("type") || "recovery";

      if (tokenHash) {
        // Build a direct link to the app's reset password page with the token
        // The client-side page will use supabase.auth.verifyOtp() to verify
        resetLink = `${origin}/resetpassword?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
        console.log("[Forgot Password] Built app-side reset link:", resetLink);
      } else {
        console.warn("[Forgot Password] Could not extract token from action_link, using raw link");
      }
    } catch (parseError) {
      console.warn("[Forgot Password] Failed to parse action_link URL, using raw link:", parseError);
    }

    // 3. Send WhatsApp message
    const message = `🔑 *Rospa Salon - Password Reset*

Dear customer,

We received a request to reset your password. You can reset it by clicking the link below:

🔗 ${resetLink}

This link will expire shortly. If you did not request this, please ignore this message.

📍 Rospa Salon`;

    console.log(`[Forgot Password] Sending WhatsApp to: ${userPhone}`);
    const sendResult = await sendWhatsAppMessage(userPhone, message);
    console.log("[Forgot Password] WhatsApp send result:", sendResult);

    if (!sendResult.success && !sendResult.warning) {
      // Actual Twilio failure (not just missing creds)
      return NextResponse.json({
        success: false,
        error: `Failed to send WhatsApp message: ${sendResult.error}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link has been sent to your WhatsApp number.",
      whatsappSent: sendResult.success,
      warning: sendResult.warning,
    });
  } catch (error: any) {
    console.error("[Forgot Password API] Error:", error.message || error);
    return NextResponse.json(
      { error: error.message || "An error occurred while generating reset link." },
      { status: 500 }
    );
  }
}
