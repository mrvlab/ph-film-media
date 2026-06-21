'use client';

import { useState } from 'react';

export function BuyTicketButton({ ticketId }: { ticketId: string }) {
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

  return (
    <div className='space-y-2'>
      <div
        role='button'
        tabIndex={0}
        aria-disabled={loading || undefined}
        onClick={startCheckout}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startCheckout();
          }
        }}
        className={`ticket-button cursor-pointer ${loading ? 'cursor-wait' : ''}`}
      >
        {/* Always render the label so the button keeps its natural width.
            Use `text-transparent` (not `invisible`) so the span's :before/:after
            corner cutouts — which inherit visibility — stay rendered. */}
        <span className={loading ? 'text-transparent' : ''}>Köp biljett</span>
        {loading ? (
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
            {/* Must be <div>, not <span>, so .ticket-button span:before/:after
                cutouts don't get drawn on the spinner. */}
            <div
              aria-hidden='true'
              className='size-4 animate-spin rounded-full border-2 border-black border-t-transparent'
            />
            <div className='sr-only'>Laddar…</div>
          </div>
        ) : null}
      </div>
      {error ? <p className='text-b-14 text-red-400'>{error}</p> : null}
    </div>
  );
}
