import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { salonName, fullName, email, password } = await req.json();

    if (!salonName || !fullName || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // 1. Create the Company Workspace in pending state (is_active: false)
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: salonName,
        is_active: false
      })
      .select()
      .single();

    if (companyError || !company) {
      console.error("Failed to create company:", companyError);
      return NextResponse.json({ success: false, error: companyError?.message || "Failed to create workspace" }, { status: 500 });
    }

    // 1.5 Create a default branch for the company
    const slug = salonName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const { error: branchError } = await supabase
      .from("branches")
      .insert({
        name: salonName + " Main Branch",
        slug: slug,
        company_id: company.id,
        is_active: true
      });
      
    if (branchError) {
      console.error("Failed to create default branch:", branchError);
    }

    // 2. Create the User in Supabase Auth (Pending Approval)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'owner',
        branch: salonName,
        company_id: company.id,
        approval_status: 'pending',
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
        plan_tier: 'free'
      }
    });

    if (authError || !authUser.user) {
      console.error("Auth creation failed:", authError);
      return NextResponse.json({ success: false, error: authError?.message || "Failed to create user" }, { status: 400 });
    }

    // 3. Update the Profile for role management (Upsert because a trigger might have created it as 'customer')
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authUser.user.id,
        role: "owner"
      });

    if (profileError) {
      console.error("Profile creation failed:", profileError);
      // We don't fail the whole request, but it's an issue
    }

    return NextResponse.json({ success: true, companyId: company.id });

  } catch (error: any) {
    console.error("Signup API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
