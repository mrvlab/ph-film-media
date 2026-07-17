'use client';

import { useTicketGate } from './TicketGate';

export function BuyTicketButton() {
  const openGate = useTicketGate();

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={openGate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openGate();
        }
      }}
      className='ticket-button cursor-pointer'
    >
      <span>Köp biljett</span>
    </div>
  );
}
