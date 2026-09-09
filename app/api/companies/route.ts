import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { createClient } = await import('@/utils/supabase/server');
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    let userRole = 'customer';
    let userCompanyId = null;

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      userRole = user.user_metadata?.role === 'super_admin' ? 'super_admin' : (profile?.role || 'customer');
      userCompanyId = user.user_metadata?.company_id;
    }

    let query = supabase
      .from("companies")
      .select(`
        *,
        company_api_keys (
          api_key,
          is_active
        ),
        branches (
          id,
          name,
          slug,
          is_active
        )
      `)
      .order("created_at", { ascending: true });

    // Enforce SaaS tenant isolation (Fail Closed)
    if (userRole !== 'super_admin') {
      if (userCompanyId) {
        query = query.eq('id', userCompanyId);
      } else {
        // Return nothing if they are not super admin and have no company
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    const { data: companies, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, companies: companies || [] });
  } catch (err: any) {
    console.error("Error fetching companies:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ownerName, ownerEmail, password } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Company name is required" }, { status: 400 });
    }

    // 1. Create the new company (active by default when created by Super Admin)
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert([{ name, is_active: true }])
      .select()
      .single();

    if (companyError || !company) throw companyError;

    // 1.5 Create default branch
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    await supabase.from("branches").insert([{
      company_id: company.id,
      name: `${name} Main Branch`,
      slug: slug || 'main-branch',
      is_active: true
    }]);

    // 2. Generate API Key
    const { data: apiKeyData } = await supabase
      .from("company_api_keys")
      .insert([{ company_id: company.id, name: `${name} API Key` }])
      .select()
      .single();

    let signinLink = `/portal/login`;

    // 3. Create owner account if ownerEmail provided
    if (ownerEmail) {
      const ownerPassword = password || "Salon12345!";
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: ownerEmail,
        password: ownerPassword,
        email_confirm: true,
        user_metadata: {
          full_name: ownerName || name,
          role: 'owner',
          company_id: company.id,
          branch: slug,
          approval_status: 'approved'
        }
      });

      if (!userError && userData?.user) {
        await supabase.from('profiles').upsert({
          id: userData.user.id,
          role: 'owner'
        });
        signinLink = `/portal/login?email=${encodeURIComponent(ownerEmail)}`;
      }
    }

    return NextResponse.json({ 
      success: true, 
      company: {
        ...company,
        company_api_keys: apiKeyData ? [apiKeyData] : []
      },
      signinLink
    });

  } catch (err: any) {
    console.error("Error creating company:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
