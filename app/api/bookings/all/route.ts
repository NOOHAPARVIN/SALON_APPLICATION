import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCompanyIdFromRequest } from '@/lib/companyAuth';

export async function GET(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin.from('bookings').select('*');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: bookingsData, error } = await query;

    if (error) throw error;
    
    return NextResponse.json({ bookings: bookingsData || [] });
  } catch (err) {
    console.error("Error in /api/bookings/all:", err);
    return NextResponse.json({ bookings: [] }, { status: 500 });
  }
}
