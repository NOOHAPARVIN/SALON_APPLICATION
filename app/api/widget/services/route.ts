import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ success: false, error: "Missing companyId" }, { status: 400 });
    }

    // Only fetch essential, non-sensitive data
    const { data: services, error } = await supabase
      .from("services")
      .select("id, category, service, price, duration, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("service", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, services });
  } catch (err: any) {
    console.error("Error in public services API:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
