import { NextResponse } from 'next/server';
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
	try {
		const contentType = req.headers.get('content-type') || '';
		let priceId = '';
		if (contentType.includes('application/json')) {
			const body = await req.json();
			priceId = body.priceId;
		} else if (contentType.includes('application/x-www-form-urlencoded')) {
			const form = await req.formData();
			priceId = String(form.get('priceId') || '');
		}
		if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });

		const supabase = createServerSupabase();
		const { data: { user }, error: userErr } = await supabase.auth.getUser();
		if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const customerId = await getOrCreateStripeCustomer(user.id);
		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: customerId,
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?status=success`,
			cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
			locale: 'pt-BR',
		});
		return NextResponse.json({ url: session.url });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
	}
}