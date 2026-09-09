import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let { companyId, error: compError } = await getCompanyIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const paramCompanyId = searchParams.get('companyId');
    if (paramCompanyId) {
      companyId = paramCompanyId;
    }

    if (!companyId) {
      return NextResponse.json({ success: false, error: "Missing company ID" }, { status: 400 });
    }

    const { data: company, error } = await supabase
      .from("companies")
      .select("id, name, settings")
      .eq("id", companyId)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: company?.settings || {}, companyName: company?.name, companyId: company?.id });
  } catch (err: any) {
    console.error("Error fetching company settings:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let { companyId } = await getCompanyIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const paramCompanyId = searchParams.get('companyId');
    if (paramCompanyId) {
      companyId = paramCompanyId;
    }

    const body = await req.json();
    const { settings, name, targetCompanyId } = body;
    if (targetCompanyId) {
      companyId = targetCompanyId;
    }

    if (!companyId) {
      return NextResponse.json({ success: false, error: "Missing company ID" }, { status: 400 });
    }

    // Build the update payload
    const updatePayload: any = {};
    if (settings !== undefined) updatePayload.settings = settings;
    if (name !== undefined) updatePayload.name = name;

    const { data: updatedCompany, error } = await supabase
      .from("companies")
      .update(updatePayload)
      .eq("id", companyId)
      .select("id, name, settings")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: updatedCompany?.settings || {}, companyName: updatedCompany?.name });
  } catch (err: any) {
    console.error("Error updating company settings:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
