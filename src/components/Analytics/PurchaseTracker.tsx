'use client';

import { useEffect, useState } from 'react';

import { trackEvent } from '@/lib/analytics/gtag';

const SENT_KEY = 'phmedia:ga-purchases';

/** Session ids already reported, so a refresh doesn't double-count revenue. */
const alreadySent = (id: string): boolean => {
  try {
    return (sessionStorage.getItem(SENT_KEY) ?? '').split(',').includes(id);
  } catch {
    return false;
  }
};

const markSent = (id: string) => {
  try {
    const prev = sessionStorage.getItem(SENT_KEY);
    sessionStorage.setItem(SENT_KEY, prev ? `${prev},${id}` : id);
  } catch {
    // Private mode — worst case the purchase is sent twice; GA dedupes on
    // transaction_id.
  }
};

/**
 * Sends GA4 `purchase` wherever Stripe drops the buyer back with a
 * `session_id`: /shop/success, /tickets/success, and the membership return URL.
 * Mounted once in the root layout so no success page needs its own wiring.
 *
 * The id is read during render, not in the effect, because the ticket gate
 * strips its return-params in a requestAnimationFrame that can land first.
 */
const PurchaseTracker = () => {
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('session_id');
  });

  useEffect(() => {
    if (!sessionId?.startsWith('cs_') || alreadySent(sessionId)) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/analytics/purchase?session_id=${encodeURIComponent(sessionId)}`
        );
        if (!res.ok || cancelled) return;
        const purchase = await res.json();
        if (cancelled) return;

        markSent(sessionId);
        trackEvent('purchase', purchase);

        // Joining the film club is a sign-up as well as a sale.
        if (purchase.purchase_type === 'Medlemskap') {
          trackEvent('sign_up', { method: 'filmklubben' });
        }
      } catch {
        // Analytics must never break the thank-you page.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return null;
};

export default PurchaseTracker;
