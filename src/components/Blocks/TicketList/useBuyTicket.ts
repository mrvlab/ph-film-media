'use client';

import { useState } from 'react';

/** Shared Stripe-checkout logic for a ticket, used by the button and the card. */
export function useBuyTicket(ticketId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return;
      }
      if (json.url) {
        window.location.assign(json.url);
        return;
      }
      setError('No checkout URL returned');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return { startCheckout, loading, error };
}
