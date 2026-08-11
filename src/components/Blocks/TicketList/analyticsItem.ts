import type { AnalyticsItem } from '@/lib/analytics/gtag';
import type { ITicketListBlock } from '.';

type TicketRef = NonNullable<ITicketListBlock['tickets']>[number];

/** Shared ticket → GA4 item mapping, used by every step of the ticket funnel. */
export const toTicketItem = (ticket: TicketRef): AnalyticsItem | null => {
  if (!ticket || !('_id' in ticket)) return null;
  return {
    item_id: ticket._id,
    item_name: ticket.title ?? 'Biljett',
    item_category: 'Biljett',
    // The screening venue is the closest thing a ticket has to a variant.
    ...(ticket.venue ? { item_variant: ticket.venue } : {}),
    price: typeof ticket.price === 'number' ? ticket.price : undefined,
    quantity: 1,
  };
};
