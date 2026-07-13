'use client';

import { useBuyTicket } from './useBuyTicket';

export function BuyTicketButton({ ticketId }: { ticketId: string }) {
  const { startCheckout, loading, error } = useBuyTicket(ticketId);

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
