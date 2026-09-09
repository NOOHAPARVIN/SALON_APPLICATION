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
    const { data: staff, error } = await supabase
      .from("staff")
      .select("id, name, specialization, profile_picture")
      .eq("company_id", companyId)
      .eq("status", "Active")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, staff });
  } catch (err: any) {
    console.error("Error in public staff API:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
