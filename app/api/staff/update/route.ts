import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { updateStaffSchema, formatZodError } from "@/lib/validations";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";

export async function PATCH(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const body = await req.json();

    // Validate input
    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { id, name, email, phone, role, services, is_active, working_start, working_end, working_days, color } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (working_start !== undefined) updateData.working_start = working_start;
    if (working_end !== undefined) updateData.working_end = working_end;
    if (working_days !== undefined) updateData.working_days = working_days;
    if (color !== undefined) updateData.color = color;
    if (services !== undefined) {
      updateData.services = Array.isArray(services) ? services.map((s: string) => s.trim()) : (typeof services === 'string' ? services.split(',').map((s: string) => s.trim()) : services);
    }

    let query = supabase.from("staff").update(updateData).eq("id", id);
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, staff: data });
  } catch (error: any) {
    console.error("Error in PATCH /api/staff/update:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update staff" },
      { status: 500 }
    );
  }
}
