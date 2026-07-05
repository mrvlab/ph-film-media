import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { computeSeatsSold } from '@/lib/tickets/computeSeatsSold';
import { setSeatsSold } from '@/lib/tickets/setSeatsSold';
import { writeClient } from '@/sanity/lib/writeClient';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe search is eventually consistent. After checkout.session.completed the
// just-created PaymentIntent may not be indexed for a moment. Wait briefly so
// our recompute includes it.
const SEARCH_INDEX_LAG_MS = 3000;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    });
  }

  const ticketId = await resolveTicketId(event);
  if (!ticketId) {
    // Not an event we care about, or an event we care about but with no ticketId.
    return new Response(null, { status: 200 });
  }

  const publishedId = ticketId.replace(/^drafts\./, '');

  // Log the event for observability. This doubles as a duplicate-delivery
  // marker, but our recompute is idempotent so duplicates are harmless anyway.
  await writeClient
    .createIfNotExists({
      _id: `stripeEvent.${event.id}`,
      _type: 'stripeEvent',
      type: event.type,
      ticketId: publishedId,
      receivedAt: new Date(event.created * 1000).toISOString(),
    })
    .catch(() => {});

  try {
    if (event.type === 'checkout.session.completed') {
      await sleep(SEARCH_INDEX_LAG_MS);
    }
    const seatsSold = await computeSeatsSold(publishedId);
    await setSeatsSold(publishedId, seatsSold);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email ?? 'unknown';
      console.log(
        `[EMAIL SIMULATION] Would send ticket confirmation to ${email} for ticket ${publishedId} (seatsSold=${seatsSold})`
      );
    } else {
      console.log(
        `[WEBHOOK] Recomputed seatsSold=${seatsSold} for ${publishedId} after ${event.type}`
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error(
      `[WEBHOOK] Failed to recompute seatsSold for ${publishedId}: ${message}`
    );
    return new Response('recompute_failed', { status: 500 });
  }

  return new Response(null, { status: 200 });
}

async function resolveTicketId(event: Stripe.Event): Promise<string | null> {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.metadata?.ticketId ?? null;
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    // Prefer metadata on the charge itself (which inherits from PI when set).
    const direct = charge.metadata?.ticketId;
    if (direct) return direct;

    // Legacy fallback: look up the session via payment_intent for charges made
    // before we started stamping metadata on the PaymentIntent.
    const paymentIntent =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (!paymentIntent) return null;
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent,
      limit: 1,
    });
    return sessions.data[0]?.metadata?.ticketId ?? null;
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
