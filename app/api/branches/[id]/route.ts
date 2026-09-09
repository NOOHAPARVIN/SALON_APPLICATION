import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, is_active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: branch, error } = await supabase
      .from("branches")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error || !branch) throw error;

    return NextResponse.json({ success: true, branch });
  } catch (err: any) {
    console.error("Error updating branch:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting branch:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
