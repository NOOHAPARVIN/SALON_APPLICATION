import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { createReviewSchema, formatZodError } from "@/lib/validations";
import { getCompanyIdFromRequest } from "@/lib/companyAuth";

export async function GET(req: Request) {
  try {
    const { companyId, error: compError } = await getCompanyIdFromRequest(req);
    
    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    if (companyId) {
      query = query.eq("company_id", companyId);
    }
    
    if (branch && branch !== 'all') {
      query = query.eq('branch', branch);
    }
    
    const { data: reviews, error } = await query;
    
    if (error) {
      // If table doesn't exist yet, we will just return empty instead of failing
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, reviews: [] });
      }
      throw error;
    }
    
    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { name, service, rating, comment, stylist } = parsed.data;

    const { data, error } = await supabase
      .from("reviews")
      .insert([{
        name,
        service: service || null,
        rating,
        comment: comment || null,
        stylist: stylist || null
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, review: data });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
