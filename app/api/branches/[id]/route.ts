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
    // 1. Fetch branch first to get company_id
    const { data: existingBranch } = await supabase
      .from("branches")
      .select("company_id")
      .eq("id", params.id)
      .single();

    // 2. Perform soft delete by setting is_active to false
    const { error } = await supabase
      .from("branches")
      .update({ is_active: false })
      .eq("id", params.id);

    if (error) throw error;

    // 3. Update Stripe subscription if available
    if (existingBranch?.company_id) {
      try {
        const { createClient } = await import('@/utils/supabase/server');
        const supabaseServer = createClient();
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (user) {
          const stripeSubscriptionId = user.user_metadata?.stripe_subscription_id;
          const subscriptionStatus = user.user_metadata?.subscription_status;

          if (stripeSubscriptionId && subscriptionStatus === 'active') {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
              apiVersion: '2024-06-20' as any,
            });

            const { count } = await supabase
              .from('branches')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', existingBranch.company_id)
              .eq('is_active', true);

            const newBranchCount = Math.max(1, count || 1);
            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            if (subscription && subscription.items.data.length > 0) {
              const subscriptionItemId = subscription.items.data[0].id;
              await stripe.subscriptions.update(stripeSubscriptionId, {
                items: [{ id: subscriptionItemId, quantity: newBranchCount }],
                proration_behavior: 'always_invoice',
              });
            }
          }
        }
      } catch (stripeErr) {
        console.error("Stripe update error on branch deletion:", stripeErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error setting branch inactive:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
