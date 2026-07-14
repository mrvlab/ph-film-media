import 'server-only';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';

// Per-size sold counts for a product, computed from Stripe (the source of
// truth) — like the tickets' computeSeatsSold but bucketed by size, since one
// product id spans several sizes. Counts succeeded, non-refunded PaymentIntents
// (one purchase = one unit) keyed by their `size` metadata; a missing size = 0.
// Stripe search is eventually consistent, so callers may need to wait first.
export async function computeProductSales(
  productId: string
): Promise<Record<string, number>> {
  const publishedId = productId.replace(/^drafts\./, '');
  const query = `metadata['productId']:'${publishedId}' AND status:'succeeded'`;

  const sales: Record<string, number> = {};

  let page: Stripe.ApiSearchResult<Stripe.PaymentIntent> =
    await stripe.paymentIntents.search({
      query,
      limit: 100,
      expand: ['data.latest_charge'],
    });

  while (true) {
    for (const pi of page.data) {
      if (!isPaidAndNotRefunded(pi)) continue;
      const size = pi.metadata?.size;
      if (!size) continue;
      sales[size] = (sales[size] ?? 0) + 1;
    }
    if (!page.next_page) break;
    page = await stripe.paymentIntents.search({
      query,
      limit: 100,
      page: page.next_page,
      expand: ['data.latest_charge'],
    });
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
