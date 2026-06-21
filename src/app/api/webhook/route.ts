import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { writeClient } from '@/sanity/lib/writeClient';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  // Read the raw body BEFORE any JSON parsing — Stripe HMAC requires the
  // exact bytes Stripe sent. Calling request.json() here would break verification.
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

  // TODO(prod): dedupe on event.id to handle Stripe's at-least-once redelivery.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const ticketId = session.metadata?.ticketId;
    const email = session.customer_details?.email ?? 'unknown@unknown';

    if (ticketId) {
      try {
        await writeClient
          .patch(ticketId)
          .setIfMissing({ seatsSold: 0 })
          .inc({ seatsSold: 1 })
          .commit();

        console.log(
          `[EMAIL SIMULATION] Would send ticket confirmation to ${email} for ticket ${ticketId}`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        console.error(
          `[WEBHOOK] Failed to increment seatsSold for ${ticketId}: ${message}`
        );
        // Return 500 so Stripe retries — better than silently dropping the seat update.
        return new Response('sanity_patch_failed', { status: 500 });
      }
    } else {
      console.warn('[WEBHOOK] checkout.session.completed missing ticketId metadata');
    }
  }

  return new Response(null, { status: 200 });
}
