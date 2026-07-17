'use client';

import type { ReactNode } from 'react';

import { useTicketGate } from './TicketGate';

type BuyTicketCardProps = {
  /** When true (sold out) the card is inert — no click, no gate. */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps a ticket's content so the entire card opens the members-only gate
 * (mobile). Falls back to a plain, non-interactive container when sold out.
 */
export function BuyTicketCard({
  disabled,
  className,
  children,
}: BuyTicketCardProps) {
  const openGate = useTicketGate();

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      role='button'
      tabIndex={0}
      aria-label='Köp biljett'
      onClick={openGate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openGate();
        }
      }}
      className={`cursor-pointer ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
