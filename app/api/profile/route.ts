export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ role: 'customer' });
    }

    // Bypass RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const metaRole = (user.user_metadata?.role || "").toLowerCase();
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const profileRole = (profile?.role || "").toLowerCase();
    const finalRole = metaRole === 'super_admin' ? 'super_admin' : (profileRole || metaRole || 'customer');

    return NextResponse.json({ role: finalRole });
  } catch (err) {
    console.error("Error in /api/profile:", err);
    return NextResponse.json({ role: 'customer' });
  }
}
