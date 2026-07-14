import 'server-only';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';

// Recomputes seatsSold for a ticket from Stripe (the source of truth).
//
// Counts PaymentIntents where:
//   - metadata.ticketId matches
//   - status is 'succeeded'
//   - the latest charge has NOT been fully refunded
//
// Stripe's search API is eventually consistent (typically <1s, occasionally
// longer). For events where consistency matters (a purchase we just processed
// might not yet appear in the index), callers should either:
//   - retry with backoff, or
//   - use `Math.max(currentSeatsSold, computed)` on `checkout.session.completed`
//     to prevent a stale search response from momentarily undercounting.
export async function computeSeatsSold(ticketId: string): Promise<number> {
  const publishedId = ticketId.replace(/^drafts\./, '');
  const query = `metadata['ticketId']:'${publishedId}' AND status:'succeeded'`;

  let count = 0;
  let page: Stripe.ApiSearchResult<Stripe.PaymentIntent> =
    await stripe.paymentIntents.search({
      query,
      limit: 100,
      expand: ['data.latest_charge'],
    });

  while (true) {
    for (const pi of page.data) {
      if (isPaidAndNotRefunded(pi)) count += 1;
    }
    if (!page.next_page) break;
    page = await stripe.paymentIntents.search({
      query,
      limit: 100,
      page: page.next_page,
      expand: ['data.latest_charge'],
    });
  }

  return count;
}

function isPaidAndNotRefunded(pi: Stripe.PaymentIntent): boolean {
  const charge = pi.latest_charge as Stripe.Charge | string | null;
  if (!charge || typeof charge === 'string') return false;
  if (charge.refunded) return false;
  if (charge.amount_refunded >= charge.amount && charge.amount > 0) return false;
  return true;
}
