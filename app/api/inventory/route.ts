import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { createInventorySchema, updateInventorySchema, formatZodError } from "@/lib/validations";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";

// GET: Fetch all inventory items
export async function GET(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    let query = supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (branch && branch !== 'all') {
      query = query.eq('branch', branch);
    }

    let { data: inventory, error } = await query;

    // Graceful fallback if the branch column doesn't exist in the database yet
    if (error && error.message && error.message.includes("branch")) {
      console.warn("Branch column might not exist, falling back to all inventory");
      const fallbackQuery = supabase.from("inventory").select("*").order("created_at", { ascending: false });
      const fallbackResult = await fallbackQuery;
      inventory = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;
    return NextResponse.json({ success: true, inventory: inventory || [] });
  } catch (error: any) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST: Add new inventory item
export async function POST(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const body = await req.json();

    // Validate input
    const parsed = createInventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { name, variant, category, stock, unit, threshold, price } = body;

    const insertData: any = {
      name,
      variant: variant || null,
      category: category || null,
      stock: Number(stock) || 0,
      unit: unit || "pcs",
      threshold: Number(threshold) || 5,
      price: Number(price) || 0,
      branch: body.branch || 'all',
      company_id: companyId,
    };

    let { data, error } = await supabase
      .from("inventory")
      .insert([insertData])
      .select()
      .single();

    if (error && error.message && error.message.includes("branch")) {
      console.warn("Branch column missing, falling back to insert without branch");
      delete insertData.branch;
      const fallbackResult = await supabase.from("inventory").insert([insertData]).select().single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;
    return NextResponse.json({ success: true, item: data });
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add inventory item" },
      { status: 500 }
    );
  }
}

// PATCH: Update existing inventory item
export async function PATCH(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate input
    const parsed = updateInventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.variant !== undefined) updateData.variant = body.variant;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.stock !== undefined) updateData.stock = Number(body.stock);
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.threshold !== undefined) updateData.threshold = Number(body.threshold);
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.branch !== undefined) updateData.branch = body.branch;

    let query = supabase.from("inventory").update(updateData).eq("id", id);
    if (companyId) query = query.eq("company_id", companyId);

    let { data, error } = await query.select().single();

    if (error && error.message && error.message.includes("branch") && updateData.branch !== undefined) {
      console.warn("Branch column missing, falling back to update without branch");
      delete updateData.branch;
      const fallbackResult = await supabase.from("inventory").update(updateData).eq("id", id).select().single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;
    return NextResponse.json({ success: true, item: data });
  } catch (error: any) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE: Remove inventory item
export async function DELETE(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    if (compError) return NextResponse.json({ success: false, error: compError }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    let query = supabase.from("inventory").delete().eq("id", id);
    if (companyId) query = query.eq("company_id", companyId);

    const { error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}

