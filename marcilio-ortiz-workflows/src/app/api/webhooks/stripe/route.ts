import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
	const body = await req.text();
	const sig = headers().get('stripe-signature');
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!sig || !webhookSecret) return NextResponse.json({ error: 'No signature' }, { status: 400 });

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
	} catch (err: any) {
		return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
	}

	const supabase = createServerSupabase();
	try {
		switch (event.type) {
			case 'checkout.session.completed':
				break;
			case 'customer.subscription.created':
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;
				const userId = subscription.metadata?.user_id as string | undefined;
				if (userId) {
					await supabase.from('subscriptions').upsert({
						id: subscription.id,
						user_id: userId,
						status: subscription.status as any,
						price_id: (subscription.items.data[0]?.price?.id as string) || null,
						quantity: subscription.items.data[0]?.quantity || 1,
						cancel_at_period_end: subscription.cancel_at_period_end,
						current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
						current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
						canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
						trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
						trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
					});
				}
				break;
			}
			default:
				break;
		}
		await supabase.from('etl_logs').insert({ kind: 'webhook', ref: event.type, status: 'ok', message: '' });
		return NextResponse.json({ received: true });
	} catch (e: any) {
		await supabase.from('etl_logs').insert({ kind: 'webhook', ref: event.type, status: 'error', message: e.message });
		return NextResponse.json({ error: 'Failed to handle webhook' }, { status: 500 });
	}
}