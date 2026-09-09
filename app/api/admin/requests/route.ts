import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { createClient } from '@/utils/supabase/server';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch pending registration requests for Super Admin
export async function GET(req: Request) {
  try {
    const authSupabase = createClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch companies that are not yet active (is_active === false)
    const { data: pendingCompanies, error: compError } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .eq('is_active', false)
      .order('created_at', { ascending: false });

    if (compError) throw compError;

    // 2. Fetch users list to map company owners
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const requests = (pendingCompanies || []).map((comp: any) => {
      const owner = usersData.users.find(
        (u: any) => String(u.user_metadata?.company_id) === String(comp.id) && u.user_metadata?.role === 'owner'
      );

      return {
        company_id: comp.id,
        company_name: comp.name,
        created_at: comp.created_at,
        owner_email: owner?.email || 'N/A',
        owner_name: owner?.user_metadata?.full_name || 'N/A',
        approval_status: owner?.user_metadata?.approval_status || 'pending'
      };
    });

    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    console.error("Error fetching admin requests:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Approve or Reject a company registration request
export async function POST(req: Request) {
  try {
    const authSupabase = createClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, action } = await req.json();

    if (!companyId || !['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid arguments' }, { status: 400 });
    }

    // Fetch company name for email template
    const { data: companyRecord } = await supabase.from('companies').select('name').eq('id', companyId).single();
    const companyName = companyRecord?.name || 'Your Salon';

    if (action === 'approve') {
      // 1. Activate the company
      const { error: compError } = await supabase
        .from('companies')
        .update({ is_active: true })
        .eq('id', companyId);

      if (compError) throw compError;

      // 2. Find and update the owner user metadata
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const owner = usersData.users.find(
        (u: any) => String(u.user_metadata?.company_id) === String(companyId) && u.user_metadata?.role === 'owner'
      );

      if (owner) {
        await supabase.auth.admin.updateUserById(owner.id, {
          user_metadata: {
            ...owner.user_metadata,
            approval_status: 'approved'
          }
        });
      }

      const hostUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const relativePath = `/portal/login?email=${encodeURIComponent(owner?.email || '')}`;
      const fullSigninLink = `${hostUrl}${relativePath}`;

      // Dispatch automated approval email
      if (owner?.email) {
        sendApprovalEmail({
          toEmail: owner.email,
          ownerName: owner.user_metadata?.full_name || 'Salon Owner',
          companyName,
          loginUrl: fullSigninLink
        }).catch(e => console.error("Email send async error:", e));
      }

      return NextResponse.json({
        success: true,
        message: 'Company approved successfully!',
        signinLink: relativePath
      });
    }

    if (action === 'reject') {
      // Find owner user and update metadata to rejected
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const owner = usersData.users.find(
        (u: any) => String(u.user_metadata?.company_id) === String(companyId) && u.user_metadata?.role === 'owner'
      );

      if (owner) {
        await supabase.auth.admin.updateUserById(owner.id, {
          user_metadata: {
            ...owner.user_metadata,
            approval_status: 'rejected'
          }
        });

        if (owner.email) {
          sendRejectionEmail({
            toEmail: owner.email,
            ownerName: owner.user_metadata?.full_name || 'Applicant',
            companyName
          }).catch(e => console.error("Email send async error:", e));
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Company registration request rejected.'
      });
    }

    if (action === 'delete') {
      // 1. Delete associated owner user if exists
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      if (!usersError && usersData?.users) {
        const owner = usersData.users.find(
          (u: any) => String(u.user_metadata?.company_id) === String(companyId)
        );

        if (owner) {
          await supabase.from('profiles').delete().eq('id', owner.id);
          await supabase.auth.admin.deleteUser(owner.id);
        }
      }

      // 2. Delete company from DB
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        success: true,
        message: 'Company request permanently deleted.'
      });
    }

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
