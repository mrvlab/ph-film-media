import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

/**
 * Resolves a Stripe Checkout session into a GA4 `purchase` payload for the
 * browser to send. Only the buyer lands on the success URL with their own
 * session id, and nothing personal (email, address) is returned — just what the
 * Monetization reports need.
 */
export async function GET(request: Request) {
  if (!rateLimit(`analytics-purchase:${clientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId?.startsWith('cs_')) {
    return NextResponse.json({ error: 'invalid_session_id' }, { status: 400 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });
  } catch {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }

  // Abandoned or still-processing sessions aren't revenue yet.
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'not_paid' }, { status: 409 });
  }

  const metadata = session.metadata ?? {};
  const category =
    metadata.type === 'membership'
      ? 'Medlemskap'
      : metadata.ticketId
        ? 'Biljett'
        : 'Produkt';
  const itemId =
    metadata.ticketId ?? metadata.productId ?? metadata.type ?? sessionId;

  const currency = (session.currency ?? 'sek').toUpperCase();
  const items = (session.line_items?.data ?? []).map((line, index) => ({
    item_id: itemId,
    item_name: line.description ?? category,
    item_category: category,
    ...(metadata.size ? { item_variant: metadata.size } : {}),
    price: (line.amount_total ?? 0) / 100 / (line.quantity || 1),
    quantity: line.quantity ?? 1,
    index,
  }));

  return NextResponse.json({
    // Stripe's session id is stable per order, so GA dedupes repeat sends.
    transaction_id: session.id,
    value: (session.amount_total ?? 0) / 100,
    currency,
    purchase_type: category,
    items,
  });
}
