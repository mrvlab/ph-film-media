import 'server-only';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';

// Recomputes seatsSold for a ticket from Stripe (the source of truth).
//
// Counts distinct PaymentIntents where:
//   - metadata.ticketId matches
//   - status is 'succeeded'
//   - the latest charge has NOT been fully refunded
//
// Stripe's search API is eventually consistent: a PaymentIntent is not in the
// search index for a few seconds after it is created. So the sale that triggers
// a `checkout.session.completed` recompute is frequently missing from the
// search results, which would undercount it. To avoid that, pass the triggering
// PaymentIntent id as `ensurePaymentIntentId`: it is fetched with a direct
// retrieve (which IS strongly consistent) and folded into the count, so the
// just-completed sale is never dropped. Do NOT pass it for refunds — a refund
// must be free to decrease the count.
export async function computeSeatsSold(
  ticketId: string,
  ensurePaymentIntentId?: string
): Promise<number> {
  const publishedId = ticketId.replace(/^drafts\./, '');
  const query = `metadata['ticketId']:'${publishedId}' AND status:'succeeded'`;

  // Track ids (not a bare counter) so an ensured PI already in the search
  // results is never double-counted.
  const paidIds = new Set<string>();
  let page: Stripe.ApiSearchResult<Stripe.PaymentIntent> =
    await stripe.paymentIntents.search({
      query,
      limit: 100,
      expand: ['data.latest_charge'],
    });

  while (true) {
    for (const pi of page.data) {
      if (isPaidAndNotRefunded(pi)) paidIds.add(pi.id);
    }
    if (!page.next_page) break;
    page = await stripe.paymentIntents.search({
      query,
      limit: 100,
      page: page.next_page,
      expand: ['data.latest_charge'],
    });
  }

  // Fold in the triggering sale if the index has not caught up to it yet.
  if (ensurePaymentIntentId && !paidIds.has(ensurePaymentIntentId)) {
    const pi = await stripe.paymentIntents.retrieve(ensurePaymentIntentId, {
      expand: ['latest_charge'],
    });
    const matchesTicket =
      pi.metadata?.ticketId?.replace(/^drafts\./, '') === publishedId;
    if (matchesTicket && pi.status === 'succeeded' && isPaidAndNotRefunded(pi)) {
      paidIds.add(pi.id);
    }
  }

  return paidIds.size;
}

function isPaidAndNotRefunded(pi: Stripe.PaymentIntent): boolean {
  const charge = pi.latest_charge as Stripe.Charge | string | null;
  if (!charge || typeof charge === 'string') return false;
  if (charge.refunded) return false;
  if (charge.amount_refunded >= charge.amount && charge.amount > 0) return false;
  return true;
}
