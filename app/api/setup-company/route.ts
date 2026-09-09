import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { companyName, ownerName, email, password } = await req.json();

    if (!companyName || !email || !password) {
      return NextResponse.json({ error: 'Company Name, Email, and Password are required.' }, { status: 400 });
    }

    // 1. Create Company (active and approved)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName.trim(),
        is_active: true
      })
      .select()
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: companyError?.message || "Failed to create company" }, { status: 400 });
    }

    // 2. Create Default Branch
    const branchSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { error: branchError } = await supabase
      .from('branches')
      .insert({
        company_id: company.id,
        name: `${companyName} Main`,
        slug: branchSlug || 'main-branch',
        address: 'Main Branch Location'
      });

    if (branchError) {
      console.warn("Branch insert notice:", branchError.message);
    }

    // 3. Create Owner Account in Supabase Auth (Approved)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: ownerName || 'Salon Owner',
        role: 'owner',
        company_id: company.id,
        branch: branchSlug || 'main-branch',
        approval_status: 'approved'
      }
    });

    if (authError || !authUser.user) {
      // Rollback company creation if user creation fails
      await supabase.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: authError?.message || "Failed to create user account" }, { status: 400 });
    }

    // 4. Create Profile Record
    await supabase.from('profiles').upsert({
      id: authUser.user.id,
      role: 'owner'
    });

    const loginUrl = `/portal/login?email=${encodeURIComponent(email)}`;

    return NextResponse.json({
      success: true,
      message: 'Workspace set up successfully! You may now sign in.',
      company,
      loginUrl
    });
  } catch (err: any) {
    console.error("Error setting up workspace:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
