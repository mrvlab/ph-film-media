import 'server-only';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';

// Per-size sold counts for a product, computed from Stripe (the source of
// truth) — like the tickets' computeSeatsSold but bucketed by size, since one
// product id spans several sizes. Counts succeeded, non-refunded PaymentIntents
// (one purchase = one unit) keyed by their `size` metadata; a missing size = 0.
//
// Stripe search is eventually consistent, so the sale that triggers a
// `checkout.session.completed` recompute is often not in the search index yet.
// Pass its id as `ensurePaymentIntentId` to fold it in via a strongly-consistent
// direct retrieve, so the just-completed sale is never undercounted. Do NOT pass
// it for refunds.
export async function computeProductSales(
  productId: string,
  ensurePaymentIntentId?: string
): Promise<Record<string, number>> {
  const publishedId = productId.replace(/^drafts\./, '');
  const query = `metadata['productId']:'${publishedId}' AND status:'succeeded'`;

  const sales: Record<string, number> = {};
  // De-dupe by PaymentIntent id so an ensured PI already present in the search
  // results is not counted twice.
  const countedIds = new Set<string>();

  const tally = (pi: Stripe.PaymentIntent) => {
    if (countedIds.has(pi.id)) return;
    if (!isPaidAndNotRefunded(pi)) return;
    const size = pi.metadata?.size;
    if (!size) return;
    countedIds.add(pi.id);
    sales[size] = (sales[size] ?? 0) + 1;
  };

  let page: Stripe.ApiSearchResult<Stripe.PaymentIntent> =
    await stripe.paymentIntents.search({
      query,
      limit: 100,
      expand: ['data.latest_charge'],
    });

  while (true) {
    for (const pi of page.data) tally(pi);
    if (!page.next_page) break;
    page = await stripe.paymentIntents.search({
      query,
      limit: 100,
      page: page.next_page,
      expand: ['data.latest_charge'],
    });
  }

  // Fold in the triggering sale if the index has not caught up to it yet.
  if (ensurePaymentIntentId && !countedIds.has(ensurePaymentIntentId)) {
    const pi = await stripe.paymentIntents.retrieve(ensurePaymentIntentId, {
      expand: ['latest_charge'],
    });
    const matchesProduct =
      pi.metadata?.productId?.replace(/^drafts\./, '') === publishedId;
    if (matchesProduct && pi.status === 'succeeded') {
      tally(pi);
    }
  }

  return sales;
}

function isPaidAndNotRefunded(pi: Stripe.PaymentIntent): boolean {
  const charge = pi.latest_charge as Stripe.Charge | string | null;
  if (!charge || typeof charge === 'string') return false;
  if (charge.refunded) return false;
  if (charge.amount_refunded >= charge.amount && charge.amount > 0) return false;
  return true;
}
