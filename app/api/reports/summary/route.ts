import { NextResponse } from "next/server";
import { getAdvancedReportingData, getAllReportingTimeframes } from "@/lib/dashboardData";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch") || "all";
    const staff = searchParams.get("staff") || "all";
    const service = searchParams.get("service") || "all";
    const view = searchParams.get("view") || "month";

    const { companyId } = await getCompanyIdFromRequest(req);

    // Fetch summary reporting data filtered by branch, view, staff, service & companyId
    const [advancedData, allTimeframes] = await Promise.all([
      getAdvancedReportingData(branch, view, staff, companyId, service),
      getAllReportingTimeframes(branch, staff, companyId, service),
    ]);

    // Fetch staff list for the dropdown
    let staffQuery = supabase.from("staff").select("id, name, branch, role").order("id", { ascending: true });
    if (companyId) {
      staffQuery = staffQuery.eq("company_id", companyId);
    }
    if (branch && branch !== "all") {
      staffQuery = staffQuery.eq("branch", branch);
    }
    const { data: staffData } = await staffQuery;

    let staffList = staffData || [];
    if (branch === "elan" && staffList.length === 0) {
      staffList = [
        { id: 101, name: "Brahim", role: "Hair & Combo Specialist", branch: "elan" },
        { id: 102, name: "Leopoldo", role: "Massage Therapist", branch: "elan" },
      ];
    }

    return NextResponse.json({
      success: true,
      branch,
      staff,
      service,
      view,
      summary: {
        totalSales: advancedData?.business?.sales || 0,
        cashSales: advancedData?.business?.cashSales || 0,
        cardSales: advancedData?.business?.cardSales || 0,
        appointments: advancedData?.activity?.appointments || 0,
        completedBookings: advancedData?.completed?.length || 0,
        clients: advancedData?.activity?.clients || 0,
        tipsLiability: advancedData?.business?.tipsLiability || 0,
        giftCardsSold: advancedData?.business?.giftCardsSold || 0,
      },
      timeframes: {
        day: allTimeframes?.day?.business?.sales || 0,
        week: allTimeframes?.week?.business?.sales || 0,
        month: allTimeframes?.month?.business?.sales || 0,
        year: allTimeframes?.year?.business?.sales || 0,
      },
      staffList,
      servicesList: advancedData?.servicesList || [],
    });
  } catch (err: any) {
    console.error("Error in GET /api/reports/summary:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
