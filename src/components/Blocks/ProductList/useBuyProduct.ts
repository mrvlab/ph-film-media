'use client';

import { useEffect, useState } from 'react';

import {
  trackEcommerce,
  trackException,
  type AnalyticsItem,
} from '@/lib/analytics/gtag';

/** What GA4 should report for the product being bought (title, price, size). */
export type CheckoutItem = {
  title: string;
  price: number;
  currency: string | null;
};

/** Shared Stripe-checkout logic for a product size, used by the buy button. */
export function useBuyProduct(item?: CheckoutItem) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset loading if the page is restored from bfcache (back from Stripe).
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setLoading(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  async function startCheckout(productId: string, size: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId,
          size,
          cancelPath: window.location.pathname + window.location.search,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.error === 'sold_out') {
          setError('Slutsåld');
        } else {
          const code = json?.error ?? res.status;
          const detail = json?.message ? ` — ${json.message}` : '';
          setError(`Error: ${code}${detail}`);
        }
        trackException(`product_checkout:${json?.error ?? res.status}`, {
          item_id: productId,
          item_variant: size,
        });
        setLoading(false);
        return;
      }
      if (json.url) {
        // Fired before the redirect so gtag's beacon leaves with the unload.
        if (item) {
          const gaItem: AnalyticsItem = {
            item_id: productId,
            item_name: item.title,
            item_category: 'Produkt',
            item_variant: size,
            price: item.price,
            quantity: 1,
          };
          trackEcommerce('begin_checkout', {
            items: [gaItem],
            currency: item.currency,
          });
        }
        // Stay in loading through the redirect (no reset here).
        window.location.assign(json.url);
        return;
      }
      setError('No checkout URL returned');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      trackException('product_checkout:network', { item_id: productId });
      setLoading(false);
    }
  }

  return { startCheckout, loading, error };
}
