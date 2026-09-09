import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const staffId = formData.get("staffId") as string;
    const file = formData.get("file") as File;

    if (!staffId || !file) {
      return NextResponse.json(
        { success: false, error: "Missing staffId or file" },
        { status: 400 }
      );
    }

    // Convert file to buffer for Supabase storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `staff_${staffId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage bucket named 'avatars'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Update the staff table with the new avatar_url
    const { error: updateError } = await supabase
      .from('staff')
      .update({ avatar_url: publicUrl })
      .eq('id', parseInt(staffId, 10));

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, avatar_url: publicUrl });
  } catch (error: any) {
    console.error("Error in POST /api/staff/upload:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
