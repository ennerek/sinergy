import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PRICES } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { level } = await request.json();
  if (!level || !(level in PRICES)) return NextResponse.json({ error: 'Invalid level' }, { status: 400 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single();

  let customerId: string = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PRICES[level as keyof typeof PRICES], quantity: 1 }],
    metadata: { supabase_user_id: user.id, level },
    success_url: `${appUrl}/home?upgraded=1`,
    cancel_url: `${appUrl}/home`,
  });

  return NextResponse.json({ url: session.url });
}
