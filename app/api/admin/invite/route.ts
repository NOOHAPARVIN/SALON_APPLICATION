import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendInviteLinkEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authSupabase = createClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 401 });
    }

    const { recipientEmail } = await req.json();

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email address is required.' }, { status: 400 });
    }

    const hostUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteToken = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const setupUrl = `${hostUrl}/setup-company?email=${encodeURIComponent(recipientEmail)}&token=${inviteToken}`;

    // Send email asynchronously
    sendInviteLinkEmail({
      toEmail: recipientEmail,
      setupUrl
    }).catch(err => console.error("Async invite email error:", err));

    return NextResponse.json({
      success: true,
      message: `Invitation link generated and dispatched to ${recipientEmail}!`,
      inviteLink: setupUrl
    });
  } catch (err: any) {
    console.error("Error generating invitation link:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
