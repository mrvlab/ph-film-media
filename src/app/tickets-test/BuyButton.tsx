'use client';

import { useState } from 'react';

export function BuyButton({ ticketId }: { ticketId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.error === 'sold_out') {
          setError('Sold out');
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
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        style={{ padding: '10px 16px', cursor: loading ? 'wait' : 'pointer' }}
      >
        {loading ? 'Redirecting…' : 'Buy ticket'}
      </button>
      {error ? (
        <p style={{ color: 'crimson', marginTop: 8 }}>{error}</p>
      ) : null}
    </div>
  );
}
