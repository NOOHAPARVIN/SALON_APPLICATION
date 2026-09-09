import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { createStaffSchema, formatZodError } from "@/lib/validations";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch all staff from the staff table
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const queryCompanyId = searchParams.get('companyId');

    let query = supabase
      .from('staff')
      .select('*')
      .order('id', { ascending: true });

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

    const { data: staffData, error } = await query;

    if (error && error.message && error.message.includes("branch")) {
      console.error("Branch column missing in database for staff. Please run the migration script.");
      // Return empty array instead of failing completely, to prompt the user to migrate
      return NextResponse.json({ staff: [] });
    }

    if (error) throw error;
    
    let resultStaff = staffData || [];
    if (branch === 'elan' && resultStaff.length === 0) {
      resultStaff = [
        {
          id: 101,
          name: "Brahim",
          role: "Hair & Combo Specialist",
          services: [
            "Hair Care", "Hair", "Combo", "Any haircut", "Beard setting", "Kids haircut",
            "Anyhaircut + beard setting + facescrub + facemask"
          ],
          is_active: true,
          color: "#ff6b35",
          branch: "elan"
        },
        {
          id: 102,
          name: "Leopoldo",
          role: "Massage Therapist",
          services: [
            "Massages", "Deep tissue massage", "Relaxing massage", "Thai massage",
            "Signature massage", "Foot massage"
          ],
          is_active: true,
          color: "#00d284",
          branch: "elan"
        }
      ];
    }
    
    return NextResponse.json({ staff: resultStaff });
  } catch (err: any) {
    console.error("Error in GET /api/staff:", err);
    return NextResponse.json({ staff: [], error: err.message }, { status: 500 });
  }
}

// POST: Add a new staff member to the staff table
export async function POST(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const body = await req.json();

    // Validate input
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { name, email, phone, role, services, is_active, working_start, working_end, working_days, color } = body;

    // Default colors for scheduling calendar
    const defaultColors = ["#22c55e", "#eab308", "#ff6b35", "#00d284", "#2972ff", "#8b5cf6", "#f472b6", "#06b6d4"];
    const chosenColor = color || defaultColors[Math.floor(Math.random() * defaultColors.length)];

    // Hack: Get max ID to avoid sequence out-of-sync issues
    const { data: maxIdData } = await supabase
      .from('staff')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

    const insertData: any = {
      id: nextId,
      name,
      email: email || null,
      phone: phone || null,
      role: role || 'stylist',
      services: Array.isArray(services) ? services.map((s: string) => s.trim()) : (services ? services.split(',').map((s: string) => s.trim()) : []),
      is_active: is_active ?? true,
      working_start: working_start || "09:00",
      working_end: working_end || "21:00",
      working_days: working_days || [0, 1, 2, 3, 4, 5, 6],
      color: chosenColor,
      branch: body.branch || 'rospa',
      company_id: companyId || '00000000-0000-0000-0000-000000000000'
    };

    let { data, error } = await supabase
      .from('staff')
      .insert([insertData])
      .select()
      .single();

    if (error && error.message && error.message.includes("branch")) {
      console.warn("Branch column might not exist, falling back to insert without branch");
      delete insertData.branch;
      const fallbackResult = await supabase
        .from('staff')
        .insert([insertData])
        .select()
        .single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, staff: data });
  } catch (err: any) {
    console.error("Error in POST /api/staff:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to create staff member" }, { status: 500 });
  }
}

// DELETE: Remove a staff member by ID
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/staff:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to delete staff" }, { status: 500 });
  }
}

