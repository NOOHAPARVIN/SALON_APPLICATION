import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { createClient } from '@/utils/supabase/server';
import { getCompanyIdFromRequest } from '@/lib/companyAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const authSupabase = createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const metaRole = (user.user_metadata?.role || "").toLowerCase();
    const profileRole = (profile?.role || "").toLowerCase();
    const userRole = metaRole === 'super_admin' ? 'super_admin' : (profileRole || metaRole || 'customer');

    if (userRole !== 'owner' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine the isolated company boundary
    let targetCompanyId: string | null = null;
    if (userRole !== 'super_admin') {
      const { companyId, error: compError } = await getCompanyIdFromRequest(req);
      if (compError || !companyId) {
        return NextResponse.json({ users: [] }); // Fail closed
      }
      targetCompanyId = companyId;
    }

    // Get all users from auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Get all profiles to map roles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, created_at');
    if (profileError) throw profileError;

    const profileMap = new Map();
    profiles.forEach((p: any) => profileMap.set(p.id, p));

    // Get all companies to map names for display
    const { data: companies, error: companiesError } = await supabase.from('companies').select('id, name');
    const companyMap = new Map();
    if (!companiesError && companies) {
      companies.forEach((c: any) => companyMap.set(c.id, c.name));
    }

    // Combine and Filter
    let users = authData.users.map((u: any) => {
      const p = profileMap.get(u.id);
      
      const uMetaRole = (u.user_metadata?.role || "").toLowerCase();
      const uProfRole = (p?.role || "").toLowerCase();
      const effectiveRole = uMetaRole === 'super_admin' ? 'super_admin' : (uMetaRole || uProfRole || 'user');

      // Determine what company this user belongs to
      let uCompanyId = u.user_metadata?.company_id || null;
      let branchName = u.user_metadata?.branch || null;
      
      // If no explicit company_id in metadata, try to guess from branch name
      if (!uCompanyId && branchName && companies) {
         const matched = companies.find((c:any) => c.name.toLowerCase().includes(branchName.toLowerCase()));
         if (matched) uCompanyId = matched.id;
      }
      
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        role: effectiveRole,
        branch: branchName,
        company_id: uCompanyId,
        company_name: uCompanyId ? companyMap.get(uCompanyId) : null
      };
    }).filter(u => u.role === 'receptionist' || u.role === 'owner' || u.role === 'super_admin');

    // ENFORCE ISOLATION
    if (targetCompanyId) {
      users = users.filter(u => String(u.company_id) === String(targetCompanyId) || u.id === user.id);
    }

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authSupabase = createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'customer';
    if (role !== 'owner' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent deleting oneself
    if (userId === user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account from here.' }, { status: 400 });
    }

    // 1. Delete from Profiles table
    await supabase.from('profiles').delete().eq('id', userId);

    // 2. Delete from Auth Users
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authSupabase = createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'customer';
    if (role !== 'owner' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, email: newEmail, password, role: newRole, branch } = await req.json();

    if (!id || !newRole) {
      return NextResponse.json({ error: 'User ID and Role are required' }, { status: 400 });
    }

    // 1. Update Profile table role
    await supabase.from('profiles').upsert({
      id: id,
      role: newRole
    });

    // 2. Update Auth metadata, optional email, and optional password
    const updatePayload: any = {
      user_metadata: {
        role: newRole,
        branch: branch || undefined
      }
    };
    if (password) {
      updatePayload.password = password;
    }
    if (newEmail) {
      updatePayload.email = newEmail;
      updatePayload.email_confirm = true;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(id, updatePayload);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
