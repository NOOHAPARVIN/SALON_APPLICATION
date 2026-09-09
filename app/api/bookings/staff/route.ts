import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service") || "";
    const branch = searchParams.get("branch") || "";

    const { companyId, error: compError } = await getCompanyIdFromRequest(req);

    let query = supabase.from("staff").select("*").order("id", { ascending: true });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (branch && branch !== 'all') {
      query = query.eq("branch", branch);
    }

    const { data, error } = await query;

    if (!service) {
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // Query staff members and filter case-insensitively
    let serviceQuery = supabase
      .from("staff")
      .select("name, services");

    if (companyId) {
      serviceQuery = serviceQuery.eq("company_id", companyId);
    }

    if (branch && branch !== 'all') {
      serviceQuery = serviceQuery.eq("branch", branch);
    }

    const { data: staff, error: serviceError } = await serviceQuery;

    if (serviceError) throw serviceError;

    const serviceNameLower = service.trim().toLowerCase();

    // Map to array of names to match the expected array of strings format
    const staffNames = (staff || [])
      .filter((s: any) => {
        if (!s.services || !Array.isArray(s.services)) return false;
        return s.services.some((serv: string) => serv.trim().toLowerCase() === serviceNameLower);
      })
      .map((s: any) => s.name);

    return NextResponse.json(staffNames);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}
