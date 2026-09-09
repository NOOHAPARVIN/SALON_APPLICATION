import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParam = searchParams.get("q") || searchParams.get("query") || searchParams.get("phone");
    const { companyId } = await getCompanyIdFromRequest(req);
    
    if (!queryParam || queryParam.trim().length < 2) {
      return NextResponse.json({ success: true, customers: [] });
    }

    const searchTerm = queryParam.trim();
    
    let query = supabase
      .from("bookings")
      .select("name, phone, created_at")
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })
      .limit(30);
      
    const branch = searchParams.get("branch");
    
    if (companyId) {
      query = query.eq("company_id", companyId);
    }
    
    if (branch && branch !== 'all') {
      query = query.eq('branch', branch);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Deduplicate by phone / name combo
    const seen = new Set<string>();
    const customers: { name: string; phone: string }[] = [];

    if (data) {
      for (const item of data) {
        if (!item.name || !item.phone) continue;
        const key = `${item.name.toLowerCase()}_${item.phone}`;
        if (!seen.has(key)) {
          seen.add(key);
          customers.push({ name: item.name, phone: item.phone });
          if (customers.length >= 10) break;
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      customers,
      customer: customers.length > 0 ? customers[0] : null
    });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
