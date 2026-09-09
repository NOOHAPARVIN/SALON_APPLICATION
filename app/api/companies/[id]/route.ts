import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting company:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
