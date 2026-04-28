import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, secret);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const level = parseInt(session.metadata?.level ?? '1');
      if (!userId) break;

      await supabase.from('profiles').update({ access_level: level }).eq('id', userId);
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        level,
        status: 'active',
        current_period_end: null,
      }, { onConflict: 'user_id' });
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      const periodEnd = new Date((invoice.lines.data[0]?.period?.end ?? 0) * 1000).toISOString();

      await supabase
        .from('subscriptions')
        .update({ status: 'active', current_period_end: periodEnd })
        .eq('stripe_subscription_id', subscriptionId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', sub.id);

      if (userId) {
        await supabase.from('profiles').update({ access_level: 1 }).eq('id', userId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
