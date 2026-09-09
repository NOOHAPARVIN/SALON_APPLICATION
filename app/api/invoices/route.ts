import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get("dateRange") || "last_7_days";
    const branch = searchParams.get("branch") || "all";
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) {
      return NextResponse.json({ success: false, error: compError }, { status: 400 });
    }

    let query = supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (branch && branch !== "all") {
      query = query.eq("branch", branch);
    }

    // Apply date range filters
    const now = new Date();
    if (dateRange === "today") {
      const todayStr = now.toISOString().split("T")[0];
      query = query.gte("appointment_date", todayStr).lte("appointment_date", todayStr);
    } else if (dateRange === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yestStr = yesterday.toISOString().split("T")[0];
      query = query.gte("appointment_date", yestStr).lte("appointment_date", yestStr);
    } else if (dateRange === "last_7_days") {
      const last7 = new Date(now);
      last7.setDate(now.getDate() - 7);
      query = query.gte("appointment_date", last7.toISOString().split("T")[0]);
    } else if (dateRange === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      query = query.gte("appointment_date", startOfMonth);
    } else if (dateRange === "this_year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      query = query.gte("appointment_date", startOfYear);
    } else if (dateRange === "custom" && startDate && endDate) {
      query = query.gte("appointment_date", startDate).lte("appointment_date", endDate);
    }

    let { data: bookings, error } = await query;

    if (error && error.message && error.message.includes("branch")) {
      let fallbackQuery = supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (companyId) fallbackQuery = fallbackQuery.eq("company_id", companyId);
      const res = await fallbackQuery;
      bookings = res.data || [];
      error = null;
    }

    if (error) throw error;

    // Filter out internal non-transaction blocks
    const filteredRows = (bookings || []).filter((b: any) => b.category !== "Leave" && b.category !== "Busy");

    // Format raw database bookings into standardized Invoice records matching screenshot columns
    const invoices = filteredRows.map((b: any) => {
      // Generate clean invoice number (e.g. 13060, 13061...)
      const invNum = b.id >= 1000 ? String(b.id) : String(13000 + Number(b.id));

      // Determine type
      let invType = "Sale";
      if (b.status === "cancelled" || (b.refund_amount && Number(b.refund_amount) > 0)) {
        invType = "Refund";
      } else if (b.category && b.category.toLowerCase().includes("gift")) {
        invType = "Gift Card";
      }

      // Format location label
      let locLabel = b.branch ? String(b.branch) : "Main Location";
      if (locLabel.toLowerCase() === "rospa") {
        locLabel = "Rospa - Mirqab - E302";
      } else if (locLabel.toLowerCase() === "elan") {
        locLabel = "Elan Gents Salon";
      } else if (locLabel.toLowerCase() === "all") {
        locLabel = String(b.company_id) === "2" || String(companyId) === "2" ? "Elan Gents Salon" : "Rospa - Mirqab - E302";
      }

      // Map status
      let invStatus: "Paid" | "Unpaid" | "Refunded" = "Paid";
      if (b.status === "cancelled" || (b.refund_amount && Number(b.refund_amount) > 0)) {
        invStatus = "Refunded";
      } else if (b.payment_status === "unpaid" || b.payment_status === "pending") {
        invStatus = "Unpaid";
      } else {
        invStatus = "Paid";
      }

      // Format date strings
      let invDateStr = b.appointment_date || b.created_at || new Date().toISOString().split("T")[0];
      let formattedInvDate = invDateStr;
      try {
        const dObj = new Date(invDateStr);
        if (!isNaN(dObj.getTime())) {
          formattedInvDate = dObj.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
        }
      } catch (e) {}

      // Reference number
      const refNum = b.group_id ? `REF-${b.group_id.slice(0, 6).toUpperCase()}` : `REF-${invNum}`;

      // Total amount
      const amountVal = Number(b.total) || Number(b.price) || 0;

      // Parse services line items
      let servicesList: any[] = [];
      try {
        if (b.services) {
          servicesList = typeof b.services === "string" ? JSON.parse(b.services) : b.services;
        }
      } catch (e) {
        servicesList = [{ service: b.service_name || "Salon Service", price: amountVal, quantity: 1 }];
      }

      if (!servicesList || servicesList.length === 0) {
        servicesList = [{ service: b.service_name || "Salon Service", price: amountVal, quantity: 1 }];
      }

      return {
        id: b.id,
        invoice_number: invNum,
        type: invType,
        customer_name: b.customer_name || b.name || "Guest Customer",
        customer_phone: b.phone ? String(b.phone) : "",
        location: locLabel,
        branch: b.branch || "rospa",
        company_id: b.company_id,
        status: invStatus,
        invoice_date: formattedInvDate,
        raw_date: invDateStr,
        due_date: formattedInvDate,
        ref_number: refNum,
        payment_method: b.payment_method || "Cash",
        amount: amountVal,
        services: servicesList,
        notes: b.notes || "",
        created_at: b.created_at,
      };
    });

    // Apply search filter if present (matches invoice_number, customer_name, or phone)
    let searchFiltered = invoices;
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      searchFiltered = invoices.filter((inv: any) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.customer_phone.toLowerCase().includes(q) ||
        inv.ref_number.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      invoices: searchFiltered,
      totalCount: searchFiltered.length,
    });
  } catch (error: any) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer_name, customer_phone, branch, payment_method, status, invoice_date, due_date, services, notes, total_amount } = body;

    if (!customer_name) {
      return NextResponse.json({ success: false, error: "Customer name is required" }, { status: 400 });
    }

    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) {
      return NextResponse.json({ success: false, error: compError }, { status: 400 });
    }

    const phoneVal = customer_phone ? parseInt(String(customer_phone).replace(/\D/g, ""), 10) : null;
    const invDateStr = invoice_date || new Date().toISOString().split("T")[0];
    const calcTotal = Number(total_amount) || (Array.isArray(services) ? services.reduce((acc: number, s: any) => acc + (Number(s.price) * (Number(s.quantity) || 1)), 0) : 0);

    const bookingToInsert = {
      name: customer_name,
      customer_name: customer_name,
      phone: phoneVal,
      appointment_date: invDateStr,
      start_time: "10:00:00",
      end_time: "10:30:00",
      duration_minutes: 30,
      service_name: Array.isArray(services) && services[0]?.service ? services[0].service : "Direct Sale Invoice",
      category: "Sale",
      price: calcTotal,
      total: calcTotal,
      payment_method: payment_method || "cash",
      payment_status: status === "Paid" ? "paid" : "unpaid",
      status: "confirmed",
      created_by: "invoice_system",
      booking_source: "invoice",
      notes: notes || "Manual Sale Invoice",
      branch: branch || "rospa",
      company_id: companyId || "00000000-0000-0000-0000-000000000000",
      services: JSON.stringify(services || [{ service: "Direct Sale Invoice", price: calcTotal, quantity: 1 }]),
    };

    let { data: inserted, error } = await supabase
      .from("bookings")
      .insert([bookingToInsert])
      .select()
      .single();

    if (error && error.message && error.message.includes("branch")) {
      const { branch: _, ...retryInsert } = bookingToInsert;
      const res = await supabase.from("bookings").insert([retryInsert]).select().single();
      inserted = res.data;
      error = res.error;
    }

    if (error) throw error;

    const invNum = inserted.id >= 1000 ? String(inserted.id) : String(13000 + Number(inserted.id));

    return NextResponse.json({
      success: true,
      message: "Invoice created and saved successfully in database",
      invoice: {
        id: inserted.id,
        invoice_number: invNum,
        customer_name: inserted.customer_name,
        amount: calcTotal,
        status: status || "Paid",
        created_at: inserted.created_at,
      },
    });
  } catch (error: any) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
