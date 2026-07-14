'use client';

import { useEffect, useState } from 'react';

/** Shared Stripe-checkout logic for a ticket, used by the button and the card. */
export function useBuyTicket(ticketId: string) {
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

  async function startCheckout() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ticketId,
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
        setLoading(false);
        return;
      }
      if (json.url) {
        // Stay in loading through the redirect (no reset here).
        window.location.assign(json.url);
        return;
      }
      setError('No checkout URL returned');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setLoading(false);
    }
  }

  return { startCheckout, loading, error };
}
