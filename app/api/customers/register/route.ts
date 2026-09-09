import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * POST /api/customers/register
 * Registers a new customer account after booking.
 * If the email already exists, returns { exists: true } so the frontend can skip.
 */
export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check if user already exists in Supabase Auth
    const { data: existingUsers, error: listError } =
      await supabase.auth.admin.listUsers({ perPage: 1, page: 1 });

    // A more reliable check: try to look up by email in auth
    const { data: userLookup } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    // Also check via auth admin getUserByEmail-equivalent
    // We'll use the admin API to search users by email
    const { data: authLookup, error: lookupError } = await supabase.auth.admin.listUsers({
      perPage: 50,
      page: 1,
    });

    const emailLower = email.trim().toLowerCase();
    const existingUser = authLookup?.users?.find(
      (u: any) => u.email?.toLowerCase() === emailLower
    );

    if (existingUser) {
      return NextResponse.json({
        success: true,
        exists: true,
        message: "Account already exists with this email.",
      });
    }

    // Create user in Supabase Auth as a customer
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: emailLower,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name.trim(),
          phone: phone?.trim() || "",
          role: "customer",
        },
      });

    if (authError || !authUser?.user) {
      // Handle "already registered" errors from Supabase
      const errMsg = authError?.message || "Failed to create account";
      if (
        errMsg.includes("already been registered") ||
        errMsg.includes("already exists") ||
        errMsg.includes("duplicate")
      ) {
        return NextResponse.json({
          success: true,
          exists: true,
          message: "Account already exists with this email.",
        });
      }
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: 400 }
      );
    }

    // Update or create profile for role management
    await supabase.from("profiles").upsert({
      id: authUser.user.id,
      role: "customer",
    });

    return NextResponse.json({
      success: true,
      exists: false,
      userId: authUser.user.id,
      message: "Account created successfully!",
    });
  } catch (error: any) {
    console.error("[Customer Register API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/customers/register?email=xxx
 * Quick check if a customer email already exists.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ exists: false });
    }

    const emailLower = email.trim().toLowerCase();

    // Check via admin API
    const { data: authLookup } = await supabase.auth.admin.listUsers({
      perPage: 50,
      page: 1,
    });

    const existingUser = authLookup?.users?.find(
      (u: any) => u.email?.toLowerCase() === emailLower
    );

    return NextResponse.json({ exists: !!existingUser });
  } catch (error: any) {
    console.error("[Customer Check API] Error:", error);
    return NextResponse.json({ exists: false });
  }
}
