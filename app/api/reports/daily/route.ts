import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const branch = searchParams.get("branch") || "all";
    const listAll = searchParams.get("listAll") === "true";

    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) {
      return NextResponse.json({ success: false, error: compError }, { status: 400 });
    }

    const activeCompanyId = companyId || "00000000-0000-0000-0000-000000000000";

    // If listAll is requested, return all distinct dates with submitted/verified daily reports
    if (listAll) {
      let query = supabase
        .from("bookings")
        .select("id, appointment_date, notes, created_at")
        .eq("booking_source", "daily_report")
        .order("appointment_date", { ascending: false });

      if (activeCompanyId) {
        query = query.eq("company_id", activeCompanyId);
      }

      const { data: reportsData } = await query;
      
      const historyList = (reportsData || []).map((r: any) => {
        let parsed: any = {};
        try {
          parsed = typeof r.notes === "string" ? JSON.parse(r.notes) : r.notes;
        } catch (e) {}

        return {
          id: r.id,
          date: r.appointment_date,
          status: parsed.status || "submitted",
          submitted_by: parsed.receptionistName || "Receptionist",
          submitted_at: parsed.submittedAt || r.created_at,
          verified_by: parsed.verifiedBy || null,
          verified_at: parsed.verifiedAt || null,
          total_revenue: parsed.revenue?.total || 0,
        };
      });

      return NextResponse.json({ success: true, history: historyList });
    }

    // Single Date Report Query
    let query = supabase
      .from("bookings")
      .select("*")
      .eq("booking_source", "daily_report")
      .eq("appointment_date", dateParam)
      .order("created_at", { ascending: false });

    if (activeCompanyId) {
      query = query.eq("company_id", activeCompanyId);
    }
    if (branch && branch !== "all") {
      query = query.eq("branch", branch);
    }

    const { data: reportRows, error } = await query;
    if (error) throw error;

    if (reportRows && reportRows.length > 0) {
      const row = reportRows[0];
      let reportPayload: any = {};
      try {
        reportPayload = typeof row.notes === "string" ? JSON.parse(row.notes) : row.notes;
      } catch (e) {
        reportPayload = {};
      }

      return NextResponse.json({
        success: true,
        exists: true,
        report: {
          id: row.id,
          date: row.appointment_date,
          branch: row.branch,
          company_id: row.company_id,
          status: reportPayload.status || "submitted",
          submittedBy: reportPayload.receptionistName || "Duty Receptionist",
          submittedAt: reportPayload.submittedAt || row.created_at,
          verifiedBy: reportPayload.verifiedBy || null,
          verifiedAt: reportPayload.verifiedAt || null,
          revenue: reportPayload.revenue || null,
          collection: reportPayload.collection || null,
          expenses: reportPayload.expenses || [],
          cashReport: reportPayload.cashReport || null,
          receptionistName: reportPayload.receptionistName || "Duty Receptionist",
          accountantName: reportPayload.accountantName || "Accountant / Manager",
        },
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
      report: null,
    });
  } catch (error: any) {
    console.error("GET /api/reports/daily error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server error fetching daily report" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, branch, revenue, collection, expenses, cashReport, receptionistName, accountantName } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: "Report date is required" }, { status: 400 });
    }

    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) {
      return NextResponse.json({ success: false, error: compError }, { status: 400 });
    }

    const activeCompanyId = companyId || "00000000-0000-0000-0000-000000000000";
    const reportDate = date;
    const nowIso = new Date().toISOString();

    const payloadToStore = {
      status: "submitted",
      submittedAt: nowIso,
      receptionistName: receptionistName || "Duty Receptionist",
      accountantName: accountantName || "Accountant / Manager",
      revenue,
      collection,
      expenses,
      cashReport,
    };

    // Check if a daily report for this date & branch already exists
    let existingQuery = supabase
      .from("bookings")
      .select("id")
      .eq("booking_source", "daily_report")
      .eq("appointment_date", reportDate);

    if (activeCompanyId) existingQuery = existingQuery.eq("company_id", activeCompanyId);
    if (branch && branch !== "all") existingQuery = existingQuery.eq("branch", branch);

    const { data: existingRows } = await existingQuery;

    let savedRecord: any = null;

    if (existingRows && existingRows.length > 0) {
      // Update existing report record
      const existingId = existingRows[0].id;
      const { data: updated, error: updateErr } = await supabase
        .from("bookings")
        .update({
          notes: JSON.stringify(payloadToStore),
          total: revenue?.total || 0,
          price: revenue?.total || 0,
        })
        .eq("id", existingId)
        .select()
        .single();

      if (updateErr) throw updateErr;
      savedRecord = updated;
    } else {
      // Insert new daily report record
      const recordToInsert = {
        name: `Daily Report (${reportDate})`,
        customer_name: `Daily Report (${reportDate})`,
        appointment_date: reportDate,
        start_time: "00:00:00",
        end_time: "23:59:59",
        category: "Daily Report",
        service_name: "Financial Statement Daily Report",
        price: revenue?.total || 0,
        total: revenue?.total || 0,
        payment_method: "cash",
        payment_status: "paid",
        status: "confirmed",
        created_by: receptionistName || "receptionist",
        booking_source: "daily_report",
        branch: branch || "rospa",
        company_id: activeCompanyId,
        notes: JSON.stringify(payloadToStore),
      };

      let { data: inserted, error: insertErr } = await supabase
        .from("bookings")
        .insert([recordToInsert])
        .select()
        .single();

      if (insertErr && insertErr.message && insertErr.message.includes("branch")) {
        const { branch: _, ...retryInsert } = recordToInsert;
        const res = await supabase.from("bookings").insert([retryInsert]).select().single();
        inserted = res.data;
        insertErr = res.error;
      }

      if (insertErr) throw insertErr;
      savedRecord = inserted;
    }

    return NextResponse.json({
      success: true,
      message: `Daily report for ${reportDate} submitted and saved to database successfully!`,
      report: {
        id: savedRecord.id,
        date: reportDate,
        status: "submitted",
        submittedBy: receptionistName,
        submittedAt: nowIso,
      },
    });
  } catch (error: any) {
    console.error("POST /api/reports/daily error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit daily report" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { date, branch, verifiedBy, status } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: "Report date is required for verification" }, { status: 400 });
    }

    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) {
      return NextResponse.json({ success: false, error: compError }, { status: 400 });
    }

    const activeCompanyId = companyId || "00000000-0000-0000-0000-000000000000";
    const reportDate = date;

    let query = supabase
      .from("bookings")
      .select("*")
      .eq("booking_source", "daily_report")
      .eq("appointment_date", reportDate);

    if (activeCompanyId) query = query.eq("company_id", activeCompanyId);
    if (branch && branch !== "all") query = query.eq("branch", branch);

    const { data: rows, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "No submitted daily report found for this date to verify." }, { status: 404 });
    }

    const targetRow = rows[0];
    let payload: any = {};
    try {
      payload = typeof targetRow.notes === "string" ? JSON.parse(targetRow.notes) : targetRow.notes;
    } catch (e) {
      payload = {};
    }

    const nowIso = new Date().toISOString();
    payload.status = status || "verified";
    payload.verifiedBy = verifiedBy || "Owner / Manager";
    payload.verifiedAt = nowIso;
    if (verifiedBy) {
      payload.accountantName = verifiedBy;
    }

    const { data: updated, error: updateErr } = await supabase
      .from("bookings")
      .update({
        notes: JSON.stringify(payload),
      })
      .eq("id", targetRow.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      message: `Daily report for ${reportDate} marked as VERIFIED!`,
      report: {
        id: updated.id,
        date: reportDate,
        status: "verified",
        verifiedBy: payload.verifiedBy,
        verifiedAt: nowIso,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/reports/daily error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to verify daily report" }, { status: 500 });
  }
}
