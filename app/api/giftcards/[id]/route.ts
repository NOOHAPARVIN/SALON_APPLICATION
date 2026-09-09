import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, staff_id } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;

    const { data: giftcard, error } = await supabase
      .from('gift_cards')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Update associated booking's staff_id if provided
    if (staff_id !== undefined && giftcard?.coupon_code) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, notes')
        .ilike('notes', `%Code: ${giftcard.coupon_code}%`);
        
      if (bookings && bookings.length > 0) {
        await supabase
          .from('bookings')
          .update({ staff_id: staff_id || null })
          .eq('id', bookings[0].id);
      }
    }

    if (error) throw error;

    return NextResponse.json({ success: true, giftcard });
  } catch (error: any) {
    console.error('Error updating gift card:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from('gift_cards')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting gift card:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
