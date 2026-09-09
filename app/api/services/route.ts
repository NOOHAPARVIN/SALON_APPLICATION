import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { createServiceSchema, updateServiceSchema, formatZodError } from "@/lib/validations";

// GET: Fetch all services
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");
    const queryCompanyId = searchParams.get("companyId");

    let query = supabase
      .from("services")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (branch && branch !== 'all') {
      query = query.eq('branch', branch);
    } else if (queryCompanyId) {
      query = query.eq('company_id', queryCompanyId);
    } else {
      const { getCompanyIdFromRequest } = await import("@/lib/companyAuth");
      const { companyId } = await getCompanyIdFromRequest(req);
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
    }

    const { data: services, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, services: services || [] });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST: Add new service
export async function POST(req: Request) {
  try {
    const { getCompanyIdFromRequest } = await import("@/lib/companyAuth");
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const body = await req.json();

    // Validate input
    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { name, category, price, duration_minutes, is_active, description, name_ar, description_ar, branch } = body;

    // Get max ID to avoid sequence out-of-sync issues
    const { data: maxIdData } = await supabase
      .from('services')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

    const insertData: any = {
      id: nextId,
      name,
      category: category || "Uncategorized",
      price: Number(price) || 0,
      duration_minutes: Number(duration_minutes) || 30,
      is_active: is_active !== undefined ? is_active : true,
      description: description || null,
      name_ar: name_ar || null,
      description_ar: description_ar || null,
      branch: branch || 'rospa',
      company_id: companyId || '00000000-0000-0000-0000-000000000000'
    };

    let { data, error } = await supabase
      .from("services")
      .insert([insertData])
      .select()
      .single();

    if (error && error.message) {
      let retryNeeded = false;
      if (error.message.includes("branch")) { delete insertData.branch; retryNeeded = true; }
      if (error.message.includes("description")) { delete insertData.description; retryNeeded = true; }
      if (error.message.includes("name_ar")) { delete insertData.name_ar; retryNeeded = true; }
      if (error.message.includes("description_ar")) { delete insertData.description_ar; retryNeeded = true; }

      if (retryNeeded) {
        console.warn("Schema missing columns, falling back to insert with base columns");
        const fallbackResult = await supabase.from("services").insert([insertData]).select().single();
        data = fallbackResult.data;
        error = fallbackResult.error;
      }
    }

    if (error) throw error;
    return NextResponse.json({ success: true, service: data });
  } catch (error: any) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add service" },
      { status: 500 }
    );
  }
}

// PATCH: Update existing service
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate input
    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.duration_minutes !== undefined) updateData.duration_minutes = Number(body.duration_minutes);
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.name_ar !== undefined) updateData.name_ar = body.name_ar;
    if (body.description_ar !== undefined) updateData.description_ar = body.description_ar;
    if (body.branch !== undefined) updateData.branch = body.branch;

    let { data, error } = await supabase
      .from("services")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error && error.message) {
      let retryNeeded = false;
      if (error.message.includes("branch")) { delete updateData.branch; retryNeeded = true; }
      if (error.message.includes("description")) { delete updateData.description; retryNeeded = true; }
      if (error.message.includes("name_ar")) { delete updateData.name_ar; retryNeeded = true; }
      if (error.message.includes("description_ar")) { delete updateData.description_ar; retryNeeded = true; }
      
      if (retryNeeded) {
        console.warn("Schema missing columns, falling back to update with base columns");
        if (Object.keys(updateData).length > 0) {
          const fallbackResult = await supabase.from("services").update(updateData).eq("id", id).select().single();
          data = fallbackResult.data;
          error = fallbackResult.error;
        } else {
          error = null;
          data = { id };
        }
      }
    }

    if (error) throw error;
    return NextResponse.json({ success: true, service: data });
  } catch (error: any) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE: Remove service
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete service" },
      { status: 500 }
    );
  }
}

