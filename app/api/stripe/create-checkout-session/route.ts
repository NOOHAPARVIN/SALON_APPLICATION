import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

// Initialize Stripe (assuming STRIPE_SECRET_KEY is in .env.local)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'owner' && profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard/receptionist', req.url));
    }

    const companyId = user.user_metadata?.company_id;
    if (!companyId) {
      return NextResponse.json({ error: "No company associated with user" }, { status: 400 });
    }

    // Fetch the number of active branches for this company
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
    const { count, error: countError } = await supabaseAdmin
      .from('branches')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true);
      
    const branchCount = count && count > 0 ? count : 1;

    const formData = await req.formData();
    const interval = formData.get('interval') === 'annual' ? 'annual' : 'monthly';
    const paymentMethod = formData.get('paymentMethod') === 'bank' ? 'bank' : 'card';
    
    let unitAmount = 2000; // $20.00
    if (interval === 'annual') {
      unitAmount = 1600; // $16.00 per month but usually billed annually
      // Stripe requires annual subscriptions to be billed yearly, so 16 * 12 = $192.00
      unitAmount = 19200; 
    }

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: paymentMethod === 'bank' ? ['us_bank_account', 'card'] : ['card'],
      payment_method_options: paymentMethod === 'bank' ? {
        us_bank_account: {
          financial_connections: { permissions: ['payment_method', 'balances'] }
        }
      } : undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Plus SalonOS Plan',
              description: interval === 'annual' ? 'Billed annually ($192/year per branch)' : 'Billed monthly ($20/mo per branch)',
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval === 'annual' ? 'year' : 'month',
            }
          },
          quantity: branchCount,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/owner/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/owner/billing?canceled=true`,
      client_reference_id: companyId,
      customer_email: user.email
    };

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.redirect(new URL(session.url!, req.url), 303);
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    // Include the actual error message in the URL for debugging
    return NextResponse.redirect(new URL(`/dashboard/owner/billing?error=stripe_checkout_failed&details=${encodeURIComponent(err.message || 'unknown')}`, req.url), 303);
  }
}
