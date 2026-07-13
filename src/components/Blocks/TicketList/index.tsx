import type {
  FetchHomeResult,
  FetchPageResult,
} from '../../../../sanity.types';
import Ticket from './Ticket';
import { TicketCarousel } from './TicketCarousel';

export type ITicketListBlock = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'ticketList' }
>;

const TicketList = (block: ITicketListBlock) => {
  if (block._type !== 'ticketList') return null;

  const tickets = block.tickets ?? [];
  if (tickets.length === 0) return null;
  const count = tickets.length;

  // Bottom spacing defaults to true when unset (40px mobile / 80px desktop).
  const bottomSpacingClass =
    block.bottomSpacing !== false ? 'mb-10 lg:mb-20' : '';

  // The same Ticket card is used throughout; only the wrapper differs:
  // one ticket → standalone, many → peeking carousel.
  if (count > 1) {
    return (
      <TicketCarousel heading={block.heading} className={bottomSpacingClass}>
        {tickets.map((ticket, i) => (
          <Ticket key={('_id' in ticket && ticket._id) || i} ticket={ticket} />
        ))}
      </TicketCarousel>
    );
  }

  return (
    <section
      key={block._key || 'ticketList'}
      className={`page-x-spacing flex flex-col gap-2.5 h-fit uppercase lg:gap-3 ${bottomSpacingClass}`}
    >
      {block.heading ? (
        <h2 className='text-h-67 lg:text-h-37 !leading-[1]'>{block.heading}</h2>
      ) : null}

      <Ticket ticket={tickets[0]} />
    </section>
  );
};

export default TicketList;
