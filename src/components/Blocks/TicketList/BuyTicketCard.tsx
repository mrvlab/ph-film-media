'use client';

import type { ReactNode } from 'react';
import { useBuyTicket } from './useBuyTicket';

type BuyTicketCardProps = {
  ticketId: string;
  /** When true (sold out) the card is inert — no click, no checkout. */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps a ticket's content so the entire card acts as the buy button (mobile).
 * Falls back to a plain, non-interactive container when sold out.
 */
export function BuyTicketCard({
  ticketId,
  disabled,
  className,
  children,
}: BuyTicketCardProps) {
  const { startCheckout, loading, error } = useBuyTicket(ticketId);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      role='button'
      tabIndex={0}
      aria-label='Köp biljett'
      aria-disabled={loading || undefined}
      onClick={startCheckout}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startCheckout();
        }
      }}
      className={`cursor-pointer ${loading ? 'cursor-wait' : ''} ${className ?? ''}`}
    >
      {children}
      {error ? <p className='text-b-14 text-red-400'>{error}</p> : null}
    </div>
  );
}
